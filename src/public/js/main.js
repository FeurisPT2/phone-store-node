const formatMoney = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(n);

let allProducts = [];
let currentBrand = 'all';
let currentSearch = '';
let currentUser = null;

// ==================== KHỞI TẠO ====================
document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  updateCart();
  checkAuthState();
  setupEventListeners();
});

function setupEventListeners() {
  // Đăng nhập
  const loginForm = document.getElementById('form-customer-login');
  if (loginForm) loginForm.addEventListener('submit', handleCustomerLogin);

  // Đăng ký
  const regForm = document.getElementById('form-customer-register');
  if (regForm) regForm.addEventListener('submit', handleCustomerRegister);

  // Đặt hàng
  const orderForm = document.getElementById('order-form');
  if (orderForm) orderForm.addEventListener('submit', handlePlaceOrder);

  // Mở giỏ hàng
  const btnCart = document.getElementById('btn-open-cart');
  if (btnCart) btnCart.addEventListener('click', openCartModal);

  // Tự động tìm kiếm theo SĐT khi rời ô nhập
  const phoneInput = document.getElementById('c-phone');
  if (phoneInput) {
    phoneInput.addEventListener('blur', async (e) => {
      const phone = e.target.value.trim();
      if (phone.length >= 10 && !currentUser) {
        try {
          const res = await fetch(`/api/customers/lookup?phone=${phone}`);
          const { found, customer } = await res.json();
          if (found && customer) {
            document.getElementById('c-name').value = customer.fullName || '';
            document.getElementById('c-address').value = customer.address || '';
            document.getElementById('remember-hint').classList.remove('hidden');
            showToast(`Chào mừng trở lại, ${customer.fullName}!`, 'info');
          }
        } catch {}
      }
    });
  }
}

// ==================== 1. TẢI VÀ HIỂN THỊ SẢN PHẨM ====================

async function loadProducts(brand = 'all') {
  currentBrand = brand;
  try {
    const res = await fetch(`/api/products?brand=${brand}`);
    const { data } = await res.json();
    allProducts = data || [];
    renderProductList();
  } catch (err) {
    console.error('Lỗi tải sản phẩm:', err);
  }
}

function handleSearch() {
  currentSearch = document.getElementById('input-search').value.toLowerCase().trim();
  renderProductList();
}

function filterByBrand(brand) {
  currentBrand = brand;
  document.querySelectorAll('.filter-bar .btn-filter').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-brand') === brand);
  });
  loadProducts(brand);
}

function renderProductList() {
  const container = document.getElementById('product-list');
  let list = allProducts;

  if (currentSearch) {
    list = list.filter(p =>
      p.name.toLowerCase().includes(currentSearch) ||
      p.brand.toLowerCase().includes(currentSearch) ||
      (p.specs && p.specs.toLowerCase().includes(currentSearch))
    );
  }

  document.getElementById('total-products-count').innerText = list.length;

  if (list.length === 0) {
    container.innerHTML = `
      <div style="grid-column: 1/-1; text-align:center; padding:50px; background:#fff; border-radius:16px;">
        <i class="fa-solid fa-box-open" style="font-size:40px; color:#94a3b8; margin-bottom:12px;"></i>
        <h3 style="color:#475569;">Không tìm thấy điện thoại nào phù hợp</h3>
        <p style="color:#94a3b8; font-size:13px; margin-top:4px;">Thử tìm với từ khóa khác hoặc chọn xem 'Tất cả' thương hiệu</p>
      </div>
    `;
    return;
  }

  container.innerHTML = list.map(p => {
    const discount = p.oldPrice && p.oldPrice > p.price ? Math.round((1 - p.price / p.oldPrice) * 100) : 0;
    return `
      <div class="card">
        <div class="card-img-wrapper">
          <img src="${p.image}" alt="${p.name}" loading="lazy">
          ${discount > 0 ? `<div class="discount-badge">-${discount}%</div>` : ''}
          <div class="brand-tag">${p.brand}</div>
        </div>
        <h3>${p.name}</h3>
        <p class="specs">${p.specs || 'Cấu hình tiêu chuẩn'}</p>
        <div class="price-box">
          <span class="price-current">${formatMoney(p.price)}</span>
          ${p.oldPrice && p.oldPrice > p.price ? `<span class="price-old">${formatMoney(p.oldPrice)}</span>` : ''}
        </div>
        <div class="card-actions">
          <button class="btn-buy" onclick="buyNow('${p.id}')">
            <i class="fa-solid fa-bolt"></i> Mua ngay
          </button>
          <button class="btn-add-cart" onclick="addToCart('${p.id}')" title="Thêm vào giỏ">
            <i class="fa-solid fa-cart-plus"></i>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

// ==================== 2. QUẢN LÝ GIỎ HÀNG ====================

async function addToCart(productId, openAfter = false) {
  try {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    const data = await res.json();
    if (data.success) {
      updateCart();
      showToast('Đã thêm sản phẩm vào giỏ hàng!', 'success');
      if (openAfter) openCartModal();
    }
  } catch (err) {
    showToast('Lỗi thêm giỏ hàng', 'error');
  }
}

async function buyNow(productId) {
  await addToCart(productId, true);
}

async function updateCart() {
  try {
    const res = await fetch('/api/cart');
    const { cart } = await res.json();
    const count = (cart || []).reduce((s, i) => s + i.quantity, 0);
    document.getElementById('cart-count').innerText = count;
  } catch {}
}

async function openCartModal() {
  try {
    const res = await fetch('/api/cart');
    const { cart, total } = await res.json();
    const tb = document.getElementById('cart-items');

    if (!cart || cart.length === 0) {
      tb.innerHTML = '<tr><td colspan="3" style="text-align:center; padding:24px; color:#94a3b8;">Giỏ hàng của bạn đang trống</td></tr>';
      document.getElementById('cart-total').innerText = '0 đ';
    } else {
      tb.innerHTML = cart.map(i => `
        <tr>
          <td>
            <div style="display:flex; align-items:center; gap:10px;">
              <img src="${i.image || ''}" style="width:40px; height:40px; object-fit:cover; border-radius:6px;">
              <div>
                <strong>${i.name}</strong><br>
                <small style="color:#64748b;">${formatMoney(i.price)}</small>
              </div>
            </div>
          </td>
          <td style="text-align:center; font-weight:700;">x${i.quantity}</td>
          <td style="text-align:right; font-weight:800; color:#dc2626;">${formatMoney(i.price * i.quantity)}</td>
        </tr>
      `).join('');
      document.getElementById('cart-total').innerText = formatMoney(total || 0);
    }

    // Tự điền thông tin khách nếu đã có
    if (currentUser) {
      document.getElementById('c-name').value = currentUser.fullName || '';
      document.getElementById('c-phone').value = currentUser.phone || '';
      document.getElementById('c-address').value = currentUser.address || '';
      document.getElementById('remember-hint').classList.remove('hidden');
    }

    openModal('cart-modal');
  } catch (err) {
    showToast('Không thể tải giỏ hàng', 'error');
  }
}

async function handlePlaceOrder(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-order-submit');
  btn.disabled = true;
  btn.innerText = 'Đang xử lý đặt hàng...';

  const payload = {
    fullName: document.getElementById('c-name').value.trim(),
    phone: document.getElementById('c-phone').value.trim(),
    address: document.getElementById('c-address').value.trim(),
    note: document.getElementById('c-note').value.trim(),
    rememberMe: document.getElementById('c-remember').checked
  };

  try {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast('🎉 Đặt hàng thành công! Mã đơn: ' + data.orderId, 'success');
      closeModal('cart-modal');
      updateCart();
      checkAuthState();
    } else {
      showToast(data.message || 'Lỗi đặt hàng', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ khi đặt hàng', 'error');
  } finally {
    btn.disabled = false;
    btn.innerText = 'XÁC NHẬN ĐẶT HÀNG NGAY';
  }
}

// ==================== 3. XÁC THỰC KHÁCH HÀNG (AUTH) ====================

async function checkAuthState() {
  try {
    const res = await fetch('/api/customers/profile');
    const { loggedIn, remembered, data } = await res.json();

    if (data && (loggedIn || remembered)) {
      currentUser = data;
      document.getElementById('btn-open-auth').classList.add('hidden');
      const badge = document.getElementById('user-profile-badge');
      badge.classList.remove('hidden');

      const name = data.fullName || 'Khách';
      document.getElementById('user-display-name').innerText = name;
      document.getElementById('user-avatar-initial').innerText = name.charAt(0).toUpperCase();

      // Điền sẵn form thanh toán
      const cName = document.getElementById('c-name');
      const cPhone = document.getElementById('c-phone');
      const cAddress = document.getElementById('c-address');
      if (cName && !cName.value) cName.value = data.fullName || '';
      if (cPhone && !cPhone.value) cPhone.value = data.phone || '';
      if (cAddress && !cAddress.value) cAddress.value = data.address || '';
    } else {
      currentUser = null;
      document.getElementById('btn-open-auth').classList.remove('hidden');
      document.getElementById('user-profile-badge').classList.add('hidden');
    }
  } catch {}
}

function openAuthModal(tab = 'login') {
  switchAuthTab(tab);
  openModal('auth-modal');
}

function switchAuthTab(tab) {
  const isLogin = tab === 'login';
  document.getElementById('tab-login-btn').classList.toggle('active', isLogin);
  document.getElementById('tab-register-btn').classList.toggle('active', !isLogin);
  document.getElementById('form-customer-login').style.display = isLogin ? 'block' : 'none';
  document.getElementById('form-customer-register').style.display = isLogin ? 'none' : 'block';
  document.getElementById('auth-modal-title').innerHTML = isLogin
    ? '<i class="fa-solid fa-arrow-right-to-bracket" style="color:var(--primary);"></i> Đăng Nhập Khách Hàng'
    : '<i class="fa-solid fa-user-plus" style="color:var(--primary);"></i> Đăng Ký Tài Khoản Mới';
}

async function handleCustomerLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-login-submit');
  btn.disabled = true;
  btn.innerText = 'Đang đăng nhập...';

  const payload = {
    phone: document.getElementById('login-phone').value.trim(),
    password: document.getElementById('login-password').value,
    rememberMe: document.getElementById('login-remember').checked
  };

  try {
    const res = await fetch('/api/customers/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast('Xin chào, ' + (data.customer?.fullName || 'khách hàng!'), 'success');
      closeModal('auth-modal');
      document.getElementById('form-customer-login').reset();
      checkAuthState();
    } else {
      showToast(data.message || 'Sai số điện thoại hoặc mật khẩu', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Đăng Nhập Ngay';
  }
}

async function handleCustomerRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('btn-reg-submit');
  btn.disabled = true;
  btn.innerText = 'Đang tạo tài khoản...';

  const payload = {
    fullName: document.getElementById('reg-name').value.trim(),
    phone: document.getElementById('reg-phone').value.trim(),
    password: document.getElementById('reg-password').value,
    email: document.getElementById('reg-email').value.trim(),
    address: document.getElementById('reg-address').value.trim()
  };

  try {
    const res = await fetch('/api/customers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      showToast('🎉 Đăng ký thành công! Đã tự động đăng nhập.', 'success');
      closeModal('auth-modal');
      document.getElementById('form-customer-register').reset();
      checkAuthState();
    } else {
      showToast(data.message || 'Lỗi đăng ký tài khoản', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    btn.disabled = false;
    btn.innerText = 'Tạo Tài Khoản Khách Hàng';
  }
}

async function logoutCustomer() {
  if (confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
    await fetch('/api/customers/logout', { method: 'POST' });
    currentUser = null;
    document.getElementById('user-profile-badge').classList.add('hidden');
    document.getElementById('btn-open-auth').classList.remove('hidden');
    document.getElementById('order-form').reset();
    showToast('Đã đăng xuất tài khoản!', 'info');
  }
}

// ==================== 4. LỊCH SỬ ĐƠN HÀNG CỦA KHÁCH ====================

async function openMyOrdersModal() {
  const container = document.getElementById('my-orders-list-body');
  container.innerHTML = '<div style="text-align:center; padding:20px;"><i class="fa-solid fa-spinner fa-spin"></i> Đang tải đơn hàng...</div>';
  openModal('my-orders-modal');

  try {
    const res = await fetch('/api/customers/my-orders');
    const { success, orders } = await res.json();

    if (!success || !orders || orders.length === 0) {
      container.innerHTML = `
        <div style="text-align:center; padding:30px; color:#94a3b8;">
          <i class="fa-solid fa-bag-shopping" style="font-size:36px; margin-bottom:10px;"></i>
          <p>Bạn chưa có đơn đặt hàng nào tại TechStore.</p>
        </div>
      `;
      return;
    }

    const statusMap = {
      pending: '<span style="background:#fef3c7; color:#b45309; padding:3px 10px; border-radius:12px; font-weight:700; font-size:12px;">Chờ xác nhận</span>',
      shipping: '<span style="background:#e0f2fe; color:#0369a1; padding:3px 10px; border-radius:12px; font-weight:700; font-size:12px;">Đang giao hàng</span>',
      completed: '<span style="background:#dcfce7; color:#15803d; padding:3px 10px; border-radius:12px; font-weight:700; font-size:12px;">Đã hoàn thành</span>',
      cancelled: '<span style="background:#fee2e2; color:#b91c1c; padding:3px 10px; border-radius:12px; font-weight:700; font-size:12px;">Đã hủy</span>'
    };

    container.innerHTML = orders.map(o => `
      <div style="background:#f8fafc; border:1px solid #e2e8f0; border-radius:12px; padding:16px; margin-bottom:12px;">
        <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:8px;">
          <div>
            <strong style="color:var(--primary); font-size:14px;">#${o.id}</strong>
            <small style="color:#64748b; margin-left:8px;">${new Date(o.createdAt).toLocaleDateString('vi-VN')}</small>
          </div>
          <div>${statusMap[o.status] || o.status}</div>
        </div>
        <div style="font-size:13px; color:#334155; margin-bottom:8px;">
          ${(o.items || []).map(i => `• ${i.name} (x${i.quantity}) - <b>${formatMoney(i.price * i.quantity)}</b>`).join('<br>')}
        </div>
        <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #e2e8f0; padding-top:8px; font-size:14px;">
          <span style="color:#64748b; font-size:12px;">Đ/C nhận: ${o.customerInfo?.address || ''}</span>
          <strong style="color:#dc2626; font-size:16px;">${formatMoney(o.totalAmount)}</strong>
        </div>
      </div>
    `).join('');
  } catch (err) {
    container.innerHTML = '<div style="color:red; text-align:center;">Lỗi tải đơn hàng</div>';
  }
}

// ==================== 5. TIỆN ÍCH MODAL & TOAST ====================

function openModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.remove('hidden');
}

function closeModal(id) {
  const el = document.getElementById(id);
  if (el) el.classList.add('hidden');
}

function togglePasswordVisibility(inputId, btn) {
  const input = document.getElementById(inputId);
  if (!input) return;
  const isPass = input.type === 'password';
  input.type = isPass ? 'text' : 'password';
  btn.innerHTML = isPass ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>';
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;

  const iconMap = {
    success: 'fa-circle-check',
    error: 'fa-circle-exclamation',
    info: 'fa-circle-info'
  };

  toast.innerHTML = `
    <i class="fa-solid ${iconMap[type] || 'fa-bell'}"></i>
    <span>${message}</span>
  `;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    toast.style.transform = 'translateX(100%)';
    toast.style.transition = 'all 0.3s ease';
    setTimeout(() => toast.remove(), 300);
  }, 3500);
}
