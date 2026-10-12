const formatMoney = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

async function loadProducts(brand = 'all') {
  const res = await fetch(`/api/products?brand=${brand}`);
  const { data } = await res.json();
  const el = document.getElementById('product-list');
  el.innerHTML = data.map(p => `
    <div class="card">
      <img src="${p.image}">
      <h3>${p.name}</h3>
      <p>${p.specs}</p>
      <div class="price">${formatMoney(p.price)}</div>
      <button class="btn-buy" onclick="addToCart('${p.id}')">Mua ngay</button>
    </div>
  `).join('');
}

async function addToCart(productId) {
  await fetch('/api/cart/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId })
  });
  updateCart();
  alert('Da them vao gio hang!');
}

async function updateCart() {
  const res = await fetch('/api/cart');
  const { cart } = await res.json();
  const count = (cart || []).reduce((s, i) => s + i.quantity, 0);
  document.getElementById('cart-count').innerText = count;
}

async function checkRemembered() {
  const res = await fetch('/api/customers/profile');
  const { remembered, data } = await res.json();
  if (remembered && data) {
    document.getElementById('c-name').value = data.fullName || '';
    document.getElementById('c-phone').value = data.phone || '';
    document.getElementById('c-address').value = data.address || '';
    document.getElementById('welcome-text').innerText = `Chao ${data.fullName}`;
    document.getElementById('customer-badge').classList.remove('hidden');
    document.getElementById('remember-hint').classList.remove('hidden');
  }
}

document.getElementById('c-phone').addEventListener('blur', async (e) => {
  const phone = e.target.value.trim();
  if (phone.length >= 10) {
    const res = await fetch(`/api/customers/lookup?phone=${phone}`);
    const { found, customer } = await res.json();
    if (found) {
      document.getElementById('c-name').value = customer.fullName;
      document.getElementById('c-address').value = customer.address;
      document.getElementById('remember-hint').classList.remove('hidden');
    }
  }
});

document.getElementById('btn-open-cart').onclick = async () => {
  const res = await fetch('/api/cart');
  const { cart, total } = await res.json();
  const tb = document.getElementById('cart-items');
  tb.innerHTML = (cart || []).map(i => `
    <tr><td>${i.name}</td><td>${i.quantity}x</td><td>${formatMoney(i.price * i.quantity)}</td></tr>
  `).join('');
  document.getElementById('cart-total').innerText = formatMoney(total || 0);
  checkRemembered();
  document.getElementById('cart-modal').classList.remove('hidden');
};

document.getElementById('btn-close').onclick = () => document.getElementById('cart-modal').classList.add('hidden');

document.getElementById('order-form').onsubmit = async (e) => {
  e.preventDefault();
  const res = await fetch('/api/orders/checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      fullName: document.getElementById('c-name').value,
      phone: document.getElementById('c-phone').value,
      address: document.getElementById('c-address').value,
      rememberMe: document.getElementById('c-remember').checked
    })
  });
  const data = await res.json();
  if (data.success) {
    alert('Dat hang thanh cong! Thong tin da duoc ghi nho.');
    document.getElementById('cart-modal').classList.add('hidden');
    updateCart();
    checkRemembered();
  }
};

document.getElementById('btn-forget').onclick = async () => {
  await fetch('/api/customers/forget', { method: 'POST' });
  document.getElementById('customer-badge').classList.add('hidden');
  document.getElementById('order-form').reset();
  alert('Da xoa ghi nho!');
};

loadProducts();
updateCart();
checkRemembered();
