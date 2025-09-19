/* global firebase */
(function() {
  // Initialize Firebase if not already done
  if (typeof firebase === 'undefined') {
    console.error('Firebase not loaded. Make sure firebase-config.js is included.');
    return;
  }

  var db = firebase.firestore();
  var productsContainer = document.querySelector('.products');
  var searchInput = document.getElementById('searchInput');
  var clearSearchBtn = document.getElementById('clearSearch');
  var allProducts = []; // Store all products for filtering
  
  if (!productsContainer) {
    console.log('No products container found on this page');
    return;
  }

  // Search functionality
  function initializeSearch() {
    if (searchInput) {
      searchInput.addEventListener('input', function(e) {
        const searchTerm = e.target.value.toLowerCase().trim();
        filterProducts(searchTerm);
      });
    }

    if (clearSearchBtn) {
      clearSearchBtn.addEventListener('click', function() {
        searchInput.value = '';
        filterProducts('');
        searchInput.focus();
      });
    }
  }

  function filterProducts(searchTerm) {
    if (!searchTerm) {
      // Show all products
      displayProducts(allProducts);
      return;
    }

    const filteredProducts = allProducts.filter(product => {
      const name = (product.name || '').toLowerCase();
      const description = (product.description || '').toLowerCase();
      const category = (product.category || '').toLowerCase();
      
      return name.includes(searchTerm) || 
             description.includes(searchTerm) || 
             category.includes(searchTerm);
    });

    displayProducts(filteredProducts);
  }

  function displayProducts(products) {
    productsContainer.innerHTML = '';
    if (products.length === 0) {
      productsContainer.innerHTML = '<div class="no-results">No products found</div>';
      return;
    }
    products.forEach(product => {
      productsContainer.appendChild(createProductCard(product));
    });
  }

  function createProductCard(product) {
    var productDiv = document.createElement('div');
    productDiv.className = 'product';
    
    var img = document.createElement('img');
    img.src = product.imageUrl || 'https://via.placeholder.com/200x200?text=No+Image';
    img.alt = product.name || 'Product';
    img.loading = 'lazy';
    img.style.cursor = 'pointer';
    img.onclick = function() {
      window.location.href = 'product-detail.html?id=' + product.id;
    };
    
    var h3 = document.createElement('h3');
    h3.textContent = product.name || 'Unnamed Product';
    h3.style.minHeight = '2.4em'; // Ensure consistent height for product names
    
    var priceContainer = document.createElement('div');
    priceContainer.style.minHeight = '40px'; // Reduced fixed height for price container
    priceContainer.style.display = 'flex';
    priceContainer.style.flexDirection = 'column';
    priceContainer.style.gap = '2px'; // Consistent with other gaps
    priceContainer.style.justifyContent = 'center';
    
    var regularPrice = document.createElement('p');
    regularPrice.className = 'regular-price';
    regularPrice.style.textDecoration = 'line-through';
    regularPrice.style.color = '#666';
    regularPrice.style.margin = '0';
    regularPrice.style.fontSize = '1.1em';
    regularPrice.style.lineHeight = '1';
    regularPrice.textContent = product.regularPrice ? '৳' + product.regularPrice : '';
    
    var discountPrice = document.createElement('p');
    discountPrice.className = 'discount-price';
    discountPrice.style.color = '#4CAF50';
    discountPrice.style.fontWeight = 'bold';
    discountPrice.style.fontSize = '1.5em';
    discountPrice.style.margin = '0';
    discountPrice.style.lineHeight = '1.2';
    discountPrice.textContent = product.discountPrice ? '৳' + product.discountPrice : 'Price TBD';
    
    priceContainer.appendChild(regularPrice);
    priceContainer.appendChild(discountPrice);
    
    // Create button container
    var buttonContainer = document.createElement('div');
    buttonContainer.className = 'button-container';
    buttonContainer.style.display = 'flex';
    buttonContainer.style.gap = '8px';
    buttonContainer.style.marginTop = '4px';
    
    // View Details button
    var viewDetailsBtn = document.createElement('button');
    viewDetailsBtn.textContent = 'View Details';
    viewDetailsBtn.className = 'view-details';
    viewDetailsBtn.style.background = '#666';
    viewDetailsBtn.style.flex = '1';
    viewDetailsBtn.onclick = function() {
      console.log('View Details clicked for product:', product.id);
      var url = 'product-detail.html?id=' + product.id;
      console.log('Navigating to:', url);
      window.location.href = url;
    };
    
    // Buy Now button
    var buyNowBtn = document.createElement('button');
    buyNowBtn.textContent = 'Buy Now';
    buyNowBtn.className = 'view-details';
    buyNowBtn.style.background = '#4CAF50';
    buyNowBtn.style.flex = '1';
    buyNowBtn.onclick = function() {
      console.log('Buy Now clicked for product:', product.id);
      var url = 'checkout.html?id=' + product.id;
      console.log('Navigating to:', url);
      window.location.href = url;
    };
    
    buttonContainer.appendChild(viewDetailsBtn);
    buttonContainer.appendChild(buyNowBtn);
    
    productDiv.appendChild(img);
    productDiv.appendChild(h3);
    productDiv.appendChild(priceContainer);
    productDiv.appendChild(buttonContainer);
    productDiv.appendChild(h3);
    productDiv.appendChild(priceContainer);
    productDiv.appendChild(buttonContainer);
    
    return productDiv;
  }

  function loadProducts() {
    console.log('Loading products from Firestore...');
    console.log('Firebase app:', firebase.app());
    console.log('Firestore db:', db);
    
    // Show loading state
    productsContainer.innerHTML = '<div style="text-align: center; padding: 40px;">Loading products...</div>';
    
    // Initialize search before loading products
    initializeSearch();
    
    // First try to load all products without filters to test connection
    // Determine if we need to filter by type based on the current page
    const isIndexPage = window.location.pathname.endsWith('index.html') || window.location.pathname.endsWith('/');
    const isSubscriptionPage = window.location.pathname.includes('subscription.html');
    const urlParams = new URLSearchParams(window.location.search);
    const urlType = urlParams.get('type');
    
    // Don't filter by type on index page
    let productType = null;
    if (!isIndexPage) {
      if (isSubscriptionPage) {
        productType = 'subscription';
      } else if (urlType === 'pc') {
        productType = 'pc';
      } else if (urlType === 'android') {
        productType = 'android';
      } else if (!urlType) {
        productType = 'product';
      }
    }

    db.collection('products')
      .get()
      .then(function(snapshot) {
        console.log('All products loaded:', snapshot.docs.length);
        
        // Filter active products and by type (if not on index page)
        var activeProducts = snapshot.docs.filter(function(doc) {
          var data = doc.data();
          const isActive = data.status === 'active' || !data.status;
          
          // On index page, show all active products regardless of type
          if (isIndexPage) {
            return isActive;
          }
          
          // On other pages, filter by type
          return isActive && (!data.type || data.type === productType);
        });
        
        console.log('Active products:', activeProducts.length);
        
        // Store all products for search functionality
        allProducts = activeProducts.map(doc => {
          const data = doc.data();
          return { ...data, id: doc.id };
        });
        
        if (activeProducts.length === 0) {
          if (snapshot.docs.length === 0) {
            productsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No products in database yet. Add some products in the admin panel!</div>';
          } else {
            productsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #666;">No active products available. Check admin panel to activate products.</div>';
          }
          return;
        }
        
        // Clear container
        productsContainer.innerHTML = '';
        
        // Add each product
        activeProducts.forEach(function(doc) {
          var product = doc.data();
          product.id = doc.id;
          console.log('Adding product:', product);
          console.log('Product ID:', product.id);
          console.log('Product name:', product.name);
          var productCard = createProductCard(product);
          productsContainer.appendChild(productCard);
        });
        
        // Add fade-in animation
        var products = productsContainer.querySelectorAll('.product');
        products.forEach(function(product, index) {
          product.style.opacity = '0';
          product.style.transform = 'translateY(20px)';
          setTimeout(function() {
            product.style.transition = 'opacity 0.5s ease, transform 0.5s ease';
            product.style.opacity = '1';
            product.style.transform = 'translateY(0)';
          }, index * 100);
        });
      })
      .catch(function(error) {
        console.error('Error loading products:', error);
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        
        var errorMessage = 'Failed to load products. ';
        if (error.code === 'permission-denied') {
          errorMessage += 'Permission denied. Check Firestore rules.';
        } else if (error.code === 'unavailable') {
          errorMessage += 'Service unavailable. Check your internet connection.';
        } else {
          errorMessage += 'Error: ' + error.message;
        }
        
        productsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">' + errorMessage + '</div>';
      });
  }

  // Test Firestore connection first
  function testConnection() {
    console.log('Testing Firestore connection...');
    db.collection('test').doc('connection').get()
      .then(function(doc) {
        console.log('Firestore connection test successful');
        loadProducts();
      })
      .catch(function(error) {
        console.error('Firestore connection test failed:', error);
        productsContainer.innerHTML = '<div style="text-align: center; padding: 40px; color: #f44336;">Cannot connect to database. Check Firebase configuration and internet connection.</div>';
      });
  }

  // Load products when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', testConnection);
  } else {
    testConnection();
  }

  // Make loadProducts available globally for manual refresh
  window.loadProducts = loadProducts;
})();
