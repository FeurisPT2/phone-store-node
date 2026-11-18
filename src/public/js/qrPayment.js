// ============================================================================
// GEARHUB VIETQR PAYMENT SANDBOX & 3S POLLING
// ============================================================================

let activeQrSession = {
  orderId: null,
  paymentRef: null,
  expiresAt: null,
  pollTimer: null,
  countdownTimer: null,
  phone: ''
};

function clearQrSessionTimers() {
  if (activeQrSession.pollTimer) {
    clearInterval(activeQrSession.pollTimer);
    activeQrSession.pollTimer = null;
  }
  if (activeQrSession.countdownTimer) {
    clearInterval(activeQrSession.countdownTimer);
    activeQrSession.countdownTimer = null;
  }
}

function openQrPaymentModal(order) {
  clearQrSessionTimers();
  activeQrSession.orderId = order.id;
  activeQrSession.paymentRef = order.paymentRef || `PAY_${order.id}`;
  activeQrSession.expiresAt = order.paymentExpiresAt;
  activeQrSession.phone = order.customerInfo?.phone || (typeof document !== 'undefined' ? document.getElementById('c-phone')?.value : '') || '';

  if (typeof document !== 'undefined') {
    const orderIdEl = document.getElementById('qr-order-id-text');
    const refEl = document.getElementById('qr-ref-text');
    const amountEl = document.getElementById('qr-amount-display');
    const imgEl = document.getElementById('qr-code-img');
    const banner = document.getElementById('qr-status-banner');

    if (orderIdEl) orderIdEl.innerText = '#' + order.id;
    if (refEl) refEl.innerText = activeQrSession.paymentRef;
    if (amountEl) amountEl.innerText = typeof formatMoney === 'function' ? formatMoney(order.totalAmount || 0) : order.totalAmount + ' ₫';

    const qrData = encodeURIComponent(
      `GEARHUB|${order.id}|${activeQrSession.paymentRef}|${order.totalAmount || 0}`
    );
    if (imgEl) imgEl.src = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${qrData}`;

    if (banner) {
      banner.className = 'qr-status-banner';
      banner.innerHTML =
        '<span id="qr-status-text">Đang chờ quét mã VietQR thanh toán (tự động kiểm tra mỗi 3 giây)...</span>';
    }
  }

  if (typeof openModal === 'function') {
    openModal('qr-payment-modal');
  }

  updateQrCountdownDisplay();
  activeQrSession.countdownTimer = setInterval(updateQrCountdownDisplay, 1000);
  activeQrSession.pollTimer = setInterval(() => pollQrPaymentStatus(order.id), 3000);
}

function updateQrCountdownDisplay() {
  if (typeof document === 'undefined') return;
  const timerEl = document.getElementById('qr-countdown-timer');
  if (!timerEl || !activeQrSession.expiresAt) return;
  const remainingMs = Date.parse(activeQrSession.expiresAt) - Date.now();
  if (remainingMs <= 0) {
    timerEl.innerText = '00:00 (Hết hạn)';
    clearQrSessionTimers();
    pollQrPaymentStatus(activeQrSession.orderId);
    return;
  }
  const mins = Math.floor(remainingMs / 60000);
  const secs = Math.floor((remainingMs % 60000) / 1000);
  const fmtTwo = typeof twoDigits === 'function' ? twoDigits : (n) => (n < 10 ? '0' + n : String(n));
  timerEl.innerText = `${fmtTwo(mins)}:${fmtTwo(secs)}`;
}

async function pollQrPaymentStatus(orderId) {
  if (!orderId) return;
  try {
    const res = await fetch(`/api/orders/${orderId}/payment-status`);
    const data = await res.json();
    if (!data.success) return;

    const banner = typeof document !== 'undefined' ? document.getElementById('qr-status-banner') : null;
    if (data.paymentStatus === 'paid') {
      clearQrSessionTimers();
      if (banner) {
        banner.className = 'qr-status-banner paid';
        banner.innerHTML =
          '<span id="qr-status-text">Thanh toán VietQR thành công. Đơn hàng đã được xác nhận!</span>';
      }
      if (typeof showToast === 'function') {
        showToast('Thanh toán VietQR thành công cho đơn #' + orderId, 'success');
      }
      setTimeout(() => {
        closeQrPaymentModal();
        if (typeof openCustomerPortal === 'function') {
          openCustomerPortal('track', { orderId, phone: activeQrSession.phone });
        }
      }, 900);
    } else if (data.paymentStatus === 'expired' || data.status === 'cancelled') {
      clearQrSessionTimers();
      if (banner) {
        banner.className = 'qr-status-banner expired';
        banner.innerHTML =
          '<span id="qr-status-text">Đơn hàng đã hết hạn thanh toán VietQR hoặc đã bị hủy.</span>';
      }
      if (typeof showToast === 'function') {
        showToast('Đơn hàng QR đã hết hạn hoặc bị hủy', 'error');
      }
    }
  } catch {}
}

async function simulateQrWebhook(action = 'confirm') {
  if (!activeQrSession.orderId) return;
  const btn = typeof document !== 'undefined' ? document.getElementById('btn-simulate-qr-confirm') : null;
  if (btn) btn.disabled = true;

  try {
    const res = await fetch('/api/payments/sandbox-webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        orderId: activeQrSession.orderId,
        paymentRef: activeQrSession.paymentRef,
        action
      })
    });
    const data = await res.json();
    if (data.success) {
      await pollQrPaymentStatus(activeQrSession.orderId);
      if (action === 'cancel') {
        closeQrPaymentModal();
      }
    } else {
      if (typeof showToast === 'function') {
        showToast(data.message || 'Lỗi xử lý thanh toán VietQR', 'error');
      }
    }
  } catch {
    if (typeof showToast === 'function') {
      showToast('Lỗi kết nối webhook sandbox', 'error');
    }
  } finally {
    if (btn) btn.disabled = false;
  }
}

function closeQrPaymentModal() {
  clearQrSessionTimers();
  if (typeof closeModal === 'function') {
    closeModal('qr-payment-modal');
  }
}

function openQrModalByOrderMeta(id, paymentRef, paymentExpiresAt, totalAmount, phone) {
  openQrPaymentModal({
    id,
    paymentRef,
    paymentExpiresAt,
    totalAmount,
    customerInfo: { phone }
  });
}
