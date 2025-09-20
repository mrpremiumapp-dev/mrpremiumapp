/* global firebase */
(() => {
  // Element references
  const loadingEl = document.getElementById('loading');
  const errorEl = document.getElementById('error');
  const productDetailEl = document.getElementById('product-detail');
  const productImageEl = document.getElementById('product-image');
  const productNameEl = document.getElementById('product-name');
  const productCategoryEl = document.getElementById('product-category');
  const regularPriceEl = document.getElementById('regular-price');
  const discountPriceEl = document.getElementById('discount-price');
  const productDescriptionEl = document.getElementById('product-description');
  const buyNowBtn = document.getElementById('buy-now-btn');
  const otherProductsContainer = document.getElementById('other-products');
  
  // Firebase reference
  let db = null;

  // Helper Functions
  function getProductIdFromUrl() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
  }

  function showError(message) {
    console.error('Error:', message);
    if (errorEl) {
      errorEl.textContent = message;
      if (loadingEl) loadingEl.classList.add('hidden');
      if (productDetailEl) productDetailEl.classList.add('hidden');
      errorEl.classList.remove('hidden');
    }
  }

  function escapeHtml(str) {
    if (!str) return '';
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function sanitizeHtml(input) {
    if (!input) return '';
    
    // If content doesn't look like HTML, escape and convert newlines to <br>
    const looksLikeHtml = /<[^>]+>/.test(input);
    if (!looksLikeHtml) {
      return escapeHtml(input).replace(/\n/g, '<br>');
    }
    
    const template = document.createElement('template');
    template.innerHTML = input.trim();
    
    const allowedTags = new Set(['A','B','STRONG','EM','I','U','P','BR','UL','OL','LI','H1','H2','H3','H4','H5','H6','SPAN']);
    const allowedAttrs = {
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
        const tag = node.tagName;
        if (!allowedTags.has(tag)) {
          const text = document.createTextNode(node.textContent || '');
          node.replaceWith(text);
          return;
        }
        
        Array.from(node.attributes || []).forEach(attr => {
          const name = attr.name.toLowerCase();
          
          // Drop event handlers and javascript: URLs
          if (name.startsWith('on')) {
            node.removeAttribute(name);
            return;
          }
          
          if (tag === 'A') {
            if (!allowedAttrs.A.has(name)) {
              node.removeAttribute(name);
              return;
            }
            if (name === 'href') {
              const safe = attr.value.trim();
              if (!/^https?:\/\//i.test(safe)) {
                node.removeAttribute(name);
                return;
              }
              node.setAttribute('rel', 'noopener noreferrer');
              node.setAttribute('target', '_blank');
            }
          } else if (tag === 'SPAN') {
            if (!allowedAttrs.SPAN.has(name)) {
              node.removeAttribute(name);
            }
          } else {
            // No attributes on other tags
            node.removeAttribute(name);
          }
        });
      }
      
      Array.from(node.childNodes || []).forEach(walk);
    }
    
    Array.from(template.content.childNodes).forEach(walk);
    return template.innerHTML;
  }

  // Firebase initialization
  async function initFirebase() {
    try {
      console.log('Initializing Firebase...');
      return new Promise((resolve, reject) => {
        let attempts = 0;
        const checkFirebase = () => {
          attempts++;
          console.log('Checking Firebase initialization, attempt:', attempts);
          if (typeof firebase !== 'undefined' && firebase.apps.length > 0) {
            db = firebase.firestore();
            console.log('Firebase initialized successfully');
            resolve();
          } else if (attempts < 20) {
            setTimeout(checkFirebase, 250);
          } else {
            reject(new Error('Firebase failed to initialize after 20 attempts'));
          }
        };
        checkFirebase();
      });
    } catch (error) {
      console.error('Failed to initialize Firebase:', error);
      throw error;
    }
  }

  async function loadProduct() {
    const productId = getProductIdFromUrl();
    console.log('Loading product details for ID:', productId);
    
    if (!productId) {
      showError('Product ID not found in URL. Please go back to products and try again.');
      return;
    }
    
    if (!db) {
      showError('Database not initialized. Please try refreshing the page.');
      return;
    }

    try {
      // Show loading state
      if (loadingEl) loadingEl.classList.remove('hidden');
      if (errorEl) errorEl.classList.add('hidden');
      if (productDetailEl) productDetailEl.classList.add('hidden');
      
      const doc = await db.collection('products').doc(productId).get();
      
      if (!doc.exists) {
        showError('Product not found in database. It may have been deleted.');
        return;
      }
      
      const product = doc.data();
      product.id = doc.id;
      console.log('Product loaded successfully:', product);
      
      displayProduct(product);
      loadOtherProducts(productId);
    } catch (error) {
      console.error('Error loading product:', error);
      
      if (error.code === 'permission-denied') {
        showError('Permission denied. Check Firestore rules.');
      } else if (error.code === 'unavailable') {
        showError('Database unavailable. Check your internet connection.');
      } else {
        showError('Failed to load product: ' + error.message);
      }
    }
  }

  function displayProduct(product) {
    if (!product) return;

    // Update page title
    document.title = `${product.name} - Mr.Premium App`;
    
    // Update product image
    if (productImageEl) {
      productImageEl.src = product.imageUrl || 'https://via.placeholder.com/400x400?text=No+Image';
      productImageEl.alt = product.name;
    }
    
    // Update product info
    if (productNameEl) {
      productNameEl.textContent = product.name || 'Unnamed Product';
    }
    
    if (productCategoryEl) {
      productCategoryEl.textContent = product.category || 'General';
    }
    
    // Update prices
    if (regularPriceEl) {
      const regularPrice = product.regularPrice || 0;
      regularPriceEl.textContent = '৳' + regularPrice.toLocaleString();
      regularPriceEl.style.display = product.discountPrice ? 'block' : 'none';
    }
    
    if (discountPriceEl) {
      const displayPrice = product.discountPrice || product.regularPrice || 0;
      discountPriceEl.textContent = '৳' + displayPrice.toLocaleString();
    }
    
    // Update description with sanitized HTML
    if (productDescriptionEl) {
      productDescriptionEl.innerHTML = sanitizeHtml(product.description || 'No description available.');
    }
    
    // Setup buy now button
    if (buyNowBtn) {
      buyNowBtn.onclick = () => window.location.href = `checkout.html?id=${product.id}`;
    }
    
    // Show product details and hide loading/error states
    if (loadingEl) loadingEl.classList.add('hidden');
    if (errorEl) errorEl.classList.add('hidden');
    if (productDetailEl) productDetailEl.classList.remove('hidden');
  }

  async function loadOtherProducts(currentProductId) {
    if (!db || !otherProductsContainer) return;

    try {
      // Clear existing content
      otherProductsContainer.innerHTML = `
        <style>
          .scroll-container {
            width: 100%;
            overflow-x: auto;
            -webkit-overflow-scrolling: touch;
            scrollbar-width: thin;
            scrollbar-color: #4CAF50 #f0f0f0;
            padding: 0;
            margin: 0 -15px;  /* Negative margin to align with edges */
          }
          
          .scroll-container::-webkit-scrollbar {
            height: 6px;
          }
          
          .scroll-container::-webkit-scrollbar-track {
            background: #f0f0f0;
            border-radius: 3px;
          }
          
          .scroll-container::-webkit-scrollbar-thumb {
            background: #4CAF50;
            border-radius: 3px;
          }
          
          .products-scroll {
            display: flex;
            gap: 12px;
            padding: 0 15px; /* Add padding to align first card */
            width: max-content;
          }
          
          .product-card {
            flex: 0 0 200px; /* Fixed width for mobile */
            max-width: 200px;
            background: white;
            border-radius: 8px;
            padding: 8px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
          }
          
          @media (min-width: 768px) {
            .product-card {
              flex: 0 0 250px; /* Slightly larger on tablets/desktop */
              max-width: 250px;
            }
          }
        </style>
        <div class="scroll-container">
          <div class="products-scroll"></div>
        </div>
      `;
      
      const productsScroll = otherProductsContainer.querySelector('.products-scroll');
      if (!productsScroll) return;

      const snapshot = await db.collection('products')
        .orderBy('name')
        .limit(10)
        .get();
      
      let count = 0;
      snapshot.forEach(doc => {
        if (doc.id === currentProductId || count >= 10) return;
        const productData = doc.data();
        productData.id = doc.id;
        count++;
        
        const productDiv = document.createElement('div');
        productDiv.className = 'product-card';
        productDiv.style.cursor = 'pointer';
        
        productDiv.innerHTML = `
          <img src="${productData.imageUrl || 'https://via.placeholder.com/200x200?text=No+Image'}"
               alt="${escapeHtml(productData.name || 'Product')}"
               loading="lazy"
               style="width: 100%; height: 150px; object-fit: cover; border-radius: 6px;">
          <h3 style="font-size: 1rem; margin: 8px 0; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; line-height: 1.3;">${escapeHtml(productData.name || 'Unnamed Product')}</h3>
          <div style="min-height: 40px; display: flex; flex-direction: column; gap: 2px;">
            ${productData.regularPrice ? `
              <p class="regular-price" style="text-decoration: line-through; color: #666; margin: 0; font-size: 0.9rem; line-height: 1;">
                ৳${productData.regularPrice.toLocaleString()}
              </p>
            ` : ''}
            <p class="discount-price" style="color: #4CAF50; font-weight: bold; font-size: 1.2rem; margin: 0; line-height: 1.2;">
              ৳${(productData.discountPrice || productData.regularPrice || 0).toLocaleString()}
            </p>
          </div>
          <div class="button-container" style="display: flex; gap: 6px; margin-top: 8px;">
            <button class="view-details" style="background: #666; flex: 1; border: none; color: white; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Details</button>
            <button class="buy-now" style="background: #4CAF50; flex: 1; border: none; color: white; padding: 6px; border-radius: 4px; cursor: pointer; font-size: 0.9rem;">Buy Now</button>
          </div>
        `;
        
        // Add click handlers
        productDiv.querySelector('.view-details').onclick = (e) => {
          e.stopPropagation();
          window.location.href = 'product-detail.html?id=' + productData.id;
        };
        
        productDiv.querySelector('.buy-now').onclick = (e) => {
          e.stopPropagation();
          window.location.href = 'checkout.html?id=' + productData.id;
        };
        
        productDiv.onclick = () => {
          window.location.href = 'product-detail.html?id=' + productData.id;
        };
        
        productsScroll.appendChild(productDiv);
      });

      if (count === 0) {
        otherProductsContainer.innerHTML = '<p style="text-align: center; color: #666;">No other products found</p>';
      }
    } catch (error) {
      console.error('Error loading other products:', error);
      otherProductsContainer.innerHTML = '<p style="text-align: center; color: #f44336;">Failed to load other products</p>';
    }
  }

  // Initialize when the page is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAndLoad);
  } else {
    initAndLoad();
  }

  async function initAndLoad() {
    try {
      await initFirebase();
      await loadProduct();
    } catch (error) {
      console.error('Initialization error:', error);
      showError('Failed to initialize: ' + error.message);
    }
  }
})();