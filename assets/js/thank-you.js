/* global firebase */
(function() {
  var db = firebase.firestore();
  var orderId = getOrderIdFromUrl();
  
  var orderIdEl = document.getElementById('order-id');
  var productNameEl = document.getElementById('product-name');
  var orderAmountEl = document.getElementById('order-amount');
  var customerNameEl = document.getElementById('customer-name');
  
  function getOrderIdFromUrl() {
    var urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('orderId');
  }
  
  function loadOrder() {
    if (!orderId) {
      console.log('No order ID in URL');
      showDefaultInfo();
      return;
    }
    
    console.log('Loading order:', orderId);
    
    db.collection('orders').doc(orderId).get()
      .then(function(doc) {
        if (!doc.exists) {
          console.log('Order not found');
          showDefaultInfo();
          return;
        }
        
        var order = doc.data();
        console.log('Order loaded:', order);
        displayOrder(order);
      })
      .catch(function(error) {
        console.error('Error loading order:', error);
        showDefaultInfo();
      });
  }
  
  function displayOrder(order) {
    orderIdEl.textContent = orderId;
    productNameEl.textContent = order.productName || 'Unknown Product';
    orderAmountEl.textContent = '৳' + (order.productPrice || 0);
    customerNameEl.textContent = order.customerName || 'Unknown Customer';
  }
  
  function showDefaultInfo() {
    orderIdEl.textContent = 'N/A';
    productNameEl.textContent = 'Product Order';
    orderAmountEl.textContent = '৳0';
    customerNameEl.textContent = 'Customer';
  }
  
  // Load order when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadOrder);
  } else {
    loadOrder();
  }
})();
