// ============================================================================
// TECHSTORE ADMIN - Back-Office CRM, Order & Inventory Operations
// Dealt App Direction: framed-sheet (Framed sheet, light)
// ============================================================================

let revenueChartInstance = null;
let statusChartInstance = null;
let currentCustFilter = { search: '', tag: 'all' };
let currentOrderFilter = { search: '', status: 'all', fromDate: '', toDate: '' };
let currentProdFilter = { search: '', brand: 'all' };
let activeViewingOrder = null;

const formatMoney = (amount) =>
  new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount || 0);

// ==================== 1. KHỞI TẠO & XÁC THỰC ADMIN ====================

document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = await verifyAdminAuth();
  if (!isAuth) return;

  await refreshAllData();
});

async function verifyAdminAuth() {
  try {
    const res = await fetch('/api/admin/me');
    if (res.status === 404) {
      renderRevenueChart(['01/11', '02/11', '03/11', '04/11', '05/11', '06/11'], [28000000, 34000000, 29000000, 41000000, 32460000, 33990000]);
      renderStatusChart([1, 2, 3, 2, 5, 1]);
      return false;
    }
    const data = await res.json();
    if (!data.loggedIn && !data.success) {
      window.location.href = '/login?redirect=/admin';
      return false;
    }
    const adminInfo = data.data || data.admin || {};
    const name = adminInfo.fullName || adminInfo.name || adminInfo.username || 'Admin';
    const role = adminInfo.role === 'superadmin' ? 'Quản trị cấp cao' : adminInfo.role || 'Quản trị viên';

    const nameEl = document.getElementById('admin-name');
    const roleEl = document.getElementById('admin-role');
    const avEl = document.getElementById('admin-avatar');
    if (nameEl) nameEl.innerText = name;
    if (roleEl) roleEl.innerText = role;
    if (avEl) avEl.innerText = name.charAt(0).toUpperCase();
    return true;
  } catch {
    renderRevenueChart(['01/11', '02/11', '03/11', '04/11', '05/11', '06/11'], [28000000, 34000000, 29000000, 41000000, 32460000, 33990000]);
    renderStatusChart([1, 2, 3, 2, 5, 1]);
    return false;
  }
}

async function logoutAdmin() {
  await fetch('/api/admin/logout', { method: 'POST' });
  window.location.href = '/login';
}

function switchNavTab(tabName, event) {
  if (event) event.preventDefault();

  document.querySelectorAll('.sidebar-nav .nav-item').forEach((item) => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tabName);
  });

  document.querySelectorAll('.tab-content').forEach((sec) => {
    sec.classList.toggle('active', sec.id === `tab-${tabName}`);
  });

  const titles = {
    dashboard: 'Tổng quan hoạt động',
    customers: 'Khách hàng (CRM)',
    orders: 'Đơn đặt hàng',
    products: 'Kho sản phẩm',
    settings: 'Bảo mật & Cấu hình'
  };
  const headingEl = document.getElementById('page-heading');
  if (headingEl) headingEl.innerText = titles[tabName] || 'Quản trị';

  document.getElementById('admin-sidebar')?.classList.remove('open');

  if (tabName === 'dashboard') loadDashboard();
  if (tabName === 'customers') loadCustomers();
  if (tabName === 'orders') loadOrders();
  if (tabName === 'products') loadProducts();
}

async function refreshAllData() {
  showToast('Đang đồng bộ dữ liệu hệ thống...', 'info');
  await Promise.all([loadDashboard(), loadCustomers(), loadOrders(), loadProducts()]);
}

// ==================== 2. DASHBOARD & CHARTS ====================

async function loadDashboard() {
  try {
    const res = await fetch('/api/admin/stats');
    const json = await res.json();
    const data = json.data;
    if (!data) return;

    const k = data.kpi || data;
    const sc = data.statusCounts || data.charts?.statusCounts || {};
    const pendingCount = k.pendingOrders !== undefined ? k.pendingOrders : (sc.pending || 0) + (sc.awaiting_payment || 0);

    document.getElementById('kpi-revenue').innerText = formatMoney(k.totalRevenue);
    document.getElementById('kpi-orders').innerText = k.totalOrders || 0;
    document.getElementById('kpi-pending-sub').innerText = `${pendingCount} đơn chờ xử lý`;
    document.getElementById('kpi-customers').innerText = k.totalCustomers || 0;
    document.getElementById('kpi-products').innerText = k.totalProducts || 0;

    document.getElementById('badge-cust-count').innerText = k.totalCustomers || 0;
    document.getElementById('badge-order-count').innerText = pendingCount;
    document.getElementById('badge-prod-count').innerText = k.totalProducts || 0;

    const chartLabels = data.charts?.labels || data.charts?.revenue7Days?.labels || [];
    const chartValues = data.charts?.revenue || data.charts?.revenue7Days?.values || [];
    renderRevenueChart(chartLabels, chartValues);

    const statusDist = data.charts?.statusDistribution || [
      sc.awaiting_payment || 0,
      sc.pending || 0,
      sc.confirmed || 0,
      sc.shipping || 0,
      sc.completed || 0,
      sc.cancelled || 0
    ];
    renderStatusChart(statusDist);

    const recentOrdersBody = document.getElementById('dash-recent-orders');
    if (data.recentOrders && data.recentOrders.length > 0) {
      recentOrdersBody.innerHTML = data.recentOrders
        .map(
          (o) => `
        <tr>
          <td><strong class="tabular">${o.id}</strong></td>
          <td>
            <strong>${o.customerInfo?.fullName || 'Khách vãng lai'}</strong>
            <div class="tabular" style="font-size:13px; color:var(--muted);">${o.customerInfo?.phone || ''}</div>
          </td>
          <td class="num-col"><strong class="tabular">${formatMoney(o.totalAmount)}</strong></td>
          <td>${renderStatusBadge(o.status)}</td>
          <td class="tabular" style="font-size:13px; color:var(--muted);">${new Date(o.createdAt).toLocaleDateString('vi-VN')}</td>
        </tr>
      `
        )
        .join('');
    } else {
      recentOrdersBody.innerHTML =
        '<tr><td colspan="5" style="text-align:center; color:var(--muted); padding:1.25rem;">Chưa có đơn hàng nào</td></tr>';
    }

    const topCustBody = document.getElementById('dash-top-customers');
    if (data.topCustomers && data.topCustomers.length > 0) {
      topCustBody.innerHTML = data.topCustomers
        .map(
          (c) => `
        <tr>
          <td><strong>${c.fullName}</strong></td>
          <td class="num-col tabular">${c.phone || ''}</td>
          <td class="num-col tabular">${c.orderCount || 0}</td>
          <td class="num-col"><strong class="tabular">${formatMoney(c.totalSpent || 0)}</strong></td>
        </tr>
      `
        )
        .join('');
    } else {
      topCustBody.innerHTML =
        '<tr><td colspan="4" style="text-align:center; color:var(--muted); padding:1.25rem;">Chưa có dữ liệu khách hàng</td></tr>';
    }
  } catch (err) {
    console.error('Lỗi nạp dashboard:', err);
  }
}

function renderRevenueChart(labels, values) {
  const canvas = document.getElementById('revenueChart');
  const ctx = canvas?.getContext('2d');
  if (!ctx || typeof Chart === 'undefined') return;

  if (revenueChartInstance) revenueChartInstance.destroy();

  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels,
      datasets: [
        {
          label: 'Doanh thu (VNĐ)',
          data: values,
          borderColor: '#2f5d50',
          backgroundColor: 'rgba(47, 93, 80, 0.1)',
          borderWidth: 2,
          fill: true,
          tension: 0,
          pointBackgroundColor: '#2f5d50',
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      layout: {
        padding: { left: 8, right: 8, top: 6, bottom: 0 }
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (c) => ` Doanh thu: ${formatMoney(c.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: '#f0f0ec' },
          ticks: {
            color: '#575752',
            font: { family: 'Be Vietnam Pro', size: 12 },
            callback: (val) => (val >= 1000000 ? val / 1000000 + ' tr' : formatMoney(val))
          }
        },
        x: {
          grid: { display: false },
          ticks: {
            color: '#575752',
            font: { family: 'Be Vietnam Pro', size: 12 }
          }
        }
      }
    }
  });
}

function renderStatusChart(counts) {
  const canvas = document.getElementById('statusChart');
  const ctx = canvas?.getContext('2d');
  if (!ctx || typeof Chart === 'undefined') return;

  if (statusChartInstance) statusChartInstance.destroy();

  statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Chờ TT QR', 'Chờ xác nhận', 'Đã xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'],
      datasets: [
        {
          data: counts,
          backgroundColor: ['#b58d52', '#854d0e', '#2f5d50', '#4f776c', '#1b653e', '#b42318'],
          borderWidth: 2,
          borderColor: '#ffffff'
        }
      ]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'right',
          labels: {
            boxWidth: 10,
            color: '#141413',
            font: { family: 'Be Vietnam Pro', size: 12 }
          }
        }
      },
      cutout: '64%'
    }
  });
}

// ==================== 3. QUẢN LÝ KHÁCH HÀNG (CRM) ====================

let custSearchTimeout = null;
function renderCustomersTable() {
  clearTimeout(custSearchTimeout);
  custSearchTimeout = setTimeout(() => {
    currentCustFilter.search = document.getElementById('cust-search')?.value.trim() || '';
    loadCustomers();
  }, 220);
}

function filterCustomerTag(tag) {
  currentCustFilter.tag = tag;
  document.querySelectorAll('#cust-tag-filters .pill-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-tag') === tag);
  });
  loadCustomers();
}

async function loadCustomers() {
  const query = new URLSearchParams(currentCustFilter).toString();
  const res = await fetch(`/api/admin/customers?${query}`);
  const { data } = await res.json();
  const tbody = document.getElementById('customers-table-body');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--muted);">Không tìm thấy khách hàng nào phù hợp</td></tr>';
    return;
  }

  tbody.innerHTML = data
    .map(
      (c) => `
    <tr>
      <td>
        <strong>${c.fullName}</strong>
        <div style="font-size:12px; color:var(--muted);">${c.email || 'Chưa cập nhật email'}</div>
      </td>
      <td class="tabular"><strong>${c.phone}</strong></td>
      <td style="max-width:220px;" title="${c.address || ''}">${c.address || 'Chưa cung cấp'}</td>
      <td>${renderCustomerTag(c.tag)}</td>
      <td class="num-col">${c.orderCount || 0}</td>
      <td class="num-col"><strong>${formatMoney(c.totalSpent || 0)}</strong></td>
      <td style="font-size:12px; color:var(--muted); max-width:160px;">${c.adminNote || c.note || '-'}</td>
      <td>
        <button type="button" class="table-action-btn" onclick="viewCustomer('${c.id}')">Hồ sơ</button>
        <button type="button" class="table-action-btn" onclick="openEditCustomerModal('${c.id}')">Sửa</button>
        <button type="button" class="table-action-btn table-action-btn--danger" onclick="deleteCustomer('${c.id}')">Xóa</button>
      </td>
    </tr>
  `
    )
    .join('');
}

function openCustomerModal() {
  document.getElementById('form-customer-edit')?.reset();
  document.getElementById('edit-cust-id').value = '';
  const titleEl = document.getElementById('modal-cust-edit-title');
  if (titleEl) titleEl.innerText = 'Thêm khách hàng mới';
  openAdminModal('modal-customer-edit');
}

async function openEditCustomerModal(id) {
  const res = await fetch(`/api/admin/customers/${id}`);
  const { data } = await res.json();
  if (!data?.customer) return;

  const c = data.customer;
  document.getElementById('edit-cust-id').value = c.id;
  document.getElementById('edit-cust-name').value = c.fullName || '';
  document.getElementById('edit-cust-phone').value = c.phone || '';
  document.getElementById('edit-cust-email').value = c.email || '';
  document.getElementById('edit-cust-tag').value = c.tag || 'Mới';
  document.getElementById('edit-cust-address').value = c.address || '';
  document.getElementById('edit-cust-admin-note').value = c.adminNote || '';

  const titleEl = document.getElementById('modal-cust-edit-title');
  if (titleEl) titleEl.innerText = `Sửa hồ sơ: ${c.fullName}`;
  openAdminModal('modal-customer-edit');
}

async function handleSaveCustomer(e) {
  e.preventDefault();
  const id = document.getElementById('edit-cust-id').value;
  const payload = {
    fullName: document.getElementById('edit-cust-name').value.trim(),
    phone: document.getElementById('edit-cust-phone').value.trim(),
    email: document.getElementById('edit-cust-email').value.trim(),
    tag: document.getElementById('edit-cust-tag').value,
    address: document.getElementById('edit-cust-address').value.trim(),
    adminNote: document.getElementById('edit-cust-admin-note').value.trim()
  };

  const url = id ? `/api/admin/customers/${id}` : '/api/admin/customers';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const result = await res.json();
    if (result.success) {
      showToast(result.message || 'Lưu khách hàng thành công', 'success');
      closeAdminModal('modal-customer-edit');
      loadCustomers();
      loadDashboard();
    } else {
      showToast(result.message || 'Có lỗi xảy ra', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  }
}

async function viewCustomer(id) {
  const res = await fetch(`/api/admin/customers/${id}`);
  const { data } = await res.json();
  if (!data?.customer) return;

  const { customer, orders } = data;
  const card = document.getElementById('customer-profile-card');
  card.innerHTML = `
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:1rem; padding:1rem; background-color:var(--subtle); border:1px solid var(--border); border-radius:8px;">
      <div>
        <div style="display:flex; align-items:center; gap:0.5rem;">
          <strong style="font-size:16px;">${customer.fullName}</strong>
          ${renderCustomerTag(customer.tag)}
        </div>
        <div style="font-size:13px; color:var(--muted); margin-top:0.35rem;">
          <div>SĐT: <strong class="tabular" style="color:var(--ink);">${customer.phone}</strong></div>
          <div>Email: ${customer.email || 'Chưa cung cấp'}</div>
          <div>Địa chỉ: ${customer.address || 'Chưa cung cấp'}</div>
        </div>
      </div>
      <div style="text-align:right;">
        <span style="font-size:12px; color:var(--muted);">Tổng chi tiêu tích lũy</span>
        <div class="tabular" style="font-size:20px; font-weight:600; color:var(--accent);">${formatMoney(customer.totalSpent || 0)}</div>
        <span class="tabular" style="font-size:12px; color:var(--ok);">Đã đặt ${orders.length} đơn hàng</span>
      </div>
    </div>
  `;

  document.getElementById('cust-orders-count').innerText = orders.length;
  const oBody = document.getElementById('cust-orders-history-body');
  if (orders.length > 0) {
    oBody.innerHTML = orders
      .map(
        (o) => `
      <tr>
        <td class="tabular"><strong>${o.id}</strong></td>
        <td class="tabular" style="font-size:12px; color:var(--muted);">${new Date(o.createdAt).toLocaleString('vi-VN')}</td>
        <td>${(o.items || []).map((i) => `${i.name} (x${i.quantity})`).join(', ')}</td>
        <td class="num-col"><strong>${formatMoney(o.totalAmount)}</strong></td>
        <td>${renderStatusBadge(o.status)}</td>
      </tr>
    `
      )
      .join('');
  } else {
    oBody.innerHTML =
      '<tr><td colspan="5" style="text-align:center; padding:1rem; color:var(--muted);">Khách hàng chưa có đơn hàng nào</td></tr>';
  }

  openAdminModal('modal-customer-detail');
}

async function deleteCustomer(id) {
  if (confirm('Bạn có chắc chắn muốn xóa khách hàng này khỏi hệ thống?')) {
    const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Đã xóa khách hàng', 'success');
      loadCustomers();
      loadDashboard();
    } else {
      showToast(data.message || 'Không thể xóa khách hàng', 'error');
    }
  }
}

function exportCustomersCSV() {
  showToast('Đang xuất danh sách khách hàng CSV...', 'info');
  window.location.href = '/api/admin/customers/export';
}

// ==================== 4. QUẢN LÝ ĐƠN HÀNG ====================

let orderSearchTimeout = null;
function renderOrdersTable() {
  clearTimeout(orderSearchTimeout);
  orderSearchTimeout = setTimeout(() => {
    currentOrderFilter.search = document.getElementById('order-search')?.value.trim() || '';
    currentOrderFilter.fromDate = document.getElementById('order-date-from')?.value || '';
    currentOrderFilter.toDate = document.getElementById('order-date-to')?.value || '';
    loadOrders();
  }, 220);
}

function filterOrderStatus(status) {
  currentOrderFilter.status = status;
  document.querySelectorAll('#order-status-filters .pill-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-status') === status);
  });
  loadOrders();
}

function renderQuickNextActionBtn(order) {
  const map = {
    awaiting_payment: { next: 'confirmed', label: 'Xác nhận TT' },
    pending: { next: 'confirmed', label: 'Xác nhận' },
    confirmed: { next: 'shipping', label: 'Giao hàng' },
    shipping: { next: 'completed', label: 'Hoàn tất' }
  };
  const cfg = map[order.status];
  if (!cfg) return '';
  return `
    <button type="button" class="table-action-btn" style="background-color:var(--accent-soft); color:var(--accent); border-color:transparent;" onclick="quickAdvanceOrderStatus('${order.id}', '${cfg.next}')">
      ${cfg.label}
    </button>
  `;
}

async function quickAdvanceOrderStatus(id, nextStatus) {
  try {
    const res = await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: nextStatus, note: 'Admin chuyển nhanh trạng thái' })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Đã cập nhật đơn #${id}`, 'success');
      loadOrders();
      loadDashboard();
    } else {
      showToast(data.message || 'Lỗi cập nhật trạng thái', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  }
}

async function loadOrders() {
  const query = new URLSearchParams(currentOrderFilter).toString();
  const res = await fetch(`/api/admin/orders?${query}`);
  const { data } = await res.json();
  const tbody = document.getElementById('orders-table-body');
  if (!tbody) return;

  if (!data || data.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--muted);">Không có đơn hàng nào phù hợp bộ lọc</td></tr>';
    return;
  }

  tbody.innerHTML = data
    .map(
      (o) => `
    <tr>
      <td class="tabular"><strong>${o.id}</strong></td>
      <td class="tabular" style="font-size:12px; color:var(--muted);">${new Date(o.createdAt).toLocaleString('vi-VN')}</td>
      <td>
        <strong>${o.customerInfo?.fullName || 'Khách vãng lai'}</strong>
        <div class="tabular" style="font-size:12px; color:var(--muted);">${o.customerInfo?.phone || ''}</div>
      </td>
      <td style="max-width:230px;">
        ${(o.items || []).map((i) => `<div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${i.name} <strong>(x${i.quantity})</strong></div>`).join('')}
      </td>
      <td class="num-col"><strong>${formatMoney(o.totalAmount)}</strong></td>
      <td>
        <span class="status-badge ${o.paymentStatus === 'paid' ? 'status-paid' : o.paymentStatus === 'expired' ? 'status-expired' : o.paymentStatus === 'cancelled' ? 'status-cancelled' : 'status-pending'}">
          ${(o.paymentMethod || 'cod').toUpperCase()} · ${o.paymentStatus === 'paid' ? 'Đã TT' : o.paymentStatus === 'expired' ? 'Hết hạn' : o.paymentStatus === 'cancelled' ? 'Đã hủy TT' : 'Chưa TT'}
        </span>
      </td>
      <td>${renderStatusBadge(o.status)}</td>
      <td>
        ${renderQuickNextActionBtn(o)}
        <button type="button" class="table-action-btn" onclick="viewOrder('${o.id}')">Chi tiết</button>
        <button type="button" class="table-action-btn table-action-btn--danger" onclick="deleteOrder('${o.id}')">Xóa</button>
      </td>
    </tr>
  `
    )
    .join('');
}

async function viewOrder(id) {
  const res = await fetch(`/api/admin/orders/${id}`);
  const { data: order } = await res.json();
  if (!order) return;

  activeViewingOrder = order;
  document.getElementById('modal-order-id').innerText = '#' + order.id;
  document.getElementById('status-order-id').value = order.id;
  document.getElementById('select-order-status').value = order.status;
  document.getElementById('status-order-note').value = '';

  const content = document.getElementById('order-detail-content');
  content.innerHTML = `
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:1rem; margin-bottom:1rem;">
      <div style="background-color:var(--subtle); padding:0.9rem; border-radius:8px; border:1px solid var(--border);">
        <div style="font-size:12px; color:var(--muted); margin-bottom:0.3rem;">Khách hàng nhận máy</div>
        <strong>${order.customerInfo?.fullName || 'Khách'}</strong>
        <div class="tabular" style="font-size:13px; margin:2px 0;">SĐT: ${order.customerInfo?.phone || ''}</div>
        <div style="font-size:12px; color:var(--muted);">Đ/C: ${order.customerInfo?.address || ''}</div>
        ${order.note ? `<div style="font-size:12px; color:var(--warn); margin-top:4px;">Ghi chú: ${order.note}</div>` : ''}
      </div>
      <div style="background-color:var(--subtle); padding:0.9rem; border-radius:8px; border:1px solid var(--border); display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <div style="font-size:12px; color:var(--muted); margin-bottom:0.3rem;">Trạng thái &amp; Thanh toán</div>
          <div>${renderStatusBadge(order.status)}</div>
          <div style="font-size:12px; color:var(--muted); margin-top:0.35rem;">
            Phương thức: <strong>${(order.paymentMethod || 'cod').toUpperCase()}</strong> · TT: <strong>${order.paymentStatus || 'unpaid'}</strong>
          </div>
        </div>
        <div class="tabular" style="font-size:18px; font-weight:600; color:var(--accent); text-align:right;">
          Tổng: ${formatMoney(order.totalAmount)}
        </div>
      </div>
    </div>

    <div class="table-responsive" style="margin-bottom:1rem;">
      <table class="data-table">
        <thead>
          <tr>
            <th>Sản phẩm</th>
            <th class="num-col">Đơn giá</th>
            <th class="num-col">SL</th>
            <th class="num-col">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${(order.items || [])
            .map(
              (i) => `
            <tr>
              <td><strong>${i.name}</strong></td>
              <td class="num-col">${formatMoney(i.price)}</td>
              <td class="num-col">x${i.quantity}</td>
              <td class="num-col"><strong>${formatMoney(i.price * i.quantity)}</strong></td>
            </tr>
          `
            )
            .join('')}
        </tbody>
      </table>
    </div>

    ${
      Array.isArray(order.statusHistory) && order.statusHistory.length > 0
        ? `
      <div style="background-color:var(--subtle); padding:0.85rem 1rem; border-radius:8px; border:1px solid var(--border);">
        <div style="font-size:13px; font-weight:600; color:var(--ink); margin-bottom:0.45rem;">Lịch sử xử lý vận đơn</div>
        ${order.statusHistory
          .slice()
          .reverse()
          .map((h) => {
            const ts = h.timestamp || h.time;
            return `
          <div style="display:flex; justify-content:space-between; gap:0.75rem; font-size:13px; padding:0.25rem 0; border-bottom:1px solid var(--border);">
            <div><strong>${h.status}</strong> · <span style="color:var(--muted);">${h.note || h.title || ''}</span></div>
            <div class="tabular" style="color:var(--muted);">${ts ? new Date(ts).toLocaleString('vi-VN') : ''}</div>
          </div>
        `;
          })
          .join('')}
      </div>
    `
        : ''
    }
  `;

  openAdminModal('modal-order-detail');
}

async function handleUpdateOrderStatus(e) {
  e.preventDefault();
  const id = document.getElementById('status-order-id').value;
  const status = document.getElementById('select-order-status').value;
  const note = document.getElementById('status-order-note').value.trim();

  try {
    const res = await fetch(`/api/admin/orders/${id}/status`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status, note })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã cập nhật trạng thái đơn hàng', 'success');
      viewOrder(id);
      loadOrders();
      loadDashboard();
    } else {
      showToast(data.message || 'Lỗi cập nhật', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  }
}

async function deleteOrder(id) {
  if (confirm('Bạn có chắc muốn xóa đơn hàng này?')) {
    const res = await fetch(`/api/admin/orders/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Đã xóa đơn hàng', 'success');
      loadOrders();
      loadDashboard();
    } else {
      showToast(data.message || 'Lỗi xóa đơn hàng', 'error');
    }
  }
}

function exportOrdersCSV() {
  showToast('Đang xuất danh sách đơn hàng CSV...', 'info');
  window.location.href = '/api/admin/orders/export';
}

function printOrderInvoice() {
  if (!activeViewingOrder) return;
  const o = activeViewingOrder;
  const printArea = document.getElementById('invoice-print-area');
  const itemsRows = (o.items || [])
    .map(
      (i, idx) => `
      <tr>
        <td style="padding:8px; border-bottom:1px solid #ddd;">${idx + 1}</td>
        <td style="padding:8px; border-bottom:1px solid #ddd;"><strong>${i.name}</strong></td>
        <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${formatMoney(i.price)}</td>
        <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;">${i.quantity}</td>
        <td style="padding:8px; border-bottom:1px solid #ddd; text-align:right;"><strong>${formatMoney(i.price * i.quantity)}</strong></td>
      </tr>
    `
    )
    .join('');

  printArea.innerHTML = `
    <div style="max-width:800px; margin:0 auto; padding:24px; color:#000; font-family:'Be Vietnam Pro',sans-serif;">
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:12px; margin-bottom:20px;">
        <div>
          <h2 style="margin:0;">TECHSTORE ATELIER · PHIẾU BÁN HÀNG</h2>
          <p style="margin:4px 0 0; font-size:13px;">Hệ thống phân phối flagship chính hãng</p>
        </div>
        <div style="text-align:right;">
          <strong style="font-size:16px;">Mã đơn: #${o.id}</strong>
          <p style="margin:4px 0 0; font-size:13px;">Ngày: ${new Date(o.createdAt).toLocaleString('vi-VN')}</p>
        </div>
      </div>
      <div style="margin-bottom:16px; font-size:14px;">
        <div><strong>Khách hàng:</strong> ${o.customerInfo?.fullName || 'Khách'} · ${o.customerInfo?.phone || ''}</div>
        <div><strong>Địa chỉ:</strong> ${o.customerInfo?.address || ''}</div>
        <div><strong>Thanh toán:</strong> ${(o.paymentMethod || 'cod').toUpperCase()} (${o.paymentStatus || 'unpaid'})</div>
      </div>
      <table style="width:100%; border-collapse:collapse; font-size:13px; margin-bottom:16px;">
        <thead>
          <tr style="background:#f4f4f0;">
            <th style="padding:8px; text-align:left; border-bottom:1px solid #000;">#</th>
            <th style="padding:8px; text-align:left; border-bottom:1px solid #000;">Sản phẩm</th>
            <th style="padding:8px; text-align:right; border-bottom:1px solid #000;">Đơn giá</th>
            <th style="padding:8px; text-align:right; border-bottom:1px solid #000;">SL</th>
            <th style="padding:8px; text-align:right; border-bottom:1px solid #000;">Thành tiền</th>
          </tr>
        </thead>
        <tbody>
          ${itemsRows}
        </tbody>
      </table>
      <div style="text-align:right; font-size:18px; margin-top:20px;">
        <strong>TỔNG THANH TOÁN: ${formatMoney(o.totalAmount)}</strong>
      </div>
    </div>
  `;
  window.print();
}

// ==================== 5. QUẢN LÝ SẢN PHẨM ====================

let prodSearchTimeout = null;
function renderProductsTable() {
  clearTimeout(prodSearchTimeout);
  prodSearchTimeout = setTimeout(() => {
    currentProdFilter.search = document.getElementById('prod-search')?.value.trim() || '';
    loadProducts();
  }, 220);
}

const ADMIN_CATEGORY_DEFAULTS = {
  service: { label: 'Dịch vụ vệ sinh', brand: 'GearHub Service' },
  rental: { label: 'Thuê thiết bị', brand: 'GearHub Rental' },
  accessory: { label: 'Phụ kiện & Kit', brand: 'GearHub Accessory' }
};

function syncAdminCategoryBrand(catKey) {
  const def = ADMIN_CATEGORY_DEFAULTS[catKey];
  const brandSelect = document.getElementById('edit-p-brand');
  if (def && brandSelect) {
    brandSelect.value = def.brand;
  }
}

function getAdminProductCategoryInfo(p) {
  const cat =
    typeof window !== 'undefined' && window.CatalogFilter && window.CatalogFilter.inferCategory
      ? window.CatalogFilter.inferCategory(p)
      : String(p.category || 'other').toLowerCase();
  const def = ADMIN_CATEGORY_DEFAULTS[cat];
  return {
    key: cat,
    label: p.categoryLabel || def?.label || p.brand || 'Khác'
  };
}

function filterProductBrand(brand) {
  currentProdFilter.brand = brand;
  document.querySelectorAll('#prod-brand-filters .pill-btn').forEach((btn) => {
    btn.classList.toggle('active', btn.getAttribute('data-brand') === brand);
  });
  loadProducts();
}

async function loadProducts() {
  const brand = currentProdFilter.brand || 'all';
  const res = await fetch(`/api/products?brand=${brand}`);
  const { data } = await res.json();
  const tbody = document.getElementById('products-table-body');
  if (!tbody) return;

  let list = data || [];
  if (currentProdFilter.search) {
    if (typeof window !== 'undefined' && window.CatalogFilter) {
      list = window.CatalogFilter.filterProducts(list, { search: currentProdFilter.search });
    } else {
      const q = currentProdFilter.search.toLowerCase();
      list = list.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          String(p.categoryLabel || p.brand || '').toLowerCase().includes(q) ||
          String(p.specs || '').toLowerCase().includes(q)
      );
    }
  }

  if (list.length === 0) {
    tbody.innerHTML =
      '<tr><td colspan="8" style="text-align:center; padding:1.5rem; color:var(--muted);">Không có sản phẩm nào phù hợp</td></tr>';
    return;
  }

  tbody.innerHTML = list
    .map((p) => {
      const catInfo = getAdminProductCategoryInfo(p);
      return `
    <tr>
      <td class="tabular" style="color:var(--muted);">#${p.id}</td>
      <td>
        <img src="${p.image}" alt="${p.name}" loading="lazy" style="width:40px; height:40px; object-fit:contain; background-color:var(--subtle); border-radius:4px; padding:2px;">
      </td>
      <td>
        <strong>${p.name}</strong>
        ${p.duration || p.unit ? `<div style="font-size:12px; color:var(--muted);">${[p.duration, p.unit ? `Đơn vị: ${p.unit}` : ''].filter(Boolean).join(' · ')}</div>` : ''}
        ${p.aiEnrichedAt ? '<span class="status-badge status-confirmed" style="margin-left:6px;">AI</span>' : ''}
      </td>
      <td><span class="status-badge status-confirmed">${catInfo.label}</span></td>
      <td style="font-size:13px; color:var(--muted); max-width:240px;">${p.specs || ''}</td>
      <td class="num-col"><strong>${formatMoney(p.price)}</strong></td>
      <td class="num-col" style="color:var(--muted); text-decoration:line-through;">${p.oldPrice && p.oldPrice > p.price ? formatMoney(p.oldPrice) : '-'}</td>
      <td>
        <button type="button" class="table-action-btn" onclick="enrichProductWithAI('${p.id}', this)" title="Chuẩn hóa thông số bằng AI">AI</button>
        <button type="button" class="table-action-btn" onclick="openEditProductModal('${p.id}')">Sửa</button>
        <button type="button" class="table-action-btn table-action-btn--danger" onclick="deleteProduct('${p.id}')">Xóa</button>
      </td>
    </tr>
  `;
    })
    .join('');
}

function handleCrawlSourceChange() {
  const source = document.getElementById('crawl-source')?.value || 'tiki';
  const kwInput = document.getElementById('crawl-keyword');
  if (kwInput) {
    kwInput.placeholder =
      source === 'dummy'
        ? 'DummyJSON tự động lấy danh mục smartphones quốc tế'
        : 'VD: Ultra, Pro Max, Pixel 9...';
  }
}

function openCrawlModal() {
  document.getElementById('form-crawl-products')?.reset();
  handleCrawlSourceChange();
  const statusEl = document.getElementById('crawl-loading-status');
  if (statusEl) statusEl.style.display = 'none';
  const btn = document.getElementById('btn-submit-crawl');
  if (btn) btn.disabled = false;
  openAdminModal('modal-crawl-products');
}

async function handleCrawlProducts(e) {
  e.preventDefault();
  const source = document.getElementById('crawl-source').value;
  const brand = document.getElementById('crawl-brand').value;
  const keyword = document.getElementById('crawl-keyword').value.trim();
  const limit = parseInt(document.getElementById('crawl-limit').value, 10) || 10;
  const skipExisting = document.getElementById('crawl-skip-existing').checked;

  const statusBox = document.getElementById('crawl-loading-status');
  const submitBtn = document.getElementById('btn-submit-crawl');
  const statusText = document.getElementById('crawl-status-text');

  if (statusBox) statusBox.style.display = 'block';
  if (submitBtn) submitBtn.disabled = true;
  if (statusText) statusText.innerText = `Đang đồng bộ từ nguồn ${source.toUpperCase()}...`;

  try {
    const res = await fetch('/api/admin/products/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, brand, keyword, limit, skipExisting })
    });

    const result = await res.json();
    if (result.success) {
      const d = result.data || {};
      showToast(result.message || `Đã đồng bộ ${d.savedCount || 0} sản phẩm mới`, 'success');
      closeAdminModal('modal-crawl-products');
      loadProducts();
      loadDashboard();
    } else {
      showToast(result.message || 'Lỗi khi đồng bộ dữ liệu', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ khi đồng bộ sản phẩm', 'error');
  } finally {
    if (statusBox) statusBox.style.display = 'none';
    if (submitBtn) submitBtn.disabled = false;
  }
}

function openProductModal() {
  document.getElementById('form-product-edit')?.reset();
  document.getElementById('edit-prod-id').value = '';
  const catEl = document.getElementById('edit-p-category');
  if (catEl) {
    catEl.value = 'service';
    syncAdminCategoryBrand('service');
  }
  const titleEl = document.getElementById('modal-prod-title');
  if (titleEl) titleEl.innerText = 'Thêm dịch vụ / thiết bị mới';
  openAdminModal('modal-product-edit');
}

async function openEditProductModal(id) {
  try {
    const res = await fetch(`/api/products/${id}`);
    if (!res.ok) {
      showToast('Không tìm thấy thông tin sản phẩm', 'error');
      return;
    }
    const { data: p } = await res.json();
    if (!p) return;

    document.getElementById('edit-prod-id').value = p.id;
    document.getElementById('edit-p-name').value = p.name || '';

    const catInfo = getAdminProductCategoryInfo(p);
    const catSelect = document.getElementById('edit-p-category');
    if (catSelect && ADMIN_CATEGORY_DEFAULTS[catInfo.key]) {
      catSelect.value = catInfo.key;
    }

    const brandSelect = document.getElementById('edit-p-brand');
    let brandFound = false;
    for (let i = 0; i < brandSelect.options.length; i++) {
      if (brandSelect.options[i].value.toLowerCase() === (p.brand || '').toLowerCase()) {
        brandSelect.selectedIndex = i;
        brandFound = true;
        break;
      }
    }
    if (!brandFound && p.brand) {
      brandSelect.add(new Option(p.brand, p.brand, true, true));
    }

    const setField = (elemId, val) => {
      const el = document.getElementById(elemId);
      if (el) el.value = val || '';
    };
    setField('edit-p-badge', p.badge);
    setField('edit-p-unit', p.unit);
    setField('edit-p-duration', p.duration);
    setField('edit-p-description', p.description);

    document.getElementById('edit-p-price').value = p.price || 0;
    document.getElementById('edit-p-oldprice').value = p.oldPrice || p.price || 0;
    document.getElementById('edit-p-specs').value = p.specs || '';
    document.getElementById('edit-p-image').value = p.image || '';

    const titleEl = document.getElementById('modal-prod-title');
    if (titleEl) titleEl.innerText = `Sửa sản phẩm: ${p.name}`;
    openAdminModal('modal-product-edit');
  } catch (err) {
    showToast('Lỗi khi tải thông tin sản phẩm: ' + err.message, 'error');
  }
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('edit-prod-id').value;
  const category = document.getElementById('edit-p-category')?.value || 'service';
  const catDef = ADMIN_CATEGORY_DEFAULTS[category] || {};
  const payload = {
    name: document.getElementById('edit-p-name').value.trim(),
    category,
    categoryLabel: catDef.label || '',
    brand: document.getElementById('edit-p-brand').value,
    badge: document.getElementById('edit-p-badge')?.value.trim() || '',
    unit: document.getElementById('edit-p-unit')?.value.trim() || '',
    duration: document.getElementById('edit-p-duration')?.value.trim() || '',
    description: document.getElementById('edit-p-description')?.value.trim() || '',
    price: parseInt(document.getElementById('edit-p-price').value, 10) || 0,
    oldPrice: parseInt(document.getElementById('edit-p-oldprice').value, 10) || 0,
    specs: document.getElementById('edit-p-specs').value.trim(),
    image: document.getElementById('edit-p-image').value.trim()
  };

  const url = id ? `/api/admin/products/${id}` : '/api/admin/products';
  const method = id ? 'PUT' : 'POST';

  try {
    const res = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (data.success) {
      showToast(data.message || 'Lưu sản phẩm thành công', 'success');
      closeAdminModal('modal-product-edit');
      loadProducts();
      loadDashboard();
    } else {
      showToast(data.message || 'Lỗi lưu sản phẩm', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ: ' + err.message, 'error');
  }
}

async function deleteProduct(id) {
  if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi kho hàng?')) {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Đã xóa sản phẩm', 'success');
      loadProducts();
      loadDashboard();
    } else {
      showToast(data.message || 'Lỗi xóa sản phẩm', 'error');
    }
  }
}

// ==================== 6. CÀI ĐẶT & MẬT KHẨU ====================

async function handleChangeAdminPassword(e) {
  e.preventDefault();
  const oldPassword = document.getElementById('old-pass').value;
  const newPassword = document.getElementById('new-pass').value;
  const confirmPassword = document.getElementById('confirm-new-pass').value;

  if (newPassword !== confirmPassword) {
    showToast('Xác nhận mật khẩu mới không khớp', 'error');
    return;
  }

  try {
    const res = await fetch('/api/admin/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ oldPassword, newPassword })
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đổi mật khẩu thành công', 'success');
      document.getElementById('change-pass-form')?.reset();
    } else {
      showToast(data.message || 'Không thể đổi mật khẩu', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  }
}

// ==================== 7. HELPER BADGES & MODALS ====================

function renderCustomerTag(tag) {
  if (tag === 'VIP') {
    return '<span class="tier-badge tier-vip">VIP</span>';
  }
  if (tag === 'Thân thiết') {
    return '<span class="tier-badge tier-loyal">Thân thiết</span>';
  }
  return '<span class="tier-badge tier-new">Mới</span>';
}

function renderStatusBadge(status) {
  const map = {
    awaiting_payment: '<span class="status-badge status-awaiting_payment">Chờ TT QR</span>',
    pending: '<span class="status-badge status-pending">Chờ xác nhận</span>',
    confirmed: '<span class="status-badge status-confirmed">Đã xác nhận</span>',
    shipping: '<span class="status-badge status-shipping">Đang giao</span>',
    completed: '<span class="status-badge status-completed">Hoàn thành</span>',
    cancelled: '<span class="status-badge status-cancelled">Đã hủy</span>'
  };
  return map[status] || `<span class="status-badge">${status}</span>`;
}

function openAdminModal(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  el.classList.remove('hidden');
  el.style.display = 'flex';
}

function closeAdminModal(modalId) {
  const el = document.getElementById(modalId);
  if (!el) return;
  el.classList.add('hidden');
  el.style.display = 'none';
}

function showToast(message, type = 'success') {
  const container = document.getElementById('toast-container');
  if (!container) return;

  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerText = message;

  container.appendChild(toast);
  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 240);
  }, 3200);
}

// ==================== 8. TỰ ĐỘNG HOÁ GEMINI AI TRONG ADMIN ====================

async function enrichProductWithAI(productId, btn) {
  if (btn) {
    btn.disabled = true;
    btn.innerText = '...';
  }

  try {
    const res = await fetch(`/api/admin/products/${productId}/enrich`, {
      method: 'POST'
    });
    const data = await res.json();
    if (data.success) {
      showToast('Đã làm giàu thông số bằng AI', 'success');
      loadProducts();
    } else {
      showToast(data.message || 'Lỗi khi làm giàu dữ liệu', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'AI';
    }
  }
}

async function handleSelfHealCatalog() {
  const btn = document.getElementById('btn-self-heal');
  if (btn) {
    btn.disabled = true;
    btn.innerText = 'Đang chuẩn hóa...';
  }

  try {
    const res = await fetch('/api/admin/products/self-heal', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ limit: 15 })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`Hoàn tất: ${data.message}`, 'success');
      loadProducts();
    } else {
      showToast(data.message || 'Lỗi chuẩn hóa sản phẩm', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerText = 'Chuẩn hóa ảnh & thông số';
    }
  }
}


// ==================== THEME MANAGEMENT & REAL-TIME SYNC (UI/UX Pro Max) ====================
function getStoredTheme() {
  const saved = localStorage.getItem('techstore_theme');
  if (saved === 'dark' || saved === 'light') return saved;
  return (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) ? 'dark' : 'light';
}

function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  localStorage.setItem('techstore_theme', theme);
  updateThemeUI(theme);
}

function toggleTheme() {
  const current = document.documentElement.getAttribute('data-theme') || getStoredTheme();
  const next = current === 'dark' ? 'light' : 'dark';
  setTheme(next);
}

function updateThemeUI(theme) {
  const labels = document.querySelectorAll('.theme-name-text, .theme-label-text');
  labels.forEach(el => {
    el.textContent = theme === 'dark' ? 'Tối' : 'Sáng';
  });
  const mobileLabel = document.getElementById('theme-status-mobile');
  if (mobileLabel) {
    mobileLabel.textContent = theme === 'dark' ? 'Tối' : 'Sáng';
  }
}

window.addEventListener('storage', function(e) {
  if (e.key === 'techstore_theme' && e.newValue) {
    document.documentElement.setAttribute('data-theme', e.newValue);
    updateThemeUI(e.newValue);
  }
});

// Run UI sync on DOM load
document.addEventListener('DOMContentLoaded', function() {
  const t = getStoredTheme();
  updateThemeUI(t);
});
