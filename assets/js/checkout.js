/* global firebase */
(function() {
  var db = firebase.firestore();
  var productId = getProductIdFromUrl();
  var product = null;
  
  var loadingEl = document.getElementById('loading');
  var errorEl = document.getElementById('error');
  var checkoutFormEl = document.getElementById('checkout-form');
  var productNameEl = document.getElementById('product-name');
  var productPriceEl = document.getElementById('product-price');
  var paymentAmountEl = document.getElementById('payment-amount');
  var bkashAmountEl = document.getElementById('bkash-amount');
  var customerFormEl = document.getElementById('customer-form');
  var confirmOrderBtn = document.getElementById('confirm-order-btn');
  var backBtn = document.getElementById('back-btn');
  
  function getProductIdFromUrl() {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }
  
  function loadProduct() {
    console.log('Product ID from URL:', productId);
    console.log('Current URL:', window.location.href);
    
    if (!productId) {
      showError('Product ID not found in URL. Please go back to products and try again.');
      return;
    }
    
    console.log('Loading product for checkout:', productId);
    
    // Test Firestore connection first
    db.collection('test').doc('test').get()
      .then(function() {
        console.log('Firestore connection successful, loading product for checkout...');
        return db.collection('products').doc(productId).get();
      })
      .then(function(doc) {
        console.log('Product document exists:', doc.exists);
        console.log('Product document data:', doc.data());
        
        if (!doc.exists) {
          showError('Product not found in database. It may have been deleted.');
          return;
        }
        
        product = doc.data();
        product.id = doc.id;
        
        console.log('Product loaded for checkout:', product);
        displayProduct();
        setupForm();
      })
      .catch(function(error) {
        console.error('Error loading product for checkout:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        if (error.code === 'permission-denied') {
          showError('Permission denied. Check Firestore rules.');
        } else if (error.code === 'unavailable') {
          showError('Database unavailable. Check your internet connection.');
        } else {
          showError('Failed to load product: ' + error.message);
        }
      });
  }
  
  function displayProduct() {
    if (!product) return;
    
    var price = product.price || 0;
    var formattedPrice = '৳' + price;
    
    // Update product name and price in order summary
    productNameEl.textContent = product.name || 'Unnamed Product';
    productPriceEl.textContent = formattedPrice;
    
    // Update price in payment instructions
    if (bkashAmountEl) {
      bkashAmountEl.textContent = formattedPrice;
    }
    
    // Show the checkout form
    if (checkoutFormEl) {
      checkoutFormEl.classList.remove('hidden');
    }
  }
  
  function setupForm() {
    // Show checkout form
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    checkoutFormEl.classList.remove('hidden');
    
    // Setup form validation
    setupValidation();
    
    // Setup back button
    backBtn.onclick = function() {
      window.history.back();
    };
    
    // Setup form submission
    customerFormEl.onsubmit = function(e) {
      e.preventDefault();
      submitOrder();
    };

    // Also handle confirm button click (defensive)
    if (confirmOrderBtn) {
      confirmOrderBtn.addEventListener('click', function(e) {
        e.preventDefault();
        submitOrder();
      });
    }
  }
  
  function setupValidation() {
    var inputs = customerFormEl.querySelectorAll('input[required]');
    inputs.forEach(function(input) {
      input.addEventListener('blur', function() {
        validateField(input);
      });
    });
  }
  
  function validateField(input) {
    var value = input.value.trim();
    var errorElId = input.id + '-error';
    var errorEl = document.getElementById(errorElId);
    var isValid = true;
    var errorMessage = '';
    
    // Clear previous error
    input.classList.remove('error');
    if (errorEl) {
      errorEl.textContent = '';
    }
    
    if (!value) {
      isValid = false;
      errorMessage = 'This field is required';
    } else if (input.type === 'email' && !isValidEmail(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid email address';
    } else if (input.name === 'mobile' && !isValidMobile(value)) {
      isValid = false;
      errorMessage = 'Please enter a valid mobile number';
    } else if (input.name === 'bkashDigits' && !isValidBkashDigits(value)) {
      isValid = false;
      errorMessage = 'Please enter last 2 digits of bKash transaction';
    }
    
    if (!isValid) {
      input.classList.add('error');
      if (errorEl) {
        errorEl.textContent = errorMessage;
      } else {
        console.error('Error element not found for field:', input.id, 'looking for:', errorElId);
      }
    }
    
    return isValid;
  }
  
  function isValidEmail(email) {
    var emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
  
  function isValidMobile(whatsapp) {
    var whatsappRegex = /^[0-9]{11}$/;
    return whatsappRegex.test(whatsapp);
  }
  
  function isValidBkashDigits(digits) {
    var digitsRegex = /^[0-9]{3}$/;
    return digitsRegex.test(digits);
  }
  
  function validateForm() {
    var inputs = customerFormEl.querySelectorAll('input[required]');
    var isValid = true;
    
    inputs.forEach(function(input) {
      if (!validateField(input)) {
        isValid = false;
      }
    });
    
    return isValid;
  }
  
  function submitOrder() {
    console.log('submitOrder called');
    console.log('Product available:', !!product);
    
    if (!validateForm()) {
      console.log('Form validation failed');
      alert('Please fix the errors in the form');
      return;
    }
    
    if (!product) {
      console.log('Product information not available');
      alert('Product information not available');
      return;
    }
    
    // Get form data
    var formData = new FormData(customerFormEl);
    var orderData = {
      productId: product.id,
      productName: product.name,
      productPrice: product.price,
      customerName: formData.get('fullName'),
      customerEmail: formData.get('email'),
      customerPhone: formData.get('mobile'),
      bkashDigits: formData.get('bkashDigits'),
      status: 'pending',
      createdAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    
    console.log('Submitting order:', orderData);
    
    // Disable submit button
    confirmOrderBtn.disabled = true;
    confirmOrderBtn.textContent = 'Processing...';
    
    // Save order to Firestore
    db.collection('orders').add(orderData)
      .then(function(docRef) {
        console.log('Order created with ID:', docRef.id);
        
        // Redirect to thank you page with order ID
        var thankYouUrl = 'thank-you.html?orderId=' + docRef.id;
        console.log('Redirecting to:', thankYouUrl);
        window.location.href = thankYouUrl;
      })
      .catch(function(error) {
        console.error('Error creating order:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        alert('Failed to create order: ' + error.message);
        
        // Re-enable submit button
        confirmOrderBtn.disabled = false;
        confirmOrderBtn.textContent = 'Confirm Order';
      });
  }
  
  function showError(message) {
    // Keep error and loading hidden to avoid noisy UI on checkout
    if (errorEl) {
      errorEl.textContent = '';
      errorEl.classList.add('hidden');
    }
    if (loadingEl) {
      loadingEl.classList.add('hidden');
    }
    // Still log error for debugging
    console.error('Checkout error suppressed:', message);
  }
  
  // Copy button functionality
  document.querySelectorAll('.copy-btn').forEach(function(button) {
    button.addEventListener('click', function() {
      var number = this.getAttribute('data-number');
      navigator.clipboard.writeText(number).then(function() {
        button.textContent = 'Copied!';
        button.classList.add('copied');
        setTimeout(function() {
          button.textContent = 'Copy';
          button.classList.remove('copied');
        }, 2000);
      }).catch(function(err) {
        console.error('Failed to copy:', err);
        alert('Failed to copy number. Please try copying manually.');
      });
    });
  });

  // Load product when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProduct);
  } else {
    loadProduct();
  }
})();
