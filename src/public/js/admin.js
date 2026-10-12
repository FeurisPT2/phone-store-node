// ==================== TECHSTORE ADMIN CONTROLLER ====================

const formatMoney = (n) => new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(Number(n) || 0);

let revenueChartInstance = null;
let statusChartInstance = null;

let currentCustFilter = { search: '', tag: 'all' };
let currentOrderFilter = { search: '', status: 'all' };
let currentProdFilter = { search: '', brand: 'all' };
let activeViewingOrder = null;

// ==================== 1. KHỞI TẠO & ĐIỀU HƯỚNG ====================

document.addEventListener('DOMContentLoaded', async () => {
  const isAuth = await checkAdminAuth();
  if (!isAuth) return;

  await loadDashboard();
  setupEventListeners();
});

function setupEventListeners() {
  // Đổi mật khẩu
  const changePassForm = document.getElementById('change-pass-form');
  if (changePassForm) {
    changePassForm.addEventListener('submit', handleChangePassword);
  }

  // Form thêm / sửa khách hàng
  const custForm = document.getElementById('form-customer-edit');
  if (custForm) {
    custForm.addEventListener('submit', handleSaveCustomer);
  }

  // Form cập nhật trạng thái đơn
  const statusForm = document.getElementById('form-update-order-status');
  if (statusForm) {
    statusForm.addEventListener('submit', handleUpdateOrderStatus);
  }

  // Form thêm / sửa sản phẩm
  const prodForm = document.getElementById('form-product-edit');
  if (prodForm) {
    prodForm.addEventListener('submit', handleSaveProduct);
  }

  // Form cào sản phẩm tự động
  const crawlForm = document.getElementById('form-crawl-products');
  if (crawlForm) {
    crawlForm.addEventListener('submit', handleCrawlSubmit);
  }
}

async function checkAdminAuth() {
  try {
    const res = await fetch('/api/admin/me');
    if (!res.ok) {
      window.location.href = '/login.html';
      return false;
    }
    const data = await res.json();
    if (data.success && data.admin) {
      document.getElementById('admin-name').innerText = data.admin.fullName || data.admin.username;
      document.getElementById('admin-role').innerText = data.admin.role || 'Super Admin';
      const initials = (data.admin.fullName || data.admin.username).substring(0, 2).toUpperCase();
      document.getElementById('admin-avatar').innerText = initials;
      return true;
    }
    window.location.href = '/login.html';
    return false;
  } catch {
    window.location.href = '/login.html';
    return false;
  }
}

async function logoutAdmin() {
  if (confirm('Bạn có chắc chắn muốn đăng xuất khỏi trang Quản trị?')) {
    await fetch('/api/admin/logout', { method: 'POST' });
    showToast('Đã đăng xuất thành công!', 'info');
    setTimeout(() => {
      window.location.href = '/login.html';
    }, 400);
  }
}

function switchNavTab(tabId) {
  document.querySelectorAll('.sidebar-nav .nav-item').forEach(item => {
    item.classList.toggle('active', item.getAttribute('data-tab') === tabId);
  });

  document.querySelectorAll('.tab-content').forEach(panel => {
    panel.style.display = panel.id === tabId ? 'block' : 'none';
  });

  const headingMap = {
    'tab-dashboard': 'Tổng Quan Hoạt Động',
    'tab-customers': 'Quản Trị Dữ Liệu Khách Hàng (CRM)',
    'tab-orders': 'Quản Lý Đơn Đặt Hàng',
    'tab-products': 'Quản Lý Danh Mục Điện Thoại',
    'tab-settings': 'Cài Đặt Hệ Thống & Bảo Mật'
  };
  document.getElementById('page-heading').innerText = headingMap[tabId] || 'Quản Trị TechStore';

  if (tabId === 'tab-dashboard') loadDashboard();
  if (tabId === 'tab-customers') loadCustomers();
  if (tabId === 'tab-orders') loadOrders();
  if (tabId === 'tab-products') loadProducts();
}

// ==================== 2. TỔNG QUAN & CHARTS ====================

async function loadDashboard() {
  try {
    const res = await fetch('/api/admin/stats');
    const { data } = await res.json();
    if (!data) return;

    // KPI Cards
    document.getElementById('kpi-revenue').innerText = formatMoney(data.totalRevenue);
    document.getElementById('kpi-orders').innerText = data.totalOrders;
    document.getElementById('kpi-customers').innerText = data.totalCustomers;
    document.getElementById('kpi-products').innerText = data.totalProducts;

    const pendingCount = data.statusCounts?.pending || 0;
    document.getElementById('kpi-pending-sub').innerHTML = `<i class="fa-solid fa-clock"></i> ${pendingCount} đơn chờ xác nhận`;

    // Sidebar Badges
    document.getElementById('badge-cust-count').innerText = data.totalCustomers;
    document.getElementById('badge-order-count').innerText = pendingCount > 0 ? pendingCount : data.totalOrders;
    document.getElementById('badge-prod-count').innerText = data.totalProducts;

    // Render Charts
    renderRevenueChart(data.charts.labels, data.charts.revenue);
    renderStatusChart(data.charts.statusDistribution);

    // Recent Orders Table
    const recentOrdersBody = document.getElementById('dash-recent-orders');
    if (data.recentOrders && data.recentOrders.length > 0) {
      recentOrdersBody.innerHTML = data.recentOrders.map(o => `
        <tr>
          <td><code style="font-weight:700; color:#4f46e5;">${o.id}</code></td>
          <td>
            <strong>${o.customerInfo?.fullName || 'Khách vãng lai'}</strong><br>
            <small style="color:#64748b;">${o.customerInfo?.phone || ''}</small>
          </td>
          <td><strong style="color:#10b981;">${formatMoney(o.totalAmount)}</strong></td>
          <td>${renderStatusBadge(o.status)}</td>
          <td>
            <button class="btn-icon view" title="Xem chi tiết" onclick="viewOrder('${o.id}')">
              <i class="fa-solid fa-eye"></i>
            </button>
          </td>
        </tr>
      `).join('');
    } else {
      recentOrdersBody.innerHTML = '<tr><td colspan="5" style="text-align:center; color:#94a3b8; padding:20px;">Chưa có đơn hàng nào</td></tr>';
    }

    // Top VIP Customers Table
    const topCustBody = document.getElementById('dash-top-customers');
    if (data.topCustomers && data.topCustomers.length > 0) {
      topCustBody.innerHTML = data.topCustomers.map(c => `
        <tr>
          <td>
            <strong>${c.fullName}</strong><br>
            <small style="color:#64748b;">${c.phone}</small>
          </td>
          <td>${renderCustomerTag(c.tag)}</td>
          <td><strong style="color:#0284c7;">${formatMoney(c.totalSpent || 0)}</strong></td>
        </tr>
      `).join('');
    } else {
      topCustBody.innerHTML = '<tr><td colspan="3" style="text-align:center; color:#94a3b8; padding:20px;">Chưa có dữ liệu khách hàng</td></tr>';
    }
  } catch (err) {
    console.error('Lỗi nạp dashboard:', err);
  }
}

function renderRevenueChart(labels, values) {
  const ctx = document.getElementById('revenueChart')?.getContext('2d');
  if (!ctx) return;

  if (revenueChartInstance) revenueChartInstance.destroy();

  const gradient = ctx.createLinearGradient(0, 0, 0, 260);
  gradient.addColorStop(0, 'rgba(79, 70, 229, 0.4)');
  gradient.addColorStop(1, 'rgba(79, 70, 229, 0.0)');

  revenueChartInstance = new Chart(ctx, {
    type: 'line',
    data: {
      labels: labels,
      datasets: [{
        label: 'Doanh thu (VNĐ)',
        data: values,
        borderColor: '#4f46e5',
        backgroundColor: gradient,
        borderWidth: 3,
        fill: true,
        tension: 0.35,
        pointBackgroundColor: '#4f46e5',
        pointRadius: 4,
        pointHoverRadius: 6
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: { display: false },
        tooltip: {
          callbacks: {
            label: (ctx) => ` Doanh thu: ${formatMoney(ctx.raw)}`
          }
        }
      },
      scales: {
        y: {
          beginAtZero: true,
          grid: { color: 'rgba(226, 232, 240, 0.6)' },
          ticks: {
            callback: (val) => val >= 1000000 ? (val / 1000000) + ' tr' : formatMoney(val)
          }
        },
        x: {
          grid: { display: false }
        }
      }
    }
  });
}

function renderStatusChart(counts) {
  const ctx = document.getElementById('statusChart')?.getContext('2d');
  if (!ctx) return;

  if (statusChartInstance) statusChartInstance.destroy();

  statusChartInstance = new Chart(ctx, {
    type: 'doughnut',
    data: {
      labels: ['Chờ xác nhận', 'Đang giao', 'Hoàn thành', 'Đã hủy'],
      datasets: [{
        data: counts,
        backgroundColor: ['#f59e0b', '#0284c7', '#10b981', '#ef4444'],
        borderWidth: 2,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          position: 'bottom',
          labels: { boxWidth: 12, font: { size: 12 } }
        }
      },
      cutout: '68%'
    }
  });
}

// ==================== 3. QUẢN LÝ KHÁCH HÀNG (CRM) ====================

let custSearchTimeout = null;
function handleCustomerSearch() {
  clearTimeout(custSearchTimeout);
  custSearchTimeout = setTimeout(() => {
    currentCustFilter.search = document.getElementById('cust-search').value.trim();
    loadCustomers();
  }, 300);
}

function filterCustomerTag(tag) {
  currentCustFilter.tag = tag;
  document.querySelectorAll('#cust-tag-filters .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-tag') === tag);
  });
  loadCustomers();
}

async function loadCustomers() {
  const query = new URLSearchParams(currentCustFilter).toString();
  const res = await fetch(`/api/admin/customers?${query}`);
  const { data } = await res.json();
  const tbody = document.getElementById('customers-table-body');

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center; padding:30px; color:#94a3b8;">Không tìm thấy khách hàng nào phù hợp</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(c => `
    <tr>
      <td>
        <div style="display:flex; align-items:center; gap:12px;">
          <div style="width:36px; height:36px; border-radius:50%; background:#e0e7ff; color:#4f46e5; display:flex; align-items:center; justify-content:center; font-weight:800; font-size:14px;">
            ${(c.fullName || 'K').charAt(0).toUpperCase()}
          </div>
          <div>
            <strong>${c.fullName}</strong><br>
            <small style="color:#64748b;">${c.email || 'Chưa có email'}</small>
          </div>
        </div>
      </td>
      <td><span style="font-weight:700; color:#2563eb;">${c.phone}</span></td>
      <td style="max-width:220px; font-size:13px;" title="${c.address}">${c.address || 'Chưa cung cấp'}</td>
      <td>${renderCustomerTag(c.tag)}</td>
      <td><span class="badge-count" style="background:#f1f5f9; color:#334155;">${c.orderCount || 0} đơn</span></td>
      <td><strong style="color:#0284c7;">${formatMoney(c.totalSpent || 0)}</strong></td>
      <td style="font-size:12px; color:#64748b; max-width:150px;">${c.adminNote || c.note || '-'}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon view" title="Xem hồ sơ & Lịch sử đơn" onclick="viewCustomer('${c.id}')">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="btn-icon edit" title="Sửa thông tin" onclick="openEditCustomerModal('${c.id}')">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon delete" title="Xóa khách hàng" onclick="deleteCustomer('${c.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openAddCustomerModal() {
  document.getElementById('form-customer-edit').reset();
  document.getElementById('edit-cust-id').value = '';
  document.getElementById('modal-customer-title').innerHTML = '<i class="fa-solid fa-user-plus" style="color:#4f46e5;"></i> Thêm Khách Hàng Mới';
  openModal('modal-customer-edit');
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

  document.getElementById('modal-customer-title').innerHTML = `<i class="fa-solid fa-user-pen" style="color:#4f46e5;"></i> Sửa Khách Hàng: ${c.fullName}`;
  openModal('modal-customer-edit');
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
      showToast(result.message || 'Lưu khách hàng thành công!', 'success');
      closeModal('modal-customer-edit');
      loadCustomers();
      loadDashboard();
    } else {
      showToast(result.message || 'Có lỗi xảy ra', 'error');
    }
  } catch (err) {
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
    <div style="display:flex; justify-content:space-between; align-items:flex-start; flex-wrap:wrap; gap:16px;">
      <div>
        <div style="display:flex; align-items:center; gap:10px;">
          <h3 style="font-size:18px; font-weight:800; color:#0f172a;">${customer.fullName}</h3>
          ${renderCustomerTag(customer.tag)}
        </div>
        <div style="font-size:13px; color:#475569; margin-top:6px;">
          <div><i class="fa-solid fa-phone" style="width:20px; color:#2563eb;"></i> <b>${customer.phone}</b></div>
          <div><i class="fa-solid fa-envelope" style="width:20px; color:#64748b;"></i> ${customer.email || 'Chưa cung cấp email'}</div>
          <div><i class="fa-solid fa-location-dot" style="width:20px; color:#ea580c;"></i> ${customer.address || 'Chưa có địa chỉ'}</div>
        </div>
      </div>
      <div style="background:#fff; border:1px solid #e2e8f0; border-radius:10px; padding:12px 18px; text-align:right;">
        <div style="font-size:12px; color:#64748b; font-weight:600;">Tổng chi tiêu mua hàng</div>
        <div style="font-size:20px; font-weight:800; color:#0284c7; margin-top:2px;">${formatMoney(customer.totalSpent || 0)}</div>
        <div style="font-size:12px; color:#10b981; font-weight:700;">Đã đặt ${orders.length} đơn hàng</div>
      </div>
    </div>
    ${customer.adminNote ? `<div style="margin-top:12px; padding:8px 12px; background:#fef3c7; border-radius:6px; font-size:12px; color:#92400e;"><b>Ghi chú Admin:</b> ${customer.adminNote}</div>` : ''}
  `;

  document.getElementById('cust-orders-count').innerText = orders.length;
  const oBody = document.getElementById('cust-orders-history-body');
  if (orders.length > 0) {
    oBody.innerHTML = orders.map(o => `
      <tr>
        <td><code>${o.id}</code></td>
        <td style="font-size:13px;">${(o.items || []).map(i => `${i.name} (x${i.quantity})`).join(', ')}</td>
        <td><strong style="color:#10b981;">${formatMoney(o.totalAmount)}</strong></td>
        <td>${renderStatusBadge(o.status)}</td>
        <td style="font-size:12px; color:#64748b;">${new Date(o.createdAt).toLocaleString('vi-VN')}</td>
      </tr>
    `).join('');
  } else {
    oBody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:16px; color:#94a3b8;">Khách hàng này chưa có đơn hàng nào</td></tr>';
  }

  openModal('modal-customer-detail');
}

async function deleteCustomer(id) {
  if (confirm('Bạn có chắc chắn muốn xóa khách hàng này khỏi hệ thống?')) {
    const res = await fetch(`/api/admin/customers/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Đã xóa khách hàng thành công!', 'success');
      loadCustomers();
      loadDashboard();
    } else {
      showToast(data.message || 'Không thể xóa khách hàng', 'error');
    }
  }
}

function exportCustomersCsv() {
  showToast('Đang tải xuống danh sách khách hàng...', 'info');
  window.location.href = '/api/admin/customers/export';
}

// ==================== 4. QUẢN LÝ ĐƠN HÀNG ====================

let orderSearchTimeout = null;
function handleOrderSearch() {
  clearTimeout(orderSearchTimeout);
  orderSearchTimeout = setTimeout(() => {
    currentOrderFilter.search = document.getElementById('order-search').value.trim();
    loadOrders();
  }, 300);
}

function filterOrderStatus(status) {
  currentOrderFilter.status = status;
  document.querySelectorAll('#order-status-filters .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-status') === status);
  });
  loadOrders();
}

async function loadOrders() {
  const query = new URLSearchParams(currentOrderFilter).toString();
  const res = await fetch(`/api/admin/orders?${query}`);
  const { data } = await res.json();
  const tbody = document.getElementById('orders-table-body');

  if (!data || data.length === 0) {
    tbody.innerHTML = '<tr><td colspan="7" style="text-align:center; padding:30px; color:#94a3b8;">Không có đơn hàng nào phù hợp bộ lọc</td></tr>';
    return;
  }

  tbody.innerHTML = data.map(o => `
    <tr>
      <td><code style="font-weight:700; color:#4f46e5;">${o.id}</code></td>
      <td>
        <strong>${o.customerInfo?.fullName || 'Khách vãng lai'}</strong><br>
        <span style="color:#2563eb; font-size:13px; font-weight:600;">${o.customerInfo?.phone || ''}</span>
      </td>
      <td style="max-width:240px; font-size:13px;">
        ${(o.items || []).map(i => `<div style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">• ${i.name} <b>(x${i.quantity})</b></div>`).join('')}
      </td>
      <td><strong style="color:#10b981; font-size:15px;">${formatMoney(o.totalAmount)}</strong></td>
      <td>${renderStatusBadge(o.status)}</td>
      <td style="font-size:13px; color:#64748b;">${new Date(o.createdAt).toLocaleString('vi-VN')}</td>
      <td>
        <div class="action-btns">
          <button class="btn-icon view" title="Xem & Cập nhật đơn" onclick="viewOrder('${o.id}')">
            <i class="fa-solid fa-eye"></i>
          </button>
          <button class="btn-icon delete" title="Xóa đơn hàng" onclick="deleteOrder('${o.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
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
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:16px; margin-bottom:16px;">
      <div style="background:#f8fafc; padding:14px; border-radius:10px; border:1px solid #e2e8f0;">
        <h5 style="font-size:13px; text-transform:uppercase; color:#64748b; margin-bottom:6px;">Thông Tin Khách Hàng</h5>
        <div style="font-size:14px; font-weight:700; color:#0f172a;">${order.customerInfo?.fullName || 'Khách'}</div>
        <div style="font-size:13px; color:#2563eb; font-weight:600; margin:3px 0;">SĐT: ${order.customerInfo?.phone || ''}</div>
        <div style="font-size:13px; color:#475569;">Đ/C: ${order.customerInfo?.address || ''}</div>
        ${order.note ? `<div style="font-size:12px; color:#b45309; margin-top:4px;"><b>Ghi chú của khách:</b> ${order.note}</div>` : ''}
      </div>
      <div style="background:#f8fafc; padding:14px; border-radius:10px; border:1px solid #e2e8f0; display:flex; flex-direction:column; justify-content:space-between;">
        <div>
          <h5 style="font-size:13px; text-transform:uppercase; color:#64748b; margin-bottom:6px;">Trạng Thái Đơn</h5>
          <div>${renderStatusBadge(order.status)}</div>
          <div style="font-size:12px; color:#64748b; margin-top:6px;">Đặt lúc: ${new Date(order.createdAt).toLocaleString('vi-VN')}</div>
        </div>
        <div style="font-size:18px; font-weight:800; color:#10b981; text-align:right;">
          Tổng: ${formatMoney(order.totalAmount)}
        </div>
      </div>
    </div>

    <h5 style="font-size:13px; text-transform:uppercase; color:#64748b; margin-bottom:8px;">Danh Sách Sản Phẩm Đặt Mua</h5>
    <table class="data-table" style="margin-bottom:16px;">
      <thead>
        <tr>
          <th>Sản Phẩm</th>
          <th>Đơn Giá</th>
          <th>Số Lượng</th>
          <th>Thành Tiền</th>
        </tr>
      </thead>
      <tbody>
        ${(order.items || []).map(i => `
          <tr>
            <td>
              <div style="display:flex; align-items:center; gap:10px;">
                <img src="${i.image || ''}" style="width:36px; height:36px; object-fit:cover; border-radius:6px;">
                <span><b>${i.name}</b></span>
              </div>
            </td>
            <td>${formatMoney(i.price)}</td>
            <td>x${i.quantity}</td>
            <td><strong style="color:#0f172a;">${formatMoney(i.price * i.quantity)}</strong></td>
          </tr>
        `).join('')}
      </tbody>
    </table>

    <h5 style="font-size:13px; text-transform:uppercase; color:#64748b; margin-bottom:8px;">Nhật Ký Trạng Thái (Timeline)</h5>
    <div style="border-left:2px solid #e2e8f0; padding-left:14px; margin-left:6px; display:flex; flex-direction:column; gap:10px;">
      ${(order.statusHistory || []).map(h => `
        <div style="position:relative;">
          <div style="position:absolute; left:-19px; top:4px; width:8px; height:8px; border-radius:50%; background:#4f46e5;"></div>
          <div style="font-size:13px; font-weight:700;">${h.title || h.status} <small style="color:#94a3b8; font-weight:normal;">(${new Date(h.time).toLocaleTimeString('vi-VN')} ${new Date(h.time).toLocaleDateString('vi-VN')})</small></div>
          <div style="font-size:12px; color:#64748b;">${h.note || ''}</div>
        </div>
      `).join('')}
    </div>
  `;

  openModal('modal-order-detail');
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
      showToast('Cập nhật trạng thái đơn hàng thành công!', 'success');
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
      showToast('Đã xóa đơn hàng thành công!', 'success');
      loadOrders();
      loadDashboard();
    } else {
      showToast(data.message || 'Lỗi xóa đơn hàng', 'error');
    }
  }
}

function exportOrdersCsv() {
  showToast('Đang tải xuống danh sách đơn hàng...', 'info');
  window.location.href = '/api/admin/orders/export';
}

function printCurrentOrder() {
  if (!activeViewingOrder) return;
  const o = activeViewingOrder;
  const printArea = document.getElementById('invoice-print-area');
  printArea.innerHTML = `
    <div style="max-width:800px; margin:0 auto; padding:30px; font-family:sans-serif; color:#000;">
      <div style="display:flex; justify-content:space-between; border-bottom:2px solid #000; padding-bottom:14px; margin-bottom:20px;">
        <div>
          <h2 style="margin:0; font-size:24px;">TECHSTORE - PHIẾU BÁN HÀNG</h2>
          <p style="margin:4px 0 0; font-size:13px; color:#555;">Hệ thống bán lẻ điện thoại chính hãng toàn quốc</p>
        </div>
        <div style="text-align:right;">
          <h3 style="margin:0; font-size:18px;">Mã Đơn: #${o.id}</h3>
          <p style="margin:4px 0 0; font-size:13px;">Ngày: ${new Date(o.createdAt).toLocaleString('vi-VN')}</p>
        </div>
      </div>

      <div style="margin-bottom:20px; font-size:14px; line-height:1.6;">
        <div><b>Khách hàng:</b> ${o.customerInfo?.fullName || 'Khách'}</div>
        <div><b>Điện thoại:</b> ${o.customerInfo?.phone || ''}</div>
        <div><b>Địa chỉ giao hàng:</b> ${o.customerInfo?.address || ''}</div>
        ${o.note ? `<div><b>Ghi chú:</b> ${o.note}</div>` : ''}
      </div>

      <table style="width:100%; border-collapse:collapse; margin-bottom:20px; font-size:14px;">
        <thead>
          <tr style="border-bottom:1px solid #000; text-align:left;">
            <th style="padding:8px 0;">Sản Phẩm</th>
            <th style="padding:8px 0; text-align:center;">Số Lượng</th>
            <th style="padding:8px 0; text-align:right;">Đơn Giá</th>
            <th style="padding:8px 0; text-align:right;">Thành Tiền</th>
          </tr>
        </thead>
        <tbody>
          ${(o.items || []).map(i => `
            <tr style="border-bottom:1px solid #ddd;">
              <td style="padding:8px 0;">${i.name}</td>
              <td style="padding:8px 0; text-align:center;">${i.quantity}</td>
              <td style="padding:8px 0; text-align:right;">${formatMoney(i.price)}</td>
              <td style="padding:8px 0; text-align:right;">${formatMoney(i.price * i.quantity)}</td>
            </tr>
          `).join('')}
        </tbody>
      </table>

      <div style="text-align:right; font-size:18px; margin-bottom:40px;">
        <b>TỔNG CỘNG THANH TOÁN: <span style="color:#d00;">${formatMoney(o.totalAmount)}</span></b>
      </div>

      <div style="display:flex; justify-content:space-between; text-align:center; margin-top:60px;">
        <div>
          <b>Người Mua Hàng</b><br><small>(Ký và ghi rõ họ tên)</small>
        </div>
        <div>
          <b>Người Lập Phiếu</b><br><small>(Ký và đóng dấu)</small>
        </div>
      </div>
    </div>
  `;

  window.print();
}

// ==================== 5. QUẢN LÝ SẢN PHẨM ====================

let prodSearchTimeout = null;
function handleProductSearch() {
  clearTimeout(prodSearchTimeout);
  prodSearchTimeout = setTimeout(() => {
    currentProdFilter.search = document.getElementById('prod-search').value.trim();
    loadProducts();
  }, 300);
}

function filterProductBrand(brand) {
  currentProdFilter.brand = brand;
  document.querySelectorAll('#prod-brand-filters .pill-btn').forEach(btn => {
    btn.classList.toggle('active', btn.getAttribute('data-brand') === brand);
  });
  loadProducts();
}

async function loadProducts() {
  const brand = currentProdFilter.brand || 'all';
  const res = await fetch(`/api/products?brand=${brand}`);
  const { data } = await res.json();
  const tbody = document.getElementById('products-table-body');

  let list = data || [];
  if (currentProdFilter.search) {
    const q = currentProdFilter.search.toLowerCase();
    list = list.filter(p => p.name.toLowerCase().includes(q) || p.brand.toLowerCase().includes(q));
  }

  if (list.length === 0) {
    tbody.innerHTML = '<tr><td colspan="5" style="text-align:center; padding:30px; color:#94a3b8;">Không có sản phẩm nào</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(p => `
    <tr>
      <td>
        <img src="${p.image}" style="width:48px; height:48px; object-fit:cover; border-radius:8px; border:1px solid #e2e8f0;">
      </td>
      <td>
        <strong>${p.name}</strong><br>
        <small style="color:#64748b;">${p.specs || ''}</small>
      </td>
      <td><span class="pill-btn" style="padding:3px 10px; font-size:12px;">${p.brand}</span></td>
      <td><strong style="color:#dc2626;">${formatMoney(p.price)}</strong></td>
      <td>
        <div class="action-btns">
          <button class="btn-icon edit" title="Sửa sản phẩm" onclick="openEditProductModal('${p.id}')">
            <i class="fa-solid fa-pen-to-square"></i>
          </button>
          <button class="btn-icon delete" title="Xóa sản phẩm" onclick="deleteProduct('${p.id}')">
            <i class="fa-solid fa-trash-can"></i>
          </button>
        </div>
      </td>
    </tr>
  `).join('');
}

function openCrawlModal() {
  document.getElementById('form-crawl-products').reset();
  document.getElementById('crawl-loading-status').style.display = 'none';
  document.getElementById('btn-submit-crawl').disabled = false;
  openModal('modal-crawl-products');
}

function handleCrawlSourceChange() {
  const source = document.getElementById('crawl-source').value;
  const keywordInput = document.getElementById('crawl-keyword');
  if (source === 'dummy') {
    keywordInput.placeholder = 'Nguồn DummyJSON mặc định toàn bộ smartphone';
  } else {
    keywordInput.placeholder = 'Ví dụ: iPhone 16, Galaxy S25...';
  }
}

async function handleCrawlSubmit(e) {
  e.preventDefault();
  const source = document.getElementById('crawl-source').value;
  const brand = document.getElementById('crawl-brand').value;
  const keyword = document.getElementById('crawl-keyword').value.trim();
  const limit = parseInt(document.getElementById('crawl-limit').value) || 10;
  const skipExisting = document.getElementById('crawl-skip-existing').checked;

  const statusBox = document.getElementById('crawl-loading-status');
  const submitBtn = document.getElementById('btn-submit-crawl');
  const statusText = document.getElementById('crawl-status-text');

  statusBox.style.display = 'block';
  submitBtn.disabled = true;
  statusText.innerText = `Đang kết nối web nguồn (${source.toUpperCase()}) và cào sản phẩm...`;

  try {
    const res = await fetch('/api/admin/products/crawl', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ source, brand, keyword, limit, skipExisting })
    });

    const result = await res.json();
    if (result.success) {
      const data = result.data || {};
      showToast(result.message || `Cào thành công ${data.savedCount} điện thoại mới!`, 'success');
      closeModal('modal-crawl-products');
      loadProducts();
      loadDashboard();
    } else {
      showToast(result.message || 'Lỗi khi cào dữ liệu', 'error');
    }
  } catch (err) {
    showToast('Lỗi kết nối máy chủ khi cào sản phẩm', 'error');
  } finally {
    statusBox.style.display = 'none';
    submitBtn.disabled = false;
  }
}

function openAddProductModal() {
  document.getElementById('form-product-edit').reset();
  document.getElementById('edit-prod-id').value = '';
  document.getElementById('modal-product-title').innerHTML = '<i class="fa-solid fa-plus" style="color:#4f46e5;"></i> Thêm Điện Thoại Mới';
  openModal('modal-product-edit');
}

async function openEditProductModal(id) {
  const res = await fetch(`/api/products/${id}`);
  const { data: p } = await res.json();
  if (!p) return;

  document.getElementById('edit-prod-id').value = p.id;
  document.getElementById('edit-p-name').value = p.name;
  document.getElementById('edit-p-brand').value = p.brand;
  document.getElementById('edit-p-price').value = p.price;
  document.getElementById('edit-p-oldprice').value = p.oldPrice || p.price;
  document.getElementById('edit-p-specs').value = p.specs || '';
  document.getElementById('edit-p-image').value = p.image || '';

  document.getElementById('modal-product-title').innerHTML = `<i class="fa-solid fa-pen-to-square" style="color:#4f46e5;"></i> Sửa Sản Phẩm: ${p.name}`;
  openModal('modal-product-edit');
}

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('edit-prod-id').value;
  const payload = {
    name: document.getElementById('edit-p-name').value.trim(),
    brand: document.getElementById('edit-p-brand').value,
    price: document.getElementById('edit-p-price').value,
    oldPrice: document.getElementById('edit-p-oldprice').value,
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
      showToast(data.message || 'Lưu sản phẩm thành công!', 'success');
      closeModal('modal-product-edit');
      loadProducts();
      loadDashboard();
    } else {
      showToast(data.message || 'Lỗi lưu sản phẩm', 'error');
    }
  } catch {
    showToast('Lỗi kết nối máy chủ', 'error');
  }
}

async function deleteProduct(id) {
  if (confirm('Bạn có chắc chắn muốn xóa sản phẩm này khỏi kho hàng?')) {
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Đã xóa sản phẩm thành công!', 'success');
      loadProducts();
      loadDashboard();
    } else {
      showToast(data.message || 'Lỗi xóa sản phẩm', 'error');
    }
  }
}

// ==================== 6. CÀI ĐẶT & MẬT KHẨU ====================

async function handleChangePassword(e) {
  e.preventDefault();
  const oldPassword = document.getElementById('old-pass').value;
  const newPassword = document.getElementById('new-pass').value;
  const confirmPassword = document.getElementById('confirm-new-pass').value;

  if (newPassword !== confirmPassword) {
    showToast('Xác nhận mật khẩu mới không khớp!', 'error');
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
      showToast('Đổi mật khẩu thành công! Vui lòng ghi nhớ mật khẩu mới.', 'success');
      document.getElementById('change-pass-form').reset();
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
    return '<span class="tag-badge tag-vip"><i class="fa-solid fa-crown"></i> VIP</span>';
  }
  if (tag === 'Thân thiết') {
    return '<span class="tag-badge tag-loyal"><i class="fa-solid fa-gem"></i> Thân thiết</span>';
  }
  return '<span class="tag-badge tag-new"><i class="fa-solid fa-user-check"></i> Mới</span>';
}

function renderStatusBadge(status) {
  const map = {
    pending: '<span class="status-badge status-pending"><i class="fa-solid fa-clock"></i> Chờ xác nhận</span>',
    shipping: '<span class="status-badge status-shipping"><i class="fa-solid fa-truck-fast"></i> Đang giao hàng</span>',
    completed: '<span class="status-badge status-completed"><i class="fa-solid fa-circle-check"></i> Đã hoàn thành</span>',
    cancelled: '<span class="status-badge status-cancelled"><i class="fa-solid fa-ban"></i> Đã hủy đơn</span>'
  };
  return map[status] || `<span class="status-badge">${status}</span>`;
}

function openModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.remove('hidden');
}

function closeModal(modalId) {
  const el = document.getElementById(modalId);
  if (el) el.classList.add('hidden');
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
