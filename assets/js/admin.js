/* global firebase */
(function () {
  var auth = firebase.auth();
  var db = firebase.firestore();

  var loginSection = document.getElementById('loginSection');
  var ordersSection = document.getElementById('ordersSection');
  var productsSection = document.getElementById('productsSection');
  var adminNav = document.getElementById('adminNav');
  var loginBtn = document.getElementById('loginBtn');
  var emailEl = document.getElementById('adminEmail');
  var passEl = document.getElementById('adminPassword');
  var signOutBtn = document.getElementById('signOutBtn');
  var signOutBtn2 = document.getElementById('signOutBtn2');
  var refreshBtn = document.getElementById('refreshBtn');
  var ordersTbody = document.getElementById('ordersTbody');
  var ordersInfo = document.getElementById('ordersInfo');
  
  // Product management elements
  var addProductBtn = document.getElementById('addProductBtn');
  var refreshProductsBtn = document.getElementById('refreshProductsBtn');
  var productFormSection = document.getElementById('productFormSection');
  var productFormTitle = document.getElementById('productFormTitle');
  var productName = document.getElementById('productName');
  var productDescription = document.getElementById('productDescription');
  var regularPrice = document.getElementById('regularPrice');
  var discountPrice = document.getElementById('discountPrice');
  var productImageUrl = document.getElementById('productImageUrl');
  var productCategory = document.getElementById('productCategory');
  var productStatus = document.getElementById('productStatus');
  var saveProductBtn = document.getElementById('saveProductBtn');
  var cancelProductBtn = document.getElementById('cancelProductBtn');
  var productsTbody = document.getElementById('productsTbody');
  var productsInfo = document.getElementById('productsInfo');
  var ordersTab = document.getElementById('ordersTab');
  var productsTab = document.getElementById('productsTab');
  
  var currentEditingProductId = null;

  function setLoading(isLoading) {
    if (isLoading) {
      ordersInfo.textContent = 'Loading orders...';
    } else {
      ordersInfo.textContent = 'Showing latest orders';
    }
  }

  function formatTimestamp(ts) {
    if (!ts) return '';
    var date = ts.toDate ? ts.toDate() : new Date(ts);
    return date.toLocaleString();
  }

  function renderOrders(docs) {
    ordersTbody.innerHTML = '';
    if (!docs.length) {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 10;
      td.textContent = 'No orders found.';
      tr.appendChild(td);
      ordersTbody.appendChild(tr);
      return;
    }
    docs.forEach(function (doc) {
      var data = doc.data();
      var tr = document.createElement('tr');
      function td(val) { var c = document.createElement('td'); c.textContent = val == null ? '' : String(val); return c; }
      tr.appendChild(td(doc.id));
      tr.appendChild(td(data.customerName || ''));
      tr.appendChild(td(data.customerEmail || ''));
      tr.appendChild(td(data.customerPhone || ''));
      tr.appendChild(td(data.bkashDigits || ''));
      tr.appendChild(td(data.productName || ''));
      tr.appendChild(td(data.productPrice != null ? '৳' + data.productPrice : ''));
      tr.appendChild(td(formatTimestamp(data.createdAt)));

      var isComplete = (data.status === 'complete') || (data.completed === true);
      tr.appendChild(td(isComplete ? 'Complete' : 'Incomplete'));

      var actionsTd = document.createElement('td');

      var toggleBtn = document.createElement('button');
      toggleBtn.className = 'btn';
      toggleBtn.style.background = isComplete ? '#ff9800' : '#4CAF50';
      toggleBtn.style.marginRight = '5px';
      toggleBtn.textContent = isComplete ? 'Mark Incomplete' : 'Mark Complete';
      toggleBtn.onclick = function () {
        updateOrderStatus(doc.id, !isComplete);
      };

      var deleteBtn = document.createElement('button');
      deleteBtn.className = 'btn';
      deleteBtn.style.background = '#f44336';
      deleteBtn.textContent = 'Delete';
      deleteBtn.onclick = function () {
        deleteOrder(doc.id);
      };

      actionsTd.appendChild(toggleBtn);
      actionsTd.appendChild(deleteBtn);
      tr.appendChild(actionsTd);

      ordersTbody.appendChild(tr);
    });
  }

  function loadOrders() {
    setLoading(true);
    return db.collection('orders')
      .orderBy('createdAt', 'desc')
      .limit(100)
      .get()
      .then(function (snap) {
        renderOrders(snap.docs);
      })
      .catch(function (err) {
        console.error(err);
        ordersInfo.textContent = 'Failed to load orders';
      })
      .finally(function () { setLoading(false); });
  }

  function setProductsLoading(isLoading) {
    if (isLoading) {
      productsInfo.textContent = 'Loading products...';
    } else {
      productsInfo.textContent = 'Showing all products';
    }
  }

  function renderProducts(docs) {
    productsTbody.innerHTML = '';
    if (!docs.length) {
      var tr = document.createElement('tr');
      var td = document.createElement('td');
      td.colSpan = 8;
      td.textContent = 'No products found.';
      tr.appendChild(td);
      productsTbody.appendChild(tr);
      return;
    }
    docs.forEach(function (doc) {
      var data = doc.data();
      var tr = document.createElement('tr');
      function td(val) { var c = document.createElement('td'); c.textContent = val == null ? '' : String(val); return c; }
      tr.appendChild(td(data.name || ''));
      tr.appendChild(td(data.description || ''));
      tr.appendChild(td(data.regularPrice != null ? '৳' + data.regularPrice : ''));
      tr.appendChild(td(data.discountPrice != null ? '৳' + data.discountPrice : ''));
      tr.appendChild(td(data.category || ''));
      tr.appendChild(td(data.status || ''));
      tr.appendChild(td(formatTimestamp(data.createdAt)));
      
      var actionsTd = document.createElement('td');
      var editBtn = document.createElement('button');
      editBtn.textContent = 'Edit';
      editBtn.className = 'btn';
      editBtn.style.background = '#4CAF50';
      editBtn.style.marginRight = '5px';
      editBtn.onclick = function() { editProduct(doc.id, data); };
      
      var deleteBtn = document.createElement('button');
      deleteBtn.textContent = 'Delete';
      deleteBtn.className = 'btn';
      deleteBtn.style.background = '#f44336';
      deleteBtn.onclick = function() { deleteProduct(doc.id); };
      
      actionsTd.appendChild(editBtn);
      actionsTd.appendChild(deleteBtn);
      tr.appendChild(actionsTd);
      productsTbody.appendChild(tr);
    });
  }

  function loadProducts() {
    setProductsLoading(true);
    return db.collection('products')
      .orderBy('createdAt', 'desc')
      .get()
      .then(function (snap) {
        renderProducts(snap.docs);
      })
      .catch(function (err) {
        console.error(err);
        productsInfo.textContent = 'Failed to load products';
      })
      .finally(function () { setProductsLoading(false); });
  }

  function clearProductForm() {
    productName.value = '';
    productDescription.value = '';
    regularPrice.value = '';
    discountPrice.value = '';
    productImageUrl.value = '';
    productCategory.value = '';
    productStatus.value = 'active';
    currentEditingProductId = null;
    productFormTitle.textContent = 'Add Product';
  }

  function showProductForm() {
    productFormSection.classList.remove('hidden');
    clearProductForm();
  }

  function hideProductForm() {
    productFormSection.classList.add('hidden');
    clearProductForm();
  }

  function editProduct(productId, productData) {
    currentEditingProductId = productId;
    productName.value = productData.name || '';
    productDescription.value = productData.description || '';
    regularPrice.value = productData.regularPrice || '';
    discountPrice.value = productData.discountPrice || '';
    productImageUrl.value = productData.imageUrl || '';
    productCategory.value = productData.category || '';
    productStatus.value = productData.status || 'active';
    productFormTitle.textContent = 'Edit Product';
    productFormSection.classList.remove('hidden');
  }

  function saveProduct() {
    console.log('saveProduct called');
    
    if (!productName || !regularPrice || !discountPrice) {
      console.error('Product form elements not found');
      alert('Form elements not found. Please refresh the page.');
      return;
    }
    
    var name = productName.value.trim();
    var description = productDescription.value.trim();
    var regPrice = parseFloat(regularPrice.value);
    var discPrice = parseFloat(discountPrice.value);
    var imageUrl = productImageUrl.value.trim();
    var category = productCategory.value.trim();
    var status = productStatus.value;

    console.log('Product data:', { name, description, regPrice, discPrice, imageUrl, category, status });

    if (!name || !regPrice || isNaN(regPrice) || !discPrice || isNaN(discPrice)) {
      alert('Please fill in product name and valid prices');
      return;
    }

    if (discPrice > regPrice) {
      alert('Discount price cannot be higher than regular price');
      return;
    }

    var productData = {
      name: name,
      description: description,
      regularPrice: regPrice,
      discountPrice: discPrice,
      imageUrl: imageUrl,
      category: category,
      status: status,
      type: document.getElementById('productType').value,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };

    console.log('Saving product data:', productData);

    if (currentEditingProductId) {
      // Update existing product
      console.log('Updating product:', currentEditingProductId);
      db.collection('products').doc(currentEditingProductId).update(productData)
        .then(function() {
          console.log('Product updated successfully');
          alert('Product updated successfully');
          hideProductForm();
          loadProducts();
        })
        .catch(function(err) {
          console.error('Update error:', err);
          alert('Failed to update product: ' + err.message);
        });
    } else {
      // Add new product
      console.log('Adding new product');
      productData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      db.collection('products').add(productData)
        .then(function(docRef) {
          console.log('Product added successfully with ID:', docRef.id);
          alert('Product added successfully');
          hideProductForm();
          loadProducts();
        })
        .catch(function(err) {
          console.error('Add error:', err);
          alert('Failed to add product: ' + err.message);
        });
    }
  }

  function deleteProduct(productId) {
    if (confirm('Are you sure you want to delete this product?')) {
      db.collection('products').doc(productId).delete()
        .then(function() {
          alert('Product deleted successfully');
          loadProducts();
        })
        .catch(function(err) {
          console.error(err);
          alert('Failed to delete product');
        });
    }
  }

  function deleteOrder(orderId) {
    if (confirm('Are you sure you want to delete this order?')) {
      db.collection('orders').doc(orderId).delete()
        .then(function () {
          alert('Order deleted successfully');
          loadOrders();
        })
        .catch(function (err) {
          console.error(err);
          alert('Failed to delete order: ' + err.message);
        });
    }
  }

  function updateOrderStatus(orderId, isComplete) {
    var updates = {
      status: isComplete ? 'complete' : 'incomplete',
      completed: isComplete,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    db.collection('orders').doc(orderId).set(updates, { merge: true })
      .then(function () {
        loadOrders();
      })
      .catch(function (err) {
        console.error(err);
        alert('Failed to update order: ' + err.message);
      });
  }

  function showTab(tabName) {
    if (tabName === 'orders') {
      ordersSection.classList.remove('hidden');
      productsSection.classList.add('hidden');
      ordersTab.style.background = '#4CAF50';
      productsTab.style.background = '#000';
    } else if (tabName === 'products') {
      ordersSection.classList.add('hidden');
      productsSection.classList.remove('hidden');
      ordersTab.style.background = '#000';
      productsTab.style.background = '#4CAF50';
    }
  }

  loginBtn.addEventListener('click', function () {
    var email = emailEl.value.trim();
    var password = passEl.value;
    if (!email || !password) {
      alert('Enter email and password');
      return;
    }
    auth.signInWithEmailAndPassword(email, password)
      .catch(function (err) { alert(err.message); });
  });

  signOutBtn.addEventListener('click', function () {
    auth.signOut();
  });

  signOutBtn2.addEventListener('click', function () {
    auth.signOut();
  });

  refreshBtn.addEventListener('click', function () {
    loadOrders();
  });

  // Product management event listeners
  if (addProductBtn) {
    addProductBtn.addEventListener('click', function () {
      showProductForm();
    });
  } else {
    console.error('addProductBtn not found');
  }

  if (refreshProductsBtn) {
    refreshProductsBtn.addEventListener('click', function () {
      loadProducts();
    });
  } else {
    console.error('refreshProductsBtn not found');
  }

  if (saveProductBtn) {
    saveProductBtn.addEventListener('click', function () {
      saveProduct();
    });
  } else {
    console.error('saveProductBtn not found');
  }

  if (cancelProductBtn) {
    cancelProductBtn.addEventListener('click', function () {
      hideProductForm();
    });
  } else {
    console.error('cancelProductBtn not found');
  }

  // Tab navigation
  ordersTab.addEventListener('click', function () {
    showTab('orders');
  });

  productsTab.addEventListener('click', function () {
    showTab('products');
  });

  // Test Firebase connection
  console.log('Firebase auth:', auth);
  console.log('Firebase db:', db);
  
  // Test Firestore connection
  db.collection('test').doc('test').get()
    .then(function(doc) {
      console.log('Firestore connection successful');
    })
    .catch(function(err) {
      console.error('Firestore connection failed:', err);
    });

  auth.onAuthStateChanged(function (user) {
    console.log('Auth state changed:', user ? 'logged in' : 'logged out');
    if (user) {
      loginSection.classList.add('hidden');
      adminNav.classList.remove('hidden');
      ordersSection.classList.remove('hidden');
      productsSection.classList.add('hidden');
      loadOrders();
      loadProducts();
    } else {
      adminNav.classList.add('hidden');
      ordersSection.classList.add('hidden');
      productsSection.classList.add('hidden');
      loginSection.classList.remove('hidden');
    }
  });
})();



