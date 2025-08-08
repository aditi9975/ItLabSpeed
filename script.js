let allProducts = [];
let chartInstance = null;

// Fetch products from FakeStoreAPI
async function fetchProducts() {
  const res = await fetch('https://fakestoreapi.com/products');
  return await res.json();
}

function getUniqueCategories(products) {
  return [...new Set(products.map(p => p.category))];
}

// Populate category filter dropdown
function updateCategoryFilter(products) {
  const select = document.getElementById('categoryFilter');
  select.innerHTML = '<option value="all">All Categories</option>';
  getUniqueCategories(products).forEach(cat => {
    const opt = document.createElement('option');
    opt.value = cat;
    opt.textContent = cat.charAt(0).toUpperCase() + cat.slice(1);
    select.appendChild(opt);
  });
}

function filterProducts(filters) {
  return allProducts.filter(p =>
    (filters.category === 'all' || p.category === filters.category) &&
    (isNaN(filters.priceMin) || p.price >= filters.priceMin) &&
    (isNaN(filters.priceMax) || p.price <= filters.priceMax) &&
    (isNaN(filters.ratingMin) || (p.rating && p.rating.rate >= filters.ratingMin)) &&
    (isNaN(filters.ratingMax) || (p.rating && p.rating.rate <= filters.ratingMax))
  );
}

// Update top cards with stats
function updateCards(products, filteredProducts) {
  document.getElementById('card-total-products').textContent = filteredProducts.length;

  const avgPrice = filteredProducts.length
    ? (filteredProducts.reduce((sum, p) => sum + p.price, 0) / filteredProducts.length).toFixed(2)
    : 0;
  document.getElementById('card-avg-price').textContent = `$${avgPrice}`;

  const avgRating = filteredProducts.length
    ? (filteredProducts.reduce((sum, p) => sum + (p.rating ? p.rating.rate : 0), 0) / filteredProducts.length).toFixed(2)
    : 0;
  document.getElementById('card-avg-rating').textContent = avgRating;

  document.getElementById('card-total-categories').textContent = getUniqueCategories(products).length;
}

// Table
function populateTable(products) {
  let html = `
    <thead class="table-light " >
      <tr>
        <th>Title</th>
        <th>Category</th>
        <th>Price ($)</th>
        <th>Rating</th>
      </tr>
    </thead>
    <tbody>
  `;
  products.forEach(p => {
    html += `
      <tr class="fade-in-row">
        <td>${p.title}</td>
        <td>${p.category}</td>
        <td>${p.price.toFixed(2)}</td>
        <td>${p.rating ? p.rating.rate : '-'}</td>
      </tr>
    `;
  });
  html += '</tbody>';
  document.getElementById('products-table').innerHTML = html;
}

// Chart
function renderChart(filteredProducts) {
  const ctx = document.getElementById('priceChart').getContext('2d');
  if (chartInstance) chartInstance.destroy();

  const categories = getUniqueCategories(filteredProducts);
  const data = categories.map(cat => {
    const productsInCat = filteredProducts.filter(p => p.category === cat);
    return productsInCat.length
      ? (productsInCat.reduce((sum, p) => sum + p.price, 0) / productsInCat.length).toFixed(2)
      : 0;
  });

  chartInstance = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: categories.map(cat => cat.charAt(0).toUpperCase() + cat.slice(1)),
      datasets: [{
        label: 'Average Price',
        data,
        backgroundColor: 'rgba(24,119,242,0.65)'
      }]
    },
    options: {
      responsive: true,
      plugins: { legend: { display: false } },
      scales: { y: { beginAtZero: true } },
      animation: { duration: 800, easing: 'easeOutQuart' }
    }
  });
}

// Apply filter and update UI
function updateUI(filters) {
  const filtered = filterProducts(filters);
  updateCards(allProducts, filtered);
  renderChart(filtered);
  populateTable(allProducts); 
}

// Initialize dashboard
document.addEventListener('DOMContentLoaded', async () => {
  allProducts = await fetchProducts();
  updateCategoryFilter(allProducts);

  updateUI({
    category: 'all',
    priceMin: NaN,
    priceMax: NaN,
    ratingMin: NaN,
    ratingMax: NaN,
  });

  document.getElementById('filterForm').addEventListener('submit', function(e) {
    e.preventDefault();
    const filters = {
      category: document.getElementById('categoryFilter').value,
      priceMin: parseFloat(document.getElementById('priceMin').value),
      priceMax: parseFloat(document.getElementById('priceMax').value),
      ratingMin: parseFloat(document.getElementById('ratingMin').value),
      ratingMax: parseFloat(document.getElementById('ratingMax').value),
    };
    updateUI(filters);
  });

  document.querySelectorAll('#dashboard-cards .card').forEach(card => {
    card.addEventListener('click', function() {
    document.querySelectorAll('#dashboard-cards .card').forEach(c => c.classList.remove('active-card'));
    this.classList.add('active-card');
    });
  });
});

 // Sidebar toggle for mobile
    const sidebar = document.querySelector('.sidebar');
    const sidebarBackdrop = document.querySelector('.sidebar-backdrop');
    const sidebarToggle = document.getElementById('sidebarToggle');
    if (sidebarToggle) {
      sidebarToggle.addEventListener('click', () => {
        sidebar.classList.toggle('show');
        sidebarBackdrop.classList.toggle('d-none');
      });
    }
    if (sidebarBackdrop) {
      sidebarBackdrop.addEventListener('click', () => {
        sidebar.classList.remove('show');
        sidebarBackdrop.classList.add('d-none');
      });
    }