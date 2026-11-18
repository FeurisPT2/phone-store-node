// ============================================================================
// GEARHUB CUSTOMER SELF-SERVICE PORTAL, AUTHENTICATION & WISHLIST
// ============================================================================

let currentUser = null;
let userWishlist = [];

function escPortal(v) {
  if (typeof escapeHtml === 'function') return escapeHtml(v);
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function updateDrawerAccountUI(user) {
  if (typeof document === 'undefined') return;
  const guestCard = document.getElementById('drawer-guest-card');
  const userCard = document.getElementById('drawer-user-card');
  const nameEl = document.getElementById('drawer-user-name');
  const initEl = document.getElementById('drawer-user-initial');
  const roleEl = document.getElementById('drawer-user-role');

  if (user) {
    if (guestCard) guestCard.style.display = 'none';
    if (userCard) userCard.style.display = 'flex';
    const name = user.fullName || 'Khách';
    if (nameEl) nameEl.innerText = name;
    if (initEl) initEl.innerText = name.charAt(0).toUpperCase();
    if (roleEl) roleEl.innerText = user.phone ? `SĐT: ${user.phone}` : (user.studentId ? `SV: ${user.studentId}` : 'Sinh viên HCMUS');
  } else {
    if (guestCard) guestCard.style.display = 'flex';
    if (userCard) userCard.style.display = 'none';
  }
}

async function checkAuthState() {
  try {
    const res = await fetch('/api/customers/profile');
    const { loggedIn, remembered, data } = await res.json();

    if (typeof document === 'undefined') return;
    const authBtn = document.getElementById('btn-open-auth');
    const badge = document.getElementById('user-profile-badge');

    if (data && (loggedIn || remembered)) {
      currentUser = data;
      if (Array.isArray(data.wishlist)) {
        userWishlist = data.wishlist.map(String);
        updateWishlistBadge();
      }
      if (authBtn) authBtn.style.display = 'none';
      if (badge) badge.style.display = 'inline-flex';

      const name = data.fullName || 'Khách';
      const dispEl = document.getElementById('user-display-name');
      const initEl = document.getElementById('user-avatar-initial');
      if (dispEl) dispEl.innerText = name;
      if (initEl) initEl.innerText = name.charAt(0).toUpperCase();

      const cName = document.getElementById('c-name');
      const cPhone = document.getElementById('c-phone');
      const cAddress = document.getElementById('c-address');
      const cNote = document.getElementById('c-note');
      if (cName && !cName.value) cName.value = data.fullName || '';
      if (cPhone && !cPhone.value) cPhone.value = data.phone || '';
      if (cAddress && !cAddress.value) {
        const cleanAddr = String(data.address || '').replace(/^(?:\[Khung giờ:[^\]]*\]\s*-\s*)+/i, '').trim();
        cAddress.value = cleanAddr;
      }
      if (cNote && !cNote.value) cNote.value = data.note || '';
      updateDrawerAccountUI(currentUser);
    } else {
      currentUser = null;
      if (authBtn) authBtn.style.display = 'inline-flex';
      if (badge) badge.style.display = 'none';
      updateDrawerAccountUI(null);
    }
  } catch {}
}

async function loadWishlistState() {
  try {
    const res = await fetch('/api/customers/wishlist');
    const data = await res.json();
    if (data.success && Array.isArray(data.wishlist)) {
      userWishlist = data.wishlist.map(String);
      updateWishlistBadge();
      if (typeof renderProductList === 'function') {
        renderProductList();
      }
    }
  } catch {}
}

function updateWishlistBadge() {
  if (typeof document === 'undefined') return;
  const badge = document.getElementById('wishlist-count-badge');
  if (!badge) return;
  badge.innerText = userWishlist.length;
  badge.style.display = userWishlist.length > 0 ? 'inline-flex' : 'none';
}

async function toggleWishlistItem(productId) {
  try {
    const res = await fetch('/api/customers/wishlist', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    const data = await res.json();
    if (data.success) {
      userWishlist = (data.wishlist || []).map(String);
      updateWishlistBadge();
      if (typeof renderProductList === 'function') {
        renderProductList();
      }
      if (typeof showToast === 'function') {
        showToast(data.message || 'Đã cập nhật danh sách yêu thích', 'info');
      }
      if (typeof document !== 'undefined') {
        const wishPanel = document.getElementById('portal-panel-wishlist');
        if (wishPanel && wishPanel.style.display !== 'none') {
          renderPortalWishlistTab();
        }
      }
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Không thể cập nhật danh sách yêu thích', 'error');
    }
  }
}

function openAuthModal(tab = 'login') {
  if (typeof document !== 'undefined' && !document.getElementById('auth-modal')) {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      if (tab === 'register') params.set('tab', 'register');
      if (window.location.pathname && window.location.pathname !== '/login') {
        params.set('redirect', window.location.pathname + window.location.search);
      }
      const qs = params.toString();
      window.location.href = '/login' + (qs ? '?' + qs : '');
    }
    return;
  }
  switchAuthTab(tab);
  if (typeof openModal === 'function') {
    openModal('auth-modal');
  }
}

function closeAuthModal() {
  if (typeof closeModal === 'function') {
    closeModal('auth-modal');
  }
}

function switchAuthTab(tab) {
  if (typeof document === 'undefined') return;
  const isLogin = tab === 'login';
  document.getElementById('tab-login-btn')?.classList.toggle('active', isLogin);
  document.getElementById('tab-register-btn')?.classList.toggle('active', !isLogin);
  const fLogin = document.getElementById('form-customer-login');
  const fReg = document.getElementById('form-customer-register');
  if (fLogin) fLogin.style.display = isLogin ? 'block' : 'none';
  if (fReg) fReg.style.display = isLogin ? 'none' : 'block';
  const titleEl = document.getElementById('auth-modal-title');
  if (titleEl) {
    titleEl.innerText = isLogin ? 'Đăng nhập tài khoản' : 'Đăng ký thành viên mới';
  }
}

async function handleCustomerLogin(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  if (typeof document === 'undefined') return;

  const btn = document.getElementById('btn-login-submit');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Đang đăng nhập...';
  }

  const loginInput = document.getElementById('login-phone')?.value.trim() || '';
  const payload = {
    identifier: loginInput,
    phone: loginInput,
    username: loginInput,
    password: document.getElementById('login-password')?.value || '',
    rememberMe: document.getElementById('login-remember')?.checked || false
  };

  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      if (data.role === 'admin') {
        if (typeof showToast === 'function') {
          showToast('Xác thực Quản trị viên thành công. Đang chuyển vào Bảng quản trị...', 'success');
        }
        setTimeout(() => {
          if (typeof window !== 'undefined') {
            window.location.href = data.redirectUrl || '/admin';
          }
        }, 600);
        return;
      }

      if (typeof showToast === 'function') {
        showToast('Xin chào, ' + (data.customer?.fullName || 'khách hàng'), 'success');
      }
      if (typeof closeModal === 'function') {
        closeModal('auth-modal');
      }
      document.getElementById('form-customer-login')?.reset();
      await checkAuthState();
      await loadWishlistState();
    } else {
      if (typeof showToast === 'function') {
        showToast(data.message || 'Sai số điện thoại/tài khoản hoặc mật khẩu', 'error');
      }
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Đăng nhập ngay';
    }
  }
}

async function handleCustomerRegister(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  if (typeof document === 'undefined') return;

  const btn = document.getElementById('btn-reg-submit');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Đang tạo tài khoản...';
  }

  const payload = {
    fullName: document.getElementById('reg-name')?.value.trim() || '',
    phone: document.getElementById('reg-phone')?.value.trim() || '',
    password: document.getElementById('reg-password')?.value || '',
    email: document.getElementById('reg-email')?.value.trim() || '',
    address: document.getElementById('reg-address')?.value.trim() || ''
  };

  try {
    const res = await fetch('/api/customers/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      if (typeof showToast === 'function') {
        showToast('Đăng ký tài khoản thành công', 'success');
      }
      if (typeof closeModal === 'function') {
        closeModal('auth-modal');
      }
      document.getElementById('form-customer-register')?.reset();
      await checkAuthState();
      await loadWishlistState();
    } else {
      if (typeof showToast === 'function') {
        showToast(data.message || 'Lỗi đăng ký tài khoản', 'error');
      }
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Tạo tài khoản';
    }
  }
}

async function logoutCustomer() {
  if (typeof confirm === 'function' && !confirm('Bạn có chắc chắn muốn đăng xuất tài khoản?')) {
    return;
  }
  try {
    await fetch('/api/customers/logout', { method: 'POST' });
    currentUser = null;
    if (typeof document !== 'undefined') {
      const badge = document.getElementById('user-profile-badge');
      const authBtn = document.getElementById('btn-open-auth');
      if (badge) badge.style.display = 'none';
      if (authBtn) authBtn.style.display = 'inline-flex';
      updateDrawerAccountUI(null);
      document.getElementById('order-form')?.reset();
    }
    if (typeof showToast === 'function') {
      showToast('Đã đăng xuất tài khoản', 'info');
    }
  } catch {}
}

function openCustomerPortal(tab = 'track', prefill = null) {
  if (typeof document !== 'undefined' && !document.getElementById('customer-portal-modal')) {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams();
      params.set('tab', tab || 'track');
      if (prefill && prefill.orderId) params.set('orderId', prefill.orderId);
      if (prefill && prefill.phone) params.set('phone', prefill.phone);
      window.location.href = '/customer-portal?' + params.toString();
    }
    return;
  }
  if (typeof openModal === 'function') {
    openModal('customer-portal-modal');
  }
  switchPortalTab(tab);

  if (typeof document === 'undefined') return;
  if (prefill && prefill.orderId) {
    const idInput = document.getElementById('track-order-id');
    const phoneInput = document.getElementById('track-order-phone');
    if (idInput) idInput.value = prefill.orderId;
    if (phoneInput) phoneInput.value = prefill.phone || currentUser?.phone || '';
    if (idInput?.value && phoneInput?.value) {
      executeTrackOrder(idInput.value, phoneInput.value);
    }
  } else if (tab === 'track' && currentUser?.phone) {
    const phoneInput = document.getElementById('track-order-phone');
    if (phoneInput && !phoneInput.value) phoneInput.value = currentUser.phone;
  }
}

function closeCustomerPortal() {
  if (typeof closeModal === 'function') {
    closeModal('customer-portal-modal');
  }
}

function switchPortalTab(tab) {
  if (typeof document === 'undefined') return;
  document.querySelectorAll('.portal-tabs .portal-tab-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-ptab') === tab);
  });

  ['track', 'orders', 'profile', 'wishlist'].forEach((t) => {
    const panel = document.getElementById(`portal-panel-${t}`);
    if (panel) panel.style.display = t === tab ? 'block' : 'none';
  });

  if (tab === 'orders') renderPortalOrdersTab();
  if (tab === 'profile') renderPortalProfileTab();
  if (tab === 'wishlist') renderPortalWishlistTab();
}

function renderOrderTimelineTracker(order) {
  const status = order.status || 'pending';
  const isCancelled = status === 'cancelled';

  const steps = [
    { key: 'pending', label: order.paymentMethod === 'qr' ? 'Chờ TT QR / Tiếp nhận' : 'Tiếp nhận lịch hẹn' },
    { key: 'confirmed', label: 'Đang vệ sinh / Chuẩn bị gear' },
    { key: 'shipping', label: 'Sẵn sàng tại Sảnh I' },
    { key: 'completed', label: 'Hoàn tất &amp; BH 7 ngày' }
  ];

  const rankMap = {
    awaiting_payment: 0,
    pending: 0,
    confirmed: 1,
    shipping: 2,
    completed: 3
  };
  const currentRank = rankMap[status] !== undefined ? rankMap[status] : 0;

  const stepsHtml = steps
    .map((s, idx) => {
      let stateClass = '';
      if (!isCancelled && (idx < currentRank || status === 'completed')) {
        stateClass = 'done';
      } else if (!isCancelled && idx === currentRank) {
        stateClass = 'current';
      }
      return `<div class="step-node ${stateClass}">${s.label}</div>`;
    })
    .join('');

  const cancelBanner = isCancelled
    ? `<div style="background-color: var(--danger-bg); color: var(--danger-ink); padding: 0.75rem 1rem; margin-top: 0.75rem; font-size: 0.875rem;">
        Đơn hàng này đã bị hủy (${order.paymentStatus === 'expired' ? 'Quá hạn thanh toán QR 15 phút' : 'Đã hủy'}).
      </div>`
    : '';

  const canCancel = ['pending', 'awaiting_payment'].includes(status);
  const canPayQr = status === 'awaiting_payment' && order.paymentStatus === 'awaiting_payment';
  const fmt = typeof formatMoney === 'function' ? formatMoney : (v) => v + ' ₫';

  return `
    <div class="cust-order-card" data-ui>
      <div class="cust-order-head">
        <div>
          <span class="cust-order-id">#${escPortal(order.id)}</span>
          <span style="font-size: 0.8125rem; color: var(--muted); margin-left: 0.5rem;">
            ${new Date(order.createdAt).toLocaleString('vi-VN')}
          </span>
        </div>
        <span style="font-size: 0.8125rem; padding: 0.25rem 0.6rem; background-color: var(--surface); color: var(--accent-text);">
          ${order.paymentMethod === 'qr' ? 'VietQR' : 'COD'} · ${
            order.paymentStatus === 'paid'
              ? 'Đã thanh toán'
              : order.paymentStatus === 'awaiting_payment'
                ? 'Chờ quét QR'
                : order.paymentStatus === 'expired'
                  ? 'Hết hạn QR'
                  : order.paymentStatus === 'cancelled' || order.paymentStatus === 'failed'
                    ? 'Đã hủy TT'
                    : 'Chưa thanh toán'
          }
        </span>
      </div>

      <div class="order-stepper">${stepsHtml}</div>
      ${cancelBanner}
      ${
        Array.isArray(order.statusHistory) && order.statusHistory.length > 0
          ? `<div style="margin-top: 0.65rem; padding: 0.65rem 0.85rem; background-color: var(--surface); font-size: 0.8125rem; color: var(--muted);">
              ${order.statusHistory
                .slice()
                .reverse()
                .map((h) => {
                  const ts = h.timestamp || h.time;
                  return `<div style="display:flex; justify-content:space-between; gap:0.5rem; padding:0.15rem 0;">
                      <span><strong style="color:var(--ink);">${escPortal(h.note || h.title || h.status)}</strong></span>
                      <span class="tabular">${ts ? new Date(ts).toLocaleString('vi-VN') : ''}</span>
                    </div>`;
                })
                .join('')}
            </div>`
          : ''
      }

      <div style="margin-top: 0.75rem; padding: 0.85rem; background-color: var(--surface); font-size: 0.875rem;">
        <div style="margin-bottom: 0.5rem;">
          ${(order.items || [])
            .map((i) => `<div>${escPortal(i.name)} (x${Number(i.quantity) || 1}) · <strong class="tabular">${fmt((i.price || 0) * (i.quantity || 1))}</strong></div>`)
            .join('')}
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem; padding-top: 0.5rem; color: var(--muted);">
          <span>Người nhận: ${escPortal(order.customerInfo?.fullName || '')} (${escPortal(order.customerInfo?.phone || '')}) · ${escPortal(order.customerInfo?.address || '')}</span>
          <strong class="tabular" style="font-size: 1rem; color: var(--accent-text);">Tổng: ${fmt(order.totalAmount)}</strong>
        </div>
        <div style="margin-top: 0.55rem; padding-top: 0.55rem; border-top: 1px dashed var(--border); font-size: 0.8125rem; color: var(--accent-text);">
          📍 Check-in tại bàn kỹ thuật Sảnh I ĐHKHTN · Mang theo Thẻ SV + Mã <strong>#${escPortal(order.id)}</strong>
        </div>
      </div>

      <div style="display: flex; justify-content: flex-end; gap: 0.65rem; margin-top: 0.85rem;">
        ${
          canPayQr
            ? `<button type="button" class="btn-primary-sage" onclick="openQrModalByOrderMeta('${String(order.id).replace(/'/g, "\\'")}', '${String(order.paymentRef || '').replace(/'/g, "\\'")}', '${String(order.paymentExpiresAt || '').replace(/'/g, "\\'")}', ${Number(order.totalAmount) || 0}, '${String(order.customerInfo?.phone || '').replace(/'/g, "\\'")}')">Mở mã VietQR</button>`
            : ''
        }
        ${
          canCancel
            ? `<button type="button" class="btn-remove" onclick="cancelCustomerOrderUI('${String(order.id).replace(/'/g, "\\'")}', '${String(order.customerInfo?.phone || '').replace(/'/g, "\\'")}')">Hủy đơn hàng</button>`
            : ''
        }
      </div>
    </div>
  `;
}

async function handleTrackOrderSubmit(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  if (typeof document === 'undefined') return;
  const orderId = document.getElementById('track-order-id')?.value.trim() || '';
  const phone = document.getElementById('track-order-phone')?.value.trim() || '';
  await executeTrackOrder(orderId, phone);
}

async function executeTrackOrder(orderId, phone) {
  if (typeof document === 'undefined') return;
  const box = document.getElementById('track-order-result');
  if (!box) return;
  box.innerHTML = '<p style="padding: 1rem; color: var(--muted);">Đang tra cứu tiến độ đơn hàng...</p>';

  try {
    const res = await fetch(
      `/api/orders/track?orderId=${encodeURIComponent(orderId)}&phone=${encodeURIComponent(phone)}`
    );
    const data = await res.json();
    if (!res.ok || !data.success || !data.order) {
      box.innerHTML = `
        <div style="padding: 1.25rem; background-color: var(--danger-bg); color: var(--danger-ink);">
          <strong>${data.message || 'Không tìm thấy đơn hàng'}</strong>
          <p style="font-size: 0.875rem; margin-top: 0.25rem;">Vui lòng kiểm tra lại chính xác Mã đơn và Số điện thoại đặt hàng.</p>
        </div>
      `;
      return;
    }
    box.innerHTML = renderOrderTimelineTracker(data.order);
  } catch {
    box.innerHTML = '<p style="color: var(--danger-ink); padding: 1rem;">Lỗi kết nối máy chủ khi tra cứu đơn hàng.</p>';
  }
}

async function cancelCustomerOrderUI(orderId, phone) {
  if (typeof prompt === 'undefined') return;
  const reason = prompt('Vui lòng nhập lý do hủy đơn hàng:', 'Thay đổi nhu cầu mua sắm');
  if (reason === null) return;

  try {
    const res = await fetch(`/api/orders/${orderId}/cancel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, reason })
    });
    const data = await res.json();
    if (data.success) {
      if (typeof showToast === 'function') {
        showToast('Đã hủy đơn hàng #' + orderId, 'info');
      }
      if (typeof document !== 'undefined') {
        const trackPanel = document.getElementById('portal-panel-track');
        if (trackPanel && trackPanel.style.display !== 'none') {
          executeTrackOrder(orderId, phone);
        } else {
          renderPortalOrdersTab();
        }
      }
    } else {
      if (typeof showToast === 'function') {
        showToast(data.message || 'Không thể hủy đơn hàng', 'error');
      }
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Lỗi kết nối khi hủy đơn hàng', 'error');
    }
  }
}

async function renderPortalOrdersTab() {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('my-orders-list-body');
  if (!container) return;
  container.innerHTML = '<p style="padding: 1rem; color: var(--muted);">Đang tải lịch sử đơn hàng...</p>';

  try {
    const res = await fetch('/api/customers/my-orders');
    const { success, orders } = await res.json();

    if (!success || !orders) {
      container.innerHTML = `
        <div style="padding: 2rem; background-color: var(--bg); text-align: center;">
          <p style="margin-bottom: 1rem;">Vui lòng đăng nhập tài khoản hoặc dùng tab Tra cứu vận đơn với Số điện thoại + Mã đơn.</p>
          <button type="button" class="btn-primary-sage" onclick="closeCustomerPortal(); openAuthModal('login');">Đăng nhập ngay</button>
        </div>
      `;
      return;
    }

    if (orders.length === 0) {
      container.innerHTML = '<p style="padding: 1.5rem; background-color: var(--bg); color: var(--muted); text-align: center;">Bạn chưa có lịch hẹn dịch vụ nào tại GearHub.</p>';
      return;
    }

    container.innerHTML = orders.map((o) => renderOrderTimelineTracker(o)).join('');
  } catch {
    container.innerHTML = '<p style="color: var(--danger-ink);">Lỗi tải danh sách đơn hàng.</p>';
  }
}

async function renderPortalProfileTab() {
  if (typeof document === 'undefined') return;
  const box = document.getElementById('portal-profile-content');
  if (!box) return;

  if (!currentUser) {
    box.innerHTML = `
      <div style="padding: 2rem; background-color: var(--bg); text-align: center;">
        <p style="margin-bottom: 1rem;">Đăng nhập để quản lý Sổ địa chỉ nhận hàng mặc định và theo dõi hạng thành viên.</p>
        <button type="button" class="btn-primary-sage" onclick="closeCustomerPortal(); openAuthModal('login');">Đăng nhập / Đăng ký</button>
      </div>
    `;
    return;
  }

  const spent = Number(currentUser.totalSpent) || 0;
  const tag = currentUser.tag || 'Mới';
  const fmt = typeof formatMoney === 'function' ? formatMoney : (v) => v + ' ₫';

  box.innerHTML = `
    <div style="padding: 1.25rem; background-color: var(--bg); margin-bottom: 1.5rem;">
      <div style="display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 1rem;">
        <div>
          <span style="font-size: 0.8125rem; color: var(--muted);">Hạng thành viên hiện tại</span>
          <div style="font-size: 1.35rem; font-weight: 600; color: var(--accent-text);">${escPortal(tag)}</div>
        </div>
        <div class="tabular" style="font-size: 0.9375rem;">
          Đã hoàn tất <strong>${Number(currentUser.orderCount) || 0} đơn</strong> · Chi tiêu tích lũy: <strong style="color: var(--accent-text);">${fmt(spent)}</strong>
        </div>
      </div>
    </div>

    <form id="form-portal-profile" onsubmit="handleUpdateCustomerProfile(event)">
      <div class="form-row">
        <div class="form-group">
          <label for="prof-fullname">Họ và tên người nhận</label>
          <input type="text" id="prof-fullname" required value="${escPortal(currentUser.fullName || '')}">
        </div>
        <div class="form-group">
          <label>Số điện thoại định danh</label>
          <input type="tel" value="${escPortal(currentUser.phone || '')}" disabled style="opacity: 0.65;">
        </div>
      </div>
      <div class="form-group">
        <label for="prof-email">Email nhận hóa đơn</label>
        <input type="email" id="prof-email" value="${escPortal(currentUser.email || '')}" placeholder="example@email.com">
      </div>
      <div class="form-group">
        <label for="prof-address">Địa chỉ giao hàng mặc định</label>
        <textarea id="prof-address" rows="2" required>${escPortal(currentUser.address || '')}</textarea>
      </div>
      <div class="form-group">
        <label for="prof-note">Ghi chú giao hàng mặc định</label>
        <input type="text" id="prof-note" value="${escPortal(currentUser.note || '')}" placeholder="Giao giờ hành chính">
      </div>
      <button type="submit" class="btn-submit" id="btn-save-profile">Lưu hồ sơ &amp; địa chỉ mặc định</button>
    </form>
  `;
}

async function handleUpdateCustomerProfile(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  if (typeof document === 'undefined') return;

  const btn = document.getElementById('btn-save-profile');
  if (btn) btn.disabled = true;

  const payload = {
    fullName: document.getElementById('prof-fullname')?.value.trim() || '',
    email: document.getElementById('prof-email')?.value.trim() || '',
    address: document.getElementById('prof-address')?.value.trim() || '',
    note: document.getElementById('prof-note')?.value.trim() || ''
  };

  try {
    const res = await fetch('/api/customers/profile', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      currentUser = data.customer;
      if (typeof showToast === 'function') {
        showToast(data.message || 'Đã cập nhật hồ sơ mặc định', 'success');
      }
      await checkAuthState();
      renderPortalProfileTab();
    } else {
      if (typeof showToast === 'function') {
        showToast(data.message || 'Lỗi cập nhật hồ sơ', 'error');
      }
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Lỗi kết nối máy chủ', 'error');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function renderPortalWishlistTab() {
  if (typeof document === 'undefined') return;
  const box = document.getElementById('portal-wishlist-content');
  if (!box) return;
  box.innerHTML = '<p style="padding: 1rem; color: var(--muted);">Đang tải danh sách yêu thích...</p>';

  try {
    const res = await fetch('/api/customers/wishlist');
    const data = await res.json();
    const items = data.products || [];
    if (items.length === 0) {
      box.innerHTML = '<p style="padding: 1.5rem; background-color: var(--bg); color: var(--muted); text-align: center;">Danh sách yêu thích đang trống.</p>';
      return;
    }

    const fmt = typeof formatMoney === 'function' ? formatMoney : (v) => v + ' ₫';
    box.innerHTML = `
      <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(220px, 1fr)); gap: 1rem;">
        ${items
          .map(
            (p) => `
          <div style="background-color: var(--bg); padding: 1rem; display: flex; flex-direction: column; gap: 0.5rem;">
            <img src="${p.image}" alt="${p.name}" loading="lazy" style="width: 100%; height: 140px; object-fit: contain;">
            <strong style="font-size: 0.9375rem;">${p.name}</strong>
            <span class="tabular" style="color: var(--accent-text); font-weight: 600;">${fmt(p.price)}</span>
            <div style="display: flex; gap: 0.5rem; margin-top: auto;">
              <button type="button" class="btn-buy-now" style="flex: 1; padding: 0.5rem;" onclick="closeCustomerPortal(); buyNow('${p.id}')">${p.category === 'rental' ? 'Thuê ngay' : (p.category === 'service' ? 'Đặt lịch' : 'Mua ngay')}</button>
              <button type="button" class="btn-remove" onclick="toggleWishlistItem('${p.id}')">Xóa</button>
            </div>
          </div>
        `
          )
          .join('')}
      </div>
    `;
  } catch {
    box.innerHTML = '<p style="color: var(--danger-ink);">Lỗi tải danh sách yêu thích.</p>';
  }
}
