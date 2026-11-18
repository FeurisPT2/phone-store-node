// ============================================================================
// GEARHUB CART & ORDER CHECKOUT (COD + VIETQR)
// Handles tri-tier partitions, mini-cart hover dropdown, and dedicated /cart page
// ============================================================================

let lastPlacedOrder = null;

function escCart(v) {
  if (typeof escapeHtml === 'function') return escapeHtml(v);
  return String(v ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function stripSlotPrefix(addr) {
  return String(addr || '').replace(/^(?:\[Khung giờ:[^\]]*\]\s*-\s*)+/i, '').trim();
}

function buildBookingAddress(hallSlot, rawBaseAddress) {
  const cleanBase = stripSlotPrefix(rawBaseAddress);
  if (hallSlot && cleanBase) return `[Khung giờ: ${hallSlot}] - ${cleanBase}`;
  if (hallSlot) return `Trạm Sảnh I ĐHKHTN (${hallSlot})`;
  return cleanBase || 'Trạm Sảnh I ĐHKHTN (227 Nguyễn Văn Cừ, Q.5)';
}

async function addToCart(productId, openAfter = false) {
  try {
    const res = await fetch('/api/cart/add', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    const data = await res.json();
    if (data.success) {
      lastPlacedOrder = null;
      await updateCart();
      if (typeof showToast === 'function') {
        showToast('Đã thêm sản phẩm vào giỏ hàng', 'success');
      }
      if (openAfter) {
        window.location.href = '/cart';
      }
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Không thể thêm sản phẩm vào giỏ hàng', 'error');
    }
  }
}

async function buyNow(productId) {
  await addToCart(productId, true);
}

async function updateCartQty(productId, newQty) {
  try {
    await fetch('/api/cart/update', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId, quantity: newQty })
    });
    await updateCart();
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && cartModal.classList.contains('active')) {
      await openCartModal();
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Không thể cập nhật số lượng', 'error');
    }
  }
}

async function removeCartItem(productId) {
  try {
    await fetch('/api/cart/remove', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId })
    });
    await updateCart();
    const cartModal = document.getElementById('cart-modal');
    if (cartModal && cartModal.classList.contains('active')) {
      await openCartModal();
    }
    if (typeof showToast === 'function') {
      showToast('Đã xóa mục khỏi giỏ hàng', 'info');
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Không thể xóa sản phẩm khỏi giỏ', 'error');
    }
  }
}

async function clearFullCart() {
  try {
    const res = await fetch('/api/cart/clear', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    const data = await res.json();
    if (data.success) {
      await updateCart();
      const cartModal = document.getElementById('cart-modal');
      if (cartModal && cartModal.classList.contains('active')) {
        await openCartModal();
      }
      if (typeof showToast === 'function') {
        showToast('Đã xóa toàn bộ giỏ hàng', 'info');
      }
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Không thể xóa giỏ hàng', 'error');
    }
  }
}

function renderCartDropdownFlyout(cart, total) {
  if (typeof document === 'undefined') return;
  const flyout = document.getElementById('cart-dropdown-flyout');
  if (!flyout) return;

  const fmt = typeof formatMoney === 'function' ? formatMoney : (v) => Number(v || 0).toLocaleString('vi-VN') + ' ₫';
  const totalCount = (cart || []).reduce((s, i) => s + (i.quantity || 1), 0);

  if (!cart || cart.length === 0) {
    flyout.innerHTML = `
      <div class="flyout-header">
        <span class="flyout-title">Giỏ hàng &amp; Lịch hẹn</span>
        <span class="flyout-count">0 mục</span>
      </div>
      <div class="flyout-empty" style="padding: 1.5rem 1rem; text-align: center; color: var(--muted); font-size: 0.8125rem;">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" width="32" height="32" style="margin: 0 auto 0.5rem; display: block; opacity: 0.45;"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
        <div>Chưa có dịch vụ hoặc thiết bị trong giỏ</div>
        <div style="font-size: 0.75rem; color: var(--muted-soft); margin-top: 4px;">Khám phá vệ sinh máy tính hoặc thuê gear tại Sảnh I</div>
      </div>
      <div class="flyout-footer">
        <a href="/shop" class="btn-flyout-checkout" style="text-decoration:none;">
          <span>Khám Phá Cửa Hàng</span>
          <span aria-hidden="true">&rarr;</span>
        </a>
      </div>
    `;
    return;
  }

  const itemsHtml = cart.map((i) => {
    const cat = String(i.category || '').toLowerCase();
    const id = String(i.id || '').toLowerCase();
    let tierBadge = 'Phụ kiện';
    if (cat === 'service' || id.includes('clean') || id.includes('thermal') || id.includes('speedup') || id.includes('keycare')) {
      tierBadge = 'Dịch vụ';
    } else if (cat === 'rental' || id.includes('rent')) {
      tierBadge = 'Thuê gear';
    }

    return `
      <div class="flyout-item">
        <img class="flyout-item-img" src="${i.image || ''}" alt="${i.name}" loading="lazy">
        <div class="flyout-item-info">
          <div class="flyout-item-name" title="${i.name}">${i.name}</div>
          <div class="flyout-item-meta">
            <span class="flyout-tier-badge">${tierBadge}</span>
            <span class="flyout-item-calc">${i.quantity} &times; ${fmt(i.price)}</span>
          </div>
        </div>
        <button type="button" class="flyout-item-remove" onclick="removeCartItem('${i.id}')" title="Xóa mục khỏi giỏ">&times;</button>
      </div>
    `;
  }).join('');

  flyout.innerHTML = `
    <div class="flyout-header">
      <span class="flyout-title">Giỏ hàng &amp; Lịch hẹn</span>
      <span class="flyout-count">${totalCount} mục</span>
    </div>
    <div class="flyout-items-list">
      ${itemsHtml}
    </div>
    <div class="flyout-footer">
      <div class="flyout-total-row">
        <span>Tạm tính:</span>
        <strong>${fmt(total || 0)}</strong>
      </div>
      <div class="flyout-deposit-badge">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="13" height="13"><circle cx="12" cy="12" r="10"></circle><polyline points="12 6 12 12 14 14"></polyline></svg>
        <span>0đ cọc thuê khi có Thẻ Sinh Viên</span>
      </div>
      <a href="/cart" class="btn-flyout-checkout" style="text-decoration:none;">
        <span>Xem Giỏ Hàng &amp; Đặt Lịch</span>
        <span aria-hidden="true">&rarr;</span>
      </a>
    </div>
  `;
}

function renderCartPage(cart, total) {
  if (typeof document === 'undefined') return;
  const container = document.getElementById('cart-page-items');
  if (!container) return;

  const fmt = typeof formatMoney === 'function' ? formatMoney : (v) => Number(v || 0).toLocaleString('vi-VN') + ' ₫';
  const totalCount = (cart || []).reduce((s, i) => s + (i.quantity || 1), 0);

  const countBadge = document.getElementById('cart-page-count');
  if (countBadge) countBadge.innerText = `${totalCount} mục`;

  const submitBtn = document.getElementById('btn-order-submit');
  const bottomActions = document.getElementById('cart-bottom-actions');
  const sidebar = (typeof document.querySelector === 'function' && document.querySelector('.cart-order-sidebar')) ||
                  (typeof document.getElementById === 'function' && document.getElementById('cart-order-sidebar')) || null;
  const grid = (typeof document.getElementById === 'function' && document.getElementById('cart-page-grid')) || null;

  if (!cart || cart.length === 0) {
    if (sidebar) sidebar.style.display = 'none';
    if (grid && grid.classList) grid.classList.add('is-empty');

    if (lastPlacedOrder && lastPlacedOrder.id) {
      const info = lastPlacedOrder.customerInfo || {};
      const safeId = escCart(lastPlacedOrder.id);
      const trackHref = `/customer-portal?tab=track&orderId=${encodeURIComponent(lastPlacedOrder.id)}&phone=${encodeURIComponent(info.phone || '')}`;
      container.innerHTML = `
        <div class="cart-booking-success" style="padding: 2.25rem 1.75rem; background: var(--surface); border: 1.5px solid #16a34a; border-radius: var(--radius-md); box-shadow: var(--shadow-sm);">
          <div style="display:flex; align-items:center; gap:0.85rem; margin-bottom:1.25rem;">
            <span style="width:44px; height:44px; border-radius:999px; background:#dcfce7; color:#15803d; display:inline-flex; align-items:center; justify-content:center; flex-shrink:0;">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
            </span>
            <div>
              <h3 style="font-size:1.2rem; font-weight:800; color:var(--ink); margin:0;">Đặt Lịch Hẹn Tại Sảnh I Thành Công!</h3>
              <p style="font-size:0.875rem; color:var(--muted); margin-top:2px;">Vui lòng mang máy và Thẻ Sinh Viên đến quầy kỹ thuật đúng khung giờ đã hẹn.</p>
            </div>
          </div>

          <div style="padding:1rem 1.15rem; background:var(--surface-raised); border:1px solid var(--border); border-radius:var(--radius-sm); display:grid; gap:0.55rem; font-size:0.9rem; margin-bottom:1.25rem;">
            <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:0.5rem;">
              <span style="color:var(--muted);">Mã đơn hẹn:</span>
              <div style="display:inline-flex; align-items:center; gap:0.5rem;">
                <strong class="tabular" style="font-size:1.05rem; color:var(--accent-text);">#${safeId}</strong>
                <button type="button" class="btn-copy-mini" onclick="copyTextToClipboard('${String(lastPlacedOrder.id).replace(/'/g, "\\'")}', 'Mã đơn')">Sao chép</button>
              </div>
            </div>
            <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
              <span style="color:var(--muted);">Sinh viên:</span>
              <strong style="color:var(--ink);">${escCart(info.fullName || '')} (${escCart(info.phone || '')})</strong>
            </div>
            <div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap;">
              <span style="color:var(--muted);">Địa điểm &amp; Ca hẹn:</span>
              <strong style="color:var(--ink); text-align:right;">${escCart(info.address || 'Trạm Sảnh I ĐHKHTN')}</strong>
            </div>
            ${info.note ? `<div style="display:flex; justify-content:space-between; gap:1rem; flex-wrap:wrap;"><span style="color:var(--muted);">Ghi chú / MSSV:</span><span style="color:var(--ink); text-align:right;">${escCart(info.note)}</span></div>` : ''}
            <div style="display:flex; justify-content:space-between; gap:1rem; padding-top:0.5rem; border-top:1px solid var(--border);">
              <span style="color:var(--muted);">Thanh toán khi hoàn tất (COD):</span>
              <strong class="tabular" style="font-size:1.05rem; color:var(--ink);">${fmt(lastPlacedOrder.totalAmount || 0)}</strong>
            </div>
          </div>

          <div style="display:flex; flex-wrap:wrap; gap:0.75rem;">
            <a href="${trackHref}" class="cta-btn-primary" style="display:inline-flex; align-items:center; gap:8px; padding:0.75rem 1.35rem; text-decoration:none; border-radius:var(--radius-sm); font-weight:700;">
              <span>Tra cứu tiến trình lịch hẹn</span>
              <span aria-hidden="true">&rarr;</span>
            </a>
            <a href="/shop" class="btn-continue-shopping" style="display:inline-flex; align-items:center; gap:6px; font-size:0.875rem; font-weight:600; color:var(--ink); text-decoration:none; padding:0.75rem 1.25rem; border-radius:var(--radius-sm); border:1px solid var(--border-strong); background:var(--surface);">
              Tiếp tục khám phá Cửa hàng
            </a>
          </div>
        </div>
      `;
    } else {
      container.innerHTML = `
        <div class="cart-empty-page" style="padding: 3.5rem 1.5rem; text-align: center; background: var(--surface-raised); border-radius: var(--radius-md); border: 1px dashed var(--border); color: var(--muted);">
          <svg style="margin: 0 auto 1.25rem; color: var(--muted); opacity: 0.5;" width="52" height="52" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="9" cy="21" r="1"></circle><circle cx="20" cy="21" r="1"></circle><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"></path></svg>
          <h3 style="font-size: 1.2rem; color: var(--ink); margin-bottom: 0.5rem; font-weight: 700;">Giỏ hàng của bạn đang trống</h3>
          <p style="font-size: 0.875rem; margin-bottom: 1.5rem; max-width: 420px; margin-left: auto; margin-right: auto; line-height: 1.5;">
            Bạn chưa chọn gói dịch vụ vệ sinh laptop hay thiết bị mượn nào. Hãy khám phá các giải pháp học tập tại Trạm Sảnh I.
          </p>
          <a href="/shop" class="cta-btn-primary" style="display: inline-flex; align-items: center; gap: 8px; padding: 0.8rem 1.6rem; text-decoration: none; border-radius: var(--radius-sm); font-weight: 700;">
            <span>Khám phá Cửa hàng ngay</span>
            <span aria-hidden="true">&rarr;</span>
          </a>
        </div>
      `;
    }

    if (bottomActions) bottomActions.style.display = 'none';

    const subtotalEl = document.getElementById('summary-subtotal');
    if (subtotalEl) subtotalEl.innerText = '0 ₫';

    const grandTotalEl = document.getElementById('cart-grand-total');
    if (grandTotalEl) grandTotalEl.innerText = '0 ₫';

    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.innerText = 'Giỏ hàng đang trống';
      submitBtn.style.opacity = '0.6';
      submitBtn.style.cursor = 'not-allowed';
    }
    return;
  }

  if (sidebar) sidebar.style.display = '';
  if (grid && grid.classList) grid.classList.remove('is-empty');
  if (bottomActions) bottomActions.style.display = 'flex';

  const {
    serviceItems,
    rentalItems,
    retailItems,
    serviceSubtotal,
    rentalSubtotal,
    retailSubtotal,
    grandTotal
  } = partitionCartTiers(cart);

  const renderPageItemRow = (i) => `
    <div class="cart-item">
      <div class="cart-item-info">
        <img class="cart-item-img" src="${i.image || ''}" alt="${i.name}" loading="lazy">
        <div class="cart-item-body">
          <div class="cart-item-title">${i.name}</div>
          <div class="cart-item-price">
            ${fmt(i.price)} &times; ${i.quantity} = <strong style="color: var(--ink); font-variant-numeric: tabular-nums;">${fmt(i.price * i.quantity)}</strong>
          </div>
        </div>
      </div>
      <div class="cart-item-controls">
        <div class="cart-qty-stepper">
          <button type="button" class="qty-btn" onclick="updateCartQty('${i.id}', ${i.quantity - 1})" title="Giảm số lượng" aria-label="Giảm số lượng">-</button>
          <span class="tabular qty-count">${i.quantity}</span>
          <button type="button" class="qty-btn" onclick="updateCartQty('${i.id}', ${i.quantity + 1})" title="Tăng số lượng" aria-label="Tăng số lượng">+</button>
        </div>
        <button type="button" class="btn-remove" onclick="removeCartItem('${i.id}')" title="Xóa khỏi giỏ" aria-label="Xóa sản phẩm">Xóa</button>
      </div>
    </div>
  `;

  let html = '';

  if (serviceItems.length > 0) {
    html += `
      <div class="cart-tier-section" style="margin-bottom: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; background: var(--surface);">
        <div class="cart-tier-header" style="padding: 0.75rem 1rem; background: var(--surface-raised); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
          <div class="cart-tier-title" style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.95rem; color: var(--ink);">
            <span>🛠️ Lịch Hẹn Dịch Vụ Vệ Sinh &amp; Tản Nhiệt</span>
            <span class="cart-tier-badge" style="font-size: 0.72rem; padding: 0.1rem 0.5rem; border-radius: var(--radius-pill); background: var(--surface); border: 1px solid var(--border); color: var(--muted);">${serviceItems.length} dịch vụ</span>
          </div>
        </div>
        <div class="cart-tier-body">
          ${serviceItems.map(renderPageItemRow).join('')}
        </div>
        <div class="cart-tier-subtotal-row" style="padding: 0.65rem 1rem; background: var(--surface-raised); border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; color: var(--muted);">
          <span>⏱️ Cam kết: Lấy liền 30-45 phút tại Sảnh I</span>
          <span>Tạm tính dịch vụ: <strong style="color: var(--ink); font-variant-numeric: tabular-nums;">${fmt(serviceSubtotal)}</strong></span>
        </div>
      </div>
    `;
  }

  if (rentalItems.length > 0) {
    html += `
      <div class="cart-tier-section" style="margin-bottom: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; background: var(--surface);">
        <div class="cart-tier-header" style="padding: 0.75rem 1rem; background: var(--surface-raised); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
          <div class="cart-tier-title" style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.95rem; color: var(--ink);">
            <span>📦 Thiết Bị Cho Thuê (Phím Cơ, Chuột, Hub)</span>
            <span class="cart-tier-badge" style="font-size: 0.72rem; padding: 0.1rem 0.5rem; border-radius: var(--radius-pill); background: var(--surface); border: 1px solid var(--border); color: var(--muted);">${rentalItems.length} thiết bị</span>
          </div>
        </div>
        <div class="cart-policy-notice" style="padding: 0.5rem 1rem; background: var(--surface-subtle, rgba(0,0,0,0.02)); border-bottom: 1px solid var(--border); font-size: 0.8rem; color: var(--muted); display: flex; align-items: center; gap: 6px;">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
          <span>Chính sách đặc quyền: <strong>0đ tiền cọc</strong> · Chỉ cần xuất trình Thẻ Sinh Viên (MSSV)</span>
        </div>
        <div class="cart-tier-body">
          ${rentalItems.map(renderPageItemRow).join('')}
        </div>
        <div class="cart-tier-subtotal-row" style="padding: 0.65rem 1rem; background: var(--surface-raised); border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; color: var(--muted);">
          <span>🔌 Được mượn kèm cáp kết nối đầy đủ</span>
          <span>Tạm tính thuê: <strong style="color: var(--ink); font-variant-numeric: tabular-nums;">${fmt(rentalSubtotal)}</strong></span>
        </div>
      </div>
    `;
  }

  if (retailItems.length > 0) {
    html += `
      <div class="cart-tier-section" style="margin-bottom: 1.25rem; border: 1px solid var(--border); border-radius: var(--radius-sm); overflow: hidden; background: var(--surface);">
        <div class="cart-tier-header" style="padding: 0.75rem 1rem; background: var(--surface-raised); border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between;">
          <div class="cart-tier-title" style="display: flex; align-items: center; gap: 0.5rem; font-weight: 700; font-size: 0.95rem; color: var(--ink);">
            <span>🛍️ Phụ Kiện Mua Đứt &amp; Kit Chăm Sóc</span>
            <span class="cart-tier-badge" style="font-size: 0.72rem; padding: 0.1rem 0.5rem; border-radius: var(--radius-pill); background: var(--surface); border: 1px solid var(--border); color: var(--muted);">${retailItems.length} sản phẩm</span>
          </div>
        </div>
        <div class="cart-tier-body">
          ${retailItems.map(renderPageItemRow).join('')}
        </div>
        <div class="cart-tier-subtotal-row" style="padding: 0.65rem 1rem; background: var(--surface-raised); border-top: 1px solid var(--border); display: flex; justify-content: space-between; align-items: center; font-size: 0.8125rem; color: var(--muted);">
          <span>📍 Nhận ngay tại bàn kỹ thuật Sảnh I</span>
          <span>Tạm tính phụ kiện: <strong style="color: var(--ink); font-variant-numeric: tabular-nums;">${fmt(retailSubtotal)}</strong></span>
        </div>
      </div>
    `;
  }

  container.innerHTML = html;

  const subtotalEl = document.getElementById('summary-subtotal');
  if (subtotalEl) subtotalEl.innerText = fmt(grandTotal);

  const grandTotalEl = document.getElementById('cart-grand-total');
  if (grandTotalEl) grandTotalEl.innerText = fmt(grandTotal);

  const qrAmountEl = document.getElementById('qr-amount') || document.getElementById('qr-amount-display');
  if (qrAmountEl) qrAmountEl.innerText = fmt(grandTotal);

  if (submitBtn) {
    submitBtn.disabled = false;
    submitBtn.style.opacity = '1';
    submitBtn.style.cursor = 'pointer';
    submitBtn.innerText = 'Xác Nhận Đặt Lịch Hẹn Tại Sảnh (COD) →';
  }

  // Pre-fill user info if logged in
  const user = typeof currentUser !== 'undefined' ? currentUser : null;
  if (user) {
    const cName = document.getElementById('c-name');
    const cPhone = document.getElementById('c-phone');
    const cAddr = document.getElementById('c-address');
    const cNote = document.getElementById('c-note');
    if (cName && !cName.value) cName.value = user.fullName || '';
    if (cPhone && !cPhone.value) cPhone.value = user.phone || '';
    if (cAddr && !cAddr.value) cAddr.value = stripSlotPrefix(user.address);
    if (cNote && !cNote.value) cNote.value = user.note || '';
  }

  const orderForm = document.getElementById('order-form');
  if (orderForm && !orderForm.__cartBound) {
    orderForm.__cartBound = true;
    orderForm.addEventListener('submit', handlePlaceOrder);
  }
}

async function updateCart() {
  try {
    const res = await fetch('/api/cart');
    const { cart, total } = await res.json();
    const count = (cart || []).reduce((s, i) => s + (i.quantity || 1), 0);
    if (typeof document !== 'undefined') {
      const el = document.getElementById('cart-count');
      if (el) el.innerText = count;

      // Render hover dropdown flyout
      renderCartDropdownFlyout(cart, total);

      // Render dedicated cart page if on /cart
      if (document.getElementById('cart-page-items')) {
        renderCartPage(cart, total);
      }
    }
    return { cart, total };
  } catch (err) {
    console.error('Error updating cart:', err);
  }
}

function selectPaymentMethodUI(method) {
  if (typeof document === 'undefined') return;
  document.getElementById('pay-opt-cod')?.classList.add('active');
  document.getElementById('pay-opt-qr')?.classList.remove('active');

  const radios = document.querySelectorAll('input[name="paymentMethod"]');
  radios.forEach((r) => {
    r.checked = true;
  });

  const btn = document.getElementById('btn-order-submit');
  if (btn && !btn.disabled) {
    btn.innerText = 'Xác Nhận Đặt Lịch Hẹn Tại Sảnh (COD) →';
  }
}

function partitionCartTiers(cart) {
  const serviceItems = [];
  const rentalItems = [];
  const retailItems = [];

  (cart || []).forEach((i) => {
    const cat = String(i.category || '').toLowerCase();
    const id = String(i.id || '').toLowerCase();
    if (cat === 'service') {
      serviceItems.push(i);
    } else if (cat === 'rental') {
      rentalItems.push(i);
    } else if (cat === 'accessory' || cat === 'retail' || cat === 'product') {
      retailItems.push(i);
    } else if (id.includes('rent')) {
      rentalItems.push(i);
    } else if (
      id.includes('clean') ||
      id.includes('thermal') ||
      id.includes('speedup') ||
      id.includes('keycare') ||
      id.includes('service')
    ) {
      serviceItems.push(i);
    } else {
      retailItems.push(i);
    }
  });

  const serviceSubtotal = serviceItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
  const rentalSubtotal = rentalItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
  const retailSubtotal = retailItems.reduce((s, it) => s + (it.price || 0) * (it.quantity || 1), 0);
  const depositTotal = 0; // 0đ deposit policy based on student ID
  const grandTotal = serviceSubtotal + rentalSubtotal + retailSubtotal;

  return {
    serviceItems,
    rentalItems,
    retailItems,
    serviceSubtotal,
    rentalSubtotal,
    retailSubtotal,
    depositTotal,
    grandTotal
  };
}

async function openCartModal() {
  if (typeof document === 'undefined') return;
  try {
    const res = await fetch('/api/cart');
    const { cart, total } = await res.json();
    const container = document.getElementById('cart-items');
    const fmt = typeof formatMoney === 'function' ? formatMoney : (v) => v + ' ₫';

    if (!cart || cart.length === 0) {
      if (container) {
        container.innerHTML =
          '<div style="padding: 2rem 1.5rem; background-color: var(--surface-raised); border-radius: var(--radius-md); border: 1px dashed var(--border); color: var(--muted); text-align: center;">Giỏ hàng của bạn đang trống.<br><span style="font-size:0.875rem;">Hãy khám phá dịch vụ vệ sinh hoặc thiết bị cho thuê của GearHub!</span></div>';
      }
      const totalEl = document.getElementById('cart-total');
      if (totalEl) totalEl.innerText = '0 ₫';
    } else {
      const {
        serviceItems,
        rentalItems,
        retailItems,
        serviceSubtotal,
        rentalSubtotal,
        retailSubtotal
      } = partitionCartTiers(cart);

      const renderItemHtml = (i) => `
        <div class="cart-item">
          <div class="cart-item-info">
            <img class="cart-item-img" src="${i.image || ''}" alt="${i.name}" loading="lazy">
            <div>
              <div class="cart-item-title">${i.name}</div>
              <div class="cart-item-price">${fmt(i.price)} &times; ${i.quantity} = ${fmt(i.price * i.quantity)}</div>
            </div>
          </div>
          <div class="cart-item-controls">
            <button type="button" class="qty-btn" onclick="updateCartQty('${i.id}', ${i.quantity - 1})">-</button>
            <span class="tabular" style="min-width: 1.5rem; text-align: center;">${i.quantity}</span>
            <button type="button" class="qty-btn" onclick="updateCartQty('${i.id}', ${i.quantity + 1})">+</button>
            <button type="button" class="btn-remove" onclick="removeCartItem('${i.id}')">Xóa</button>
          </div>
        </div>
      `;

      let tierHtml = '';

      if (serviceItems.length > 0) {
        tierHtml += `
          <div class="cart-tier-section">
            <div class="cart-tier-header">
              <div class="cart-tier-title">
                <span>🛠️ Lịch Hẹn Dịch Vụ Vệ Sinh & Tản Nhiệt</span>
                <span class="cart-tier-badge">${serviceItems.length} mục</span>
              </div>
            </div>
            <div class="cart-tier-body">
              ${serviceItems.map(renderItemHtml).join('')}
            </div>
            <div class="cart-tier-subtotal-row">
              <span>Cam kết: Lấy liền 30-45 phút tại Sảnh I</span>
              <span>Tạm tính dịch vụ: <strong>${fmt(serviceSubtotal)}</strong></span>
            </div>
          </div>
        `;
      }

      if (rentalItems.length > 0) {
        tierHtml += `
          <div class="cart-tier-section">
            <div class="cart-tier-header">
              <div class="cart-tier-title">
                <span>📦 Thiết Bị Cho Thuê (Phím Cơ, Chuột, Hub)</span>
                <span class="cart-tier-badge">${rentalItems.length} mục</span>
              </div>
            </div>
            <div class="cart-policy-notice" style="margin: 0.5rem 1rem 0;">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
              <span>Chính sách: 0đ tiền cọc · Chỉ cần xuất trình Thẻ Sinh Viên (MSSV)</span>
            </div>
            <div class="cart-tier-body">
              ${rentalItems.map(renderItemHtml).join('')}
            </div>
            <div class="cart-tier-subtotal-row">
              <span>Được mượn kèm cáp kết nối đầy đủ</span>
              <span>Tạm tính thuê: <strong>${fmt(rentalSubtotal)}</strong></span>
            </div>
          </div>
        `;
      }

      if (retailItems.length > 0) {
        tierHtml += `
          <div class="cart-tier-section">
            <div class="cart-tier-header">
              <div class="cart-tier-title">
                <span>🛍️ Phụ Kiện Mua Đứt & Kit Chăm Sóc</span>
                <span class="cart-tier-badge">${retailItems.length} mục</span>
              </div>
            </div>
            <div class="cart-tier-body">
              ${retailItems.map(renderItemHtml).join('')}
            </div>
            <div class="cart-tier-subtotal-row">
              <span>Giao ngay tại sảnh hoặc ship nội thành</span>
              <span>Tạm tính phụ kiện: <strong>${fmt(retailSubtotal)}</strong></span>
            </div>
          </div>
        `;
      }

      if (container) {
        container.innerHTML = tierHtml;
      }
      const totalEl = document.getElementById('cart-total');
      if (totalEl) totalEl.innerText = fmt(total || 0);
    }

    const user = typeof currentUser !== 'undefined' ? currentUser : null;
    if (user) {
      const cName = document.getElementById('c-name');
      const cPhone = document.getElementById('c-phone');
      const cAddr = document.getElementById('c-address');
      const cNote = document.getElementById('c-note');
      if (cName) cName.value = user.fullName || '';
      if (cPhone) cPhone.value = user.phone || '';
      if (cAddr) cAddr.value = stripSlotPrefix(user.address);
      if (cNote && !cNote.value) cNote.value = user.note || '';
      const hint = document.getElementById('remember-hint');
      if (hint) hint.style.display = 'inline';
    }

    const orderForm = document.getElementById('order-form');
    if (orderForm && !orderForm.__cartBound) {
      orderForm.__cartBound = true;
      orderForm.addEventListener('submit', handlePlaceOrder);
    }

    if (typeof openModal === 'function') {
      openModal('cart-modal');
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Không thể tải giỏ hàng', 'error');
    }
  }
}

function closeCartModal() {
  if (typeof closeModal === 'function') {
    closeModal('cart-modal');
  }
}

async function handlePlaceOrder(e) {
  if (e && typeof e.preventDefault === 'function') {
    e.preventDefault();
  }
  if (typeof document === 'undefined') return;

  const btn = document.getElementById('btn-order-submit');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Đang khởi tạo lịch hẹn...';
  }

  const selectedRadio = document.querySelector('input[name="paymentMethod"]:checked');
  const rawMethod = selectedRadio ? selectedRadio.value : 'COD';
  const paymentMethod = rawMethod.toUpperCase() === 'BANK_QR' || rawMethod.toLowerCase() === 'qr' ? 'qr' : 'cod';

  const studentId = document.getElementById('c-student-id')?.value.trim() || '';
  const hallSlot = document.getElementById('c-hall-slot')?.value.trim() || '';
  const baseAddress = document.getElementById('c-address')?.value.trim() || '';
  const baseNote = document.getElementById('c-note')?.value.trim() || '';

  const combinedAddress = buildBookingAddress(hallSlot, baseAddress);
  const combinedNote = studentId ? `MSSV: ${studentId}${baseNote ? ' · ' + baseNote : ''}` : baseNote;

  const payload = {
    fullName: document.getElementById('c-name')?.value.trim() || '',
    phone: document.getElementById('c-phone')?.value.trim() || '',
    address: combinedAddress,
    note: combinedNote,
    rememberMe: document.getElementById('c-remember')?.checked || false,
    paymentMethod
  };

  try {
    const res = await fetch('/api/orders/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();

    if (data.success) {
      if (data.paymentMethod !== 'qr') {
        lastPlacedOrder = data.order || {
          id: data.orderId,
          totalAmount: Number(data.totalAmount) || 0,
          paymentMethod: 'cod',
          customerInfo: {
            fullName: payload.fullName,
            phone: payload.phone,
            address: payload.address,
            note: payload.note
          }
        };
      }
      if (typeof closeModal === 'function') {
        closeModal('cart-modal');
      }
      await updateCart();
      if (typeof checkAuthState === 'function') {
        await checkAuthState();
      }

      if (data.paymentMethod === 'qr') {
        if (typeof openQrPaymentModal === 'function') {
          openQrPaymentModal(
            data.order || {
              id: data.orderId,
              paymentRef: data.paymentRef,
              paymentExpiresAt: data.paymentExpiresAt,
              totalAmount: data.order?.totalAmount || 0,
              customerInfo: { phone: payload.phone }
            }
          );
        }
      } else {
        if (typeof showToast === 'function') {
          showToast('Đặt lịch hẹn GearHub thành công! Mã đơn: #' + data.orderId, 'success');
        }
        if (typeof openCustomerPortal === 'function' && document.getElementById('customer-portal-modal')) {
          openCustomerPortal('track', { orderId: data.orderId, phone: payload.phone });
        }
      }
    } else {
      if (typeof showToast === 'function') {
        showToast(data.message || 'Lỗi đặt lịch hẹn', 'error');
      }
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Lỗi kết nối máy chủ khi đặt lịch hẹn', 'error');
    }
  } finally {
    if (btn) btn.disabled = false;
    selectPaymentMethodUI(paymentMethod);
  }
}

// Auto-run updateCart on load if document is present
if (typeof document !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      updateCart();
    });
  } else {
    updateCart();
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    partitionCartTiers,
    selectPaymentMethodUI,
    renderCartDropdownFlyout,
    renderCartPage,
    clearFullCart,
    stripSlotPrefix,
    buildBookingAddress
  };
}
