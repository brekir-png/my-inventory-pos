const STORAGE_KEY = 'myInventoryPosState';

const appConfig = {
  supabaseUrl: '',
  supabaseAnonKey: '',
};

const defaultState = {
  products: [
    {
      id: crypto.randomUUID(),
      name: 'Espresso Beans',
      category: 'Coffee',
      sku: 'COF-001',
      price: 18.5,
      cost: 9.2,
      stock: 35,
      reorderLevel: 12,
      description: 'Medium roast, ethically sourced beans.',
    },
    {
      id: crypto.randomUUID(),
      name: 'Burrito Bowl Kit',
      category: 'Meals',
      sku: 'MEAL-102',
      price: 16.75,
      cost: 8.4,
      stock: 20,
      reorderLevel: 10,
      description: 'Ready-to-cook bowl kit for quick service.',
    },
    {
      id: crypto.randomUUID(),
      name: 'Lemonade',
      category: 'Beverages',
      sku: 'DRK-014',
      price: 4.5,
      cost: 1.8,
      stock: 48,
      reorderLevel: 18,
      description: 'House-made fresh lemonade.',
    },
    {
      id: crypto.randomUUID(),
      name: 'Pastry Box',
      category: 'Bakery',
      sku: 'BAK-220',
      price: 24,
      cost: 11.3,
      stock: 8,
      reorderLevel: 8,
      description: 'Assorted pastry mix for breakfast service.',
    },
  ],
  sales: [
    {
      id: 'RCPT-1001',
      customer: 'Walk-in',
      date: new Date().toISOString(),
      items: [
        { productId: null, name: 'Espresso Beans', quantity: 1, unitPrice: 18.5 },
      ],
      total: 18.5,
      tax: 1.48,
      discount: 0,
    },
  ],
};

const state = loadState();
const cart = {
  items: [],
  customer: '',
  discount: 0,
};

const elements = {
  pageTitle: document.getElementById('pageTitle'),
  statusHint: document.getElementById('statusHint'),
  connectionStatus: document.getElementById('connectionStatus'),
  productsCount: document.getElementById('productsCount'),
  lowStockCount: document.getElementById('lowStockCount'),
  inventoryValue: document.getElementById('inventoryValue'),
  salesToday: document.getElementById('salesToday'),
  lowStockList: document.getElementById('lowStockList'),
  recentSalesList: document.getElementById('recentSalesList'),
  inventorySearch: document.getElementById('inventorySearch'),
  inventoryCategoryFilter: document.getElementById('inventoryCategoryFilter'),
  inventoryTableBody: document.getElementById('inventoryTableBody'),
  catalogSearch: document.getElementById('catalogSearch'),
  catalogCategoryFilter: document.getElementById('catalogCategoryFilter'),
  catalogGrid: document.getElementById('catalogGrid'),
  customerName: document.getElementById('customerName'),
  discountInput: document.getElementById('discountInput'),
  cartItems: document.getElementById('cartItems'),
  subtotalValue: document.getElementById('subtotalValue'),
  taxValue: document.getElementById('taxValue'),
  discountValue: document.getElementById('discountValue'),
  totalValue: document.getElementById('totalValue'),
  checkoutBtn: document.getElementById('checkoutBtn'),
  salesTableBody: document.getElementById('salesTableBody'),
  productDialog: document.getElementById('productDialog'),
  productForm: document.getElementById('productForm'),
  productDialogTitle: document.getElementById('productDialogTitle'),
  productId: document.getElementById('productId'),
  productName: document.getElementById('productName'),
  productSku: document.getElementById('productSku'),
  productCategory: document.getElementById('productCategory'),
  productPrice: document.getElementById('productPrice'),
  productCost: document.getElementById('productCost'),
  productStock: document.getElementById('productStock'),
  productReorder: document.getElementById('productReorder'),
  productDescription: document.getElementById('productDescription'),
  resetDataBtn: document.getElementById('resetDataBtn'),
  newProductBtn: document.getElementById('newProductBtn'),
};

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seeded = JSON.parse(JSON.stringify(defaultState));
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seeded));
      return seeded;
    }

    const parsed = JSON.parse(raw);
    return parsed.products && parsed.sales ? parsed : JSON.parse(JSON.stringify(defaultState));
  } catch (error) {
    console.warn('Falling back to demo state:', error);
    return JSON.parse(JSON.stringify(defaultState));
  }
}

function persistState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function toCurrency(value) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(Number(value || 0));
}

function generateReceiptNumber() {
  return `RCPT-${Date.now().toString().slice(-6)}`;
}

function getCategories() {
  return [...new Set(state.products.map((product) => product.category).filter(Boolean))].sort();
}

function getLowStockProducts() {
  return state.products.filter((product) => product.stock <= product.reorderLevel);
}

function getInventoryValue() {
  return state.products.reduce((total, product) => total + Number(product.price || 0) * Number(product.stock || 0), 0);
}

function getSalesForToday() {
  const today = new Date().toDateString();
  return state.sales.filter((sale) => new Date(sale.date).toDateString() === today);
}

function renderDashboard() {
  const lowStock = getLowStockProducts();
  const todaySales = getSalesForToday();

  elements.productsCount.textContent = String(state.products.length);
  elements.lowStockCount.textContent = String(lowStock.length);
  elements.inventoryValue.textContent = toCurrency(getInventoryValue());
  elements.salesToday.textContent = toCurrency(todaySales.reduce((sum, sale) => sum + Number(sale.total || 0), 0));

  elements.lowStockList.innerHTML = lowStock.length
    ? lowStock.slice(0, 5).map((product) => `
      <div class="alert-row">
        <div>
          <strong>${product.name}</strong>
          <span>${product.category}</span>
        </div>
        <span class="product-pill warning">${product.stock} left</span>
      </div>
    `).join('')
    : '<div class="empty-state">No low-stock items right now.</div>';

  const recent = [...state.sales].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 5);
  elements.recentSalesList.innerHTML = recent.length
    ? recent.map((sale) => `
      <div class="sale-row">
        <div>
          <strong>${sale.customer || 'Walk-in'}</strong>
          <span>${new Date(sale.date).toLocaleDateString()}</span>
        </div>
        <strong>${toCurrency(sale.total)}</strong>
      </div>
    `).join('')
    : '<div class="empty-state">No sales recorded yet.</div>';
}

function renderInventoryTable() {
  const query = elements.inventorySearch.value.trim().toLowerCase();
  const category = elements.inventoryCategoryFilter.value;
  const rows = state.products.filter((product) => {
    const matchesSearch = !query || `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query);
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });

  elements.inventoryTableBody.innerHTML = rows.length
    ? rows.map((product) => {
        const isLow = product.stock <= product.reorderLevel;
        return `
          <tr>
            <td>
              <div><strong>${product.name}</strong></div>
            </td>
            <td>${product.sku}</td>
            <td>${product.category}</td>
            <td>${toCurrency(product.price)}</td>
            <td>
              <span class="product-pill ${isLow ? 'warning' : ''}">${product.stock}</span>
            </td>
            <td>${product.reorderLevel}</td>
            <td>
              <div class="action-group">
                <button class="action-button" data-action="edit" data-id="${product.id}" type="button">Edit</button>
                <button class="action-button danger" data-action="delete" data-id="${product.id}" type="button">Delete</button>
              </div>
            </td>
          </tr>
        `;
      }).join('')
    : '<tr><td colspan="7"><div class="empty-state">No products match your filters.</div></td></tr>';
}

function renderCategoryFilters() {
  const categories = getCategories();
  const choices = ['<option value="all">All categories</option>']
    .concat(categories.map((category) => `<option value="${category}">${category}</option>`))
    .join('');

  elements.inventoryCategoryFilter.innerHTML = choices;
  elements.catalogCategoryFilter.innerHTML = choices;
}

function renderCatalog() {
  const query = elements.catalogSearch.value.trim().toLowerCase();
  const category = elements.catalogCategoryFilter.value;
  const products = state.products.filter((product) => {
    const matchesSearch = !query || `${product.name} ${product.sku} ${product.category}`.toLowerCase().includes(query);
    const matchesCategory = category === 'all' || product.category === category;
    return matchesSearch && matchesCategory;
  });

  elements.catalogGrid.innerHTML = products.length
    ? products.map((product) => `
      <article class="catalog-item">
        <div>
          <h4>${product.name}</h4>
          <small>${product.category} · ${product.stock} in stock</small>
        </div>
        <div class="catalog-meta">
          <span class="price">${toCurrency(product.price)}</span>
          <span class="product-pill ${product.stock <= product.reorderLevel ? 'warning' : ''}">${product.stock}</span>
        </div>
        <button type="button" data-add-product="${product.id}">Add to cart</button>
      </article>
    `).join('')
    : '<div class="empty-state">No products available in this catalog view.</div>';
}

function getCartSubtotal() {
  return cart.items.reduce((sum, item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    if (!product) return sum;
    return sum + Number(product.price || 0) * Number(item.quantity || 0);
  }, 0);
}

function renderCart() {
  const subtotal = getCartSubtotal();
  const discount = Number(elements.discountInput.value || 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax - discount;

  elements.subtotalValue.textContent = toCurrency(subtotal);
  elements.taxValue.textContent = toCurrency(tax);
  elements.discountValue.textContent = toCurrency(discount);
  elements.totalValue.textContent = toCurrency(total);

  if (!cart.items.length) {
    elements.cartItems.innerHTML = '<div class="empty-state">Your cart is empty. Add products from the catalog.</div>';
    return;
  }

  elements.cartItems.innerHTML = cart.items.map((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    if (!product) return '';
    return `
      <div class="cart-item">
        <div class="cart-item-info">
          <strong>${product.name}</strong>
          <span>${toCurrency(product.price)} each</span>
        </div>
        <div class="cart-item-actions">
          <button class="qty-button" type="button" data-action="decrease" data-id="${item.productId}">−</button>
          <strong>${item.quantity}</strong>
          <button class="qty-button" type="button" data-action="increase" data-id="${item.productId}">+</button>
        </div>
      </div>
    `;
  }).join('');
}

function renderSalesTable() {
  const sales = [...state.sales].sort((a, b) => new Date(b.date) - new Date(a.date));

  elements.salesTableBody.innerHTML = sales.length
    ? sales.map((sale) => `
      <tr>
        <td>${sale.id}</td>
        <td>${sale.customer || 'Walk-in'}</td>
        <td>${new Date(sale.date).toLocaleString()}</td>
        <td>${sale.items.reduce((count, item) => count + Number(item.quantity || 0), 0)}</td>
        <td>${toCurrency(sale.total)}</td>
      </tr>
    `).join('')
    : '<tr><td colspan="5"><div class="empty-state">No sales yet.</div></td></tr>';
}

function updatePageState() {
  renderCategoryFilters();
  renderDashboard();
  renderInventoryTable();
  renderCatalog();
  renderCart();
  renderSalesTable();
}

function openProductDialog(product = null) {
  if (product) {
    elements.productDialogTitle.textContent = 'Edit product';
    elements.productId.value = product.id;
    elements.productName.value = product.name;
    elements.productSku.value = product.sku;
    elements.productCategory.value = product.category;
    elements.productPrice.value = product.price;
    elements.productCost.value = product.cost || 0;
    elements.productStock.value = product.stock;
    elements.productReorder.value = product.reorderLevel;
    elements.productDescription.value = product.description || '';
  } else {
    elements.productDialogTitle.textContent = 'Add product';
    elements.productForm.reset();
    elements.productId.value = '';
    elements.productPrice.value = 0;
    elements.productCost.value = 0;
    elements.productStock.value = 0;
    elements.productReorder.value = 0;
  }

  elements.productDialog.showModal();
}

function saveProduct(event) {
  event.preventDefault();

  const product = {
    id: elements.productId.value || crypto.randomUUID(),
    name: elements.productName.value.trim(),
    sku: elements.productSku.value.trim(),
    category: elements.productCategory.value.trim(),
    price: Number(elements.productPrice.value || 0),
    cost: Number(elements.productCost.value || 0),
    stock: Number(elements.productStock.value || 0),
    reorderLevel: Number(elements.productReorder.value || 0),
    description: elements.productDescription.value.trim(),
  };

  if (!product.name || !product.sku || !product.category) {
    alert('Please complete the product name, SKU, and category.');
    return;
  }

  const existingIndex = state.products.findIndex((entry) => entry.id === product.id);
  if (existingIndex >= 0) {
    state.products[existingIndex] = { ...state.products[existingIndex], ...product };
  } else {
    state.products.push(product);
  }

  persistState();
  updatePageState();
  elements.productDialog.close();
}

function deleteProduct(productId) {
  const product = state.products.find((entry) => entry.id === productId);
  if (!product) return;

  const shouldDelete = window.confirm(`Delete ${product.name}? This action cannot be undone.`);
  if (!shouldDelete) return;

  state.products = state.products.filter((entry) => entry.id !== productId);
  cart.items = cart.items.filter((item) => item.productId !== productId);
  persistState();
  renderCart();
  updatePageState();
}

function addProductToCart(productId) {
  const product = state.products.find((entry) => entry.id === productId);
  if (!product) return;

  const existing = cart.items.find((item) => item.productId === productId);
  if (existing) {
    if (existing.quantity >= product.stock) {
      alert(`Only ${product.stock} units of ${product.name} are available.`);
      return;
    }
    existing.quantity += 1;
  } else {
    cart.items.push({ productId, quantity: 1 });
  }

  renderCart();
}

function adjustCartItem(productId, delta) {
  const item = cart.items.find((entry) => entry.productId === productId);
  if (!item) return;

  const product = state.products.find((entry) => entry.id === productId);
  if (!product) return;

  item.quantity += delta;
  if (item.quantity <= 0) {
    cart.items = cart.items.filter((entry) => entry.productId !== productId);
  } else if (item.quantity > product.stock) {
    item.quantity = product.stock;
    alert(`Maximum available stock for ${product.name} is ${product.stock}.`);
  }

  renderCart();
}

function completeSale() {
  if (!cart.items.length) {
    alert('Add at least one item to complete the sale.');
    return;
  }

  const subtotal = getCartSubtotal();
  const discount = Number(elements.discountInput.value || 0);
  const tax = subtotal * 0.08;
  const total = subtotal + tax - discount;

  cart.items.forEach((item) => {
    const product = state.products.find((entry) => entry.id === item.productId);
    if (!product) return;

    if (product.stock < item.quantity) {
      alert(`${product.name} is below the requested quantity.`);
      return;
    }

    product.stock -= item.quantity;
  });

  const sale = {
    id: generateReceiptNumber(),
    customer: elements.customerName.value.trim() || 'Walk-in',
    date: new Date().toISOString(),
    items: cart.items.map((item) => {
      const product = state.products.find((entry) => entry.id === item.productId);
      return {
        productId: item.productId,
        name: product ? product.name : 'Unknown item',
        quantity: item.quantity,
        unitPrice: product ? product.price : 0,
      };
    }),
    total,
    tax,
    discount,
  };

  state.sales.push(sale);
  cart.items = [];
  elements.customerName.value = '';
  elements.discountInput.value = 0;

  persistState();
  updatePageState();
  alert(`Sale complete. Receipt ${sale.id} processed.`);
}

function resetDemoData() {
  const confirmReset = window.confirm('Reset the demo inventory and sales data to the original sample set?');
  if (!confirmReset) return;

  localStorage.setItem(STORAGE_KEY, JSON.stringify(JSON.parse(JSON.stringify(defaultState))));
  state.products = JSON.parse(JSON.stringify(defaultState.products));
  state.sales = JSON.parse(JSON.stringify(defaultState.sales));
  cart.items = [];
  elements.customerName.value = '';
  elements.discountInput.value = 0;
  updatePageState();
}

function setActiveView(viewName) {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.classList.toggle('active', button.dataset.view === viewName);
  });

  document.querySelectorAll('.view').forEach((view) => {
    view.classList.toggle('active', view.id === `${viewName}View`);
  });

  elements.pageTitle.textContent = viewName.charAt(0).toUpperCase() + viewName.slice(1);
}

function wireEvents() {
  document.querySelectorAll('.nav-item').forEach((button) => {
    button.addEventListener('click', () => setActiveView(button.dataset.view));
  });

  elements.inventorySearch.addEventListener('input', renderInventoryTable);
  elements.inventoryCategoryFilter.addEventListener('change', renderInventoryTable);
  elements.catalogSearch.addEventListener('input', renderCatalog);
  elements.catalogCategoryFilter.addEventListener('change', renderCatalog);
  elements.discountInput.addEventListener('input', renderCart);

  document.addEventListener('click', (event) => {
    const actionButton = event.target.closest('[data-action]');
    if (actionButton) {
      const { action, id } = actionButton.dataset;
      if (action === 'edit') {
        const product = state.products.find((entry) => entry.id === id);
        if (product) openProductDialog(product);
      }

      if (action === 'delete') {
        deleteProduct(id);
      }

      if (action === 'increase') {
        adjustCartItem(id, 1);
      }

      if (action === 'decrease') {
        adjustCartItem(id, -1);
      }
    }

    const addButton = event.target.closest('[data-add-product]');
    if (addButton) {
      addProductToCart(addButton.dataset.addProduct);
    }

    const closeButton = event.target.closest('[data-close-dialog]');
    if (closeButton) {
      const dialog = document.getElementById(closeButton.dataset.closeDialog);
      dialog.close();
    }
  });

  elements.productForm.addEventListener('submit', saveProduct);
  elements.checkoutBtn.addEventListener('click', completeSale);
  elements.resetDataBtn.addEventListener('click', resetDemoData);
  elements.newProductBtn.addEventListener('click', () => openProductDialog());
}

function initializeConnectionStatus() {
  const hasSupabase = Boolean(appConfig.supabaseUrl && appConfig.supabaseAnonKey);
  if (hasSupabase) {
    elements.connectionStatus.textContent = 'Supabase connected';
    elements.statusHint.textContent = 'Live data sync is enabled.';
  } else {
    elements.connectionStatus.textContent = 'Offline mode';
    elements.statusHint.textContent = 'Using browser storage for demo data.';
  }
}

function init() {
  initializeConnectionStatus();
  wireEvents();
  setActiveView('dashboard');
  updatePageState();
}

init();

