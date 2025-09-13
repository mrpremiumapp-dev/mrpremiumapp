/* global firebase */
(function() {
  var db = firebase.firestore();
  var productId = getProductIdFromUrl();
  
  var loadingEl = document.getElementById('loading');
  var errorEl = document.getElementById('error');
  var productDetailEl = document.getElementById('product-detail');
  var productImageEl = document.getElementById('product-image');
  var productNameEl = document.getElementById('product-name');
  var productCategoryEl = document.getElementById('product-category');
  var regularPriceEl = document.getElementById('regular-price');
  var discountPriceEl = document.getElementById('discount-price');
  var productDescriptionEl = document.getElementById('product-description');
  var buyNowBtn = document.getElementById('buy-now-btn');
  
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
    
    console.log('Loading product:', productId);
    
    // Test Firestore connection first
    db.collection('test').doc('test').get()
      .then(function() {
        console.log('Firestore connection successful, loading product...');
        return db.collection('products').doc(productId).get();
      })
      .then(function(doc) {
        console.log('Product document exists:', doc.exists);
        console.log('Product document data:', doc.data());
        
        if (!doc.exists) {
          showError('Product not found in database. It may have been deleted.');
          return;
        }
        
        var product = doc.data();
        product.id = doc.id;
        
        console.log('Product loaded successfully:', product);
        displayProduct(product);
      })
      .catch(function(error) {
        console.error('Error loading product:', error);
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
  
  function displayProduct(product) {
    // Update page title
    document.title = product.name + ' - Mr.Premium App';
    
    // Update product image
    productImageEl.src = product.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image';
    productImageEl.alt = product.name;
    
    // Update product info
    productNameEl.textContent = product.name || 'Unnamed Product';
    productCategoryEl.textContent = product.category || 'General';
    
    // Update prices
    if (regularPriceEl) regularPriceEl.textContent = '৳' + (product.regularPrice || 0);
    if (discountPriceEl) discountPriceEl.textContent = '৳' + (product.discountPrice || product.regularPrice || 0);
    
    // Render description with basic HTML support while keeping plain text safe
    productDescriptionEl.innerHTML = sanitizeHtml(product.description || 'No description available.');
    
    // Set up buy now button
    buyNowBtn.onclick = function() {
      window.location.href = 'checkout.html?id=' + product.id;
    };
    
    // Show product details
    loadingEl.classList.add('hidden');
    errorEl.classList.add('hidden');
    productDetailEl.classList.remove('hidden');
  }
  
  // Very basic sanitizer to allow limited HTML while blocking scripts
  function sanitizeHtml(input) {
    if (!input) return '';
    
    // If the content doesn't look like HTML, escape and convert newlines to <br>
    var looksLikeHtml = /<[^>]+>/.test(input);
    if (!looksLikeHtml) {
      return escapeHtml(input).replace(/\n/g, '<br>');
    }
    
    var template = document.createElement('template');
    template.innerHTML = input;
    
    var allowedTags = new Set(['A','B','STRONG','EM','I','U','P','BR','UL','OL','LI','H1','H2','H3','H4','H5','H6','SPAN']);
    var allowedAttrs = {
      'A': new Set(['href','title','target','rel']),
      'SPAN': new Set(['style'])
    };
    
    function walk(node) {
      // Remove comments
      if (node.nodeType === Node.COMMENT_NODE) {
        node.remove();
        return;
      }
      
      if (node.nodeType === Node.ELEMENT_NODE) {
        var tag = node.tagName;
        if (!allowedTags.has(tag)) {
          var text = document.createTextNode(node.textContent || '');
          node.replaceWith(text);
          return;
        }
        
        var attrs = Array.from(node.attributes || []);
        attrs.forEach(function(attr) {
          var name = attr.name.toLowerCase();
          var value = attr.value || '';
          
          // Drop event handlers and javascript: URLs
          if (name.startsWith('on')) {
            node.removeAttribute(attr.name);
            return;
          }
          
          if (tag === 'A') {
            if (!allowedAttrs.A.has(attr.name)) {
              node.removeAttribute(attr.name);
              return;
            }
            if (name === 'href') {
              var safe = value.trim();
              if (!/^https?:\/\//i.test(safe)) {
                node.removeAttribute(attr.name);
                return;
              }
              node.setAttribute('rel', 'noopener noreferrer');
              if (!node.getAttribute('target')) node.setAttribute('target', '_blank');
            }
          } else if (tag === 'SPAN') {
            if (!allowedAttrs.SPAN.has(attr.name)) {
              node.removeAttribute(attr.name);
              return;
            }
          } else {
            // No attributes on other tags
            node.removeAttribute(attr.name);
          }
        });
      }
      
      Array.from(node.childNodes || []).forEach(walk);
    }
    
    Array.from(template.content.childNodes).forEach(walk);
    return template.innerHTML;
  }
  
  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  
  function showError(message) {
    errorEl.textContent = message;
    loadingEl.classList.add('hidden');
    productDetailEl.classList.add('hidden');
    errorEl.classList.remove('hidden');
  }
  
  // Load product when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadProduct);
  } else {
    loadProduct();
  }
})();
