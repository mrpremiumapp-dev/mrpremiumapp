document.addEventListener('DOMContentLoaded', function() {
  // Menu toggle functionality
  var menuToggle = document.getElementById('menuToggle');
  var nav = document.getElementById('primary-navigation');
  
  if (menuToggle && nav) {
    function toggleMenu() {
      var expanded = menuToggle.getAttribute('aria-expanded') === 'true';
      menuToggle.setAttribute('aria-expanded', (!expanded).toString());
      nav.classList.toggle('active');
    }

    menuToggle.addEventListener('click', toggleMenu);
    menuToggle.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        toggleMenu();
      }
    });
  }

  // Search toggle functionality
  const searchToggle = document.getElementById('searchToggle');
  const searchContainer = document.querySelector('.search-container');
  const searchInput = document.getElementById('searchInput');

  if (searchToggle) {
    searchToggle.addEventListener('click', function() {
      // Redirect to products page if on index page
      if (window.location.pathname.endsWith('index.html') || window.location.pathname === '/') {
        window.location.href = 'products.html';
        return;
      }

      // Toggle search on products page
      if (searchContainer) {
        searchContainer.style.display = searchContainer.style.display === 'none' ? 'block' : 'none';
        if (searchContainer.style.display === 'block' && searchInput) {
          searchInput.focus();
        }
      }
    });
  }

  // Initialize search visibility
  if (searchContainer && window.location.pathname.includes('products.html')) {
    searchContainer.style.display = 'block';
  }
});


