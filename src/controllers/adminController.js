const JsonDB = require('../models/database');
const AdminModel = require('../models/Admin');
const CustomerModel = require('../models/Customer');
const OrderModel = require('../models/Order');

const productDB = new JsonDB('products');

// ==================== 1. XÁC THỰC ADMIN ====================

exports.login = (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const admin = AdminModel.verify(username, password);
  if (!admin) {
    return res.status(401).json({ success: false, message: 'Sai tên đăng nhập hoặc mật khẩu' });
  }

  req.session.admin = admin;
  res.json({
    success: true,
    message: 'Đăng nhập thành công',
    admin
  });
};

exports.logout = (req, res) => {
  req.session.admin = null;
  res.json({ success: true, message: 'Đã đăng xuất thành công' });
};

exports.getMe = (req, res) => {
  if (!req.session.admin) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }
  res.json({ success: true, admin: req.session.admin });
};

exports.changePassword = (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const username = req.session.admin?.username;
  if (!username) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }

  const result = AdminModel.changePassword(username, oldPassword, newPassword);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
};

// ==================== 2. THỐNG KÊ & BIỂU ĐỒ ====================

exports.getStats = (req, res) => {
  const customers = CustomerModel.getAll();
  const orders = OrderModel.getAll();
  const products = productDB.findAll();

  // Doanh thu (không tính đơn hủy)
  const validOrders = orders.filter(o => o.status !== 'cancelled');
  const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

  const statusCounts = {
    pending: orders.filter(o => o.status === 'pending').length,
    shipping: orders.filter(o => o.status === 'shipping').length,
    completed: orders.filter(o => o.status === 'completed').length,
    cancelled: orders.filter(o => o.status === 'cancelled').length
  };

  // Doanh thu 6 mốc gần nhất (hoặc theo ngày)
  const timelineMap = {};
  orders.slice(0, 30).reverse().forEach(o => {
    if (o.status === 'cancelled') return;
    const dateStr = new Date(o.createdAt).toLocaleDateString('vi-VN');
    timelineMap[dateStr] = (timelineMap[dateStr] || 0) + (Number(o.totalAmount) || 0);
  });

  const timelineLabels = Object.keys(timelineMap);
  const timelineValues = Object.values(timelineMap);

  // Top 5 khách hàng chi tiêu nhiều nhất
  const topCustomers = [...customers]
    .sort((a, b) => (b.totalSpent || 0) - (a.totalSpent || 0))
    .slice(0, 5);

  res.json({
    success: true,
    data: {
      totalRevenue,
      totalOrders: orders.length,
      totalCustomers: customers.length,
      totalProducts: products.length,
      statusCounts,
      recentOrders: orders.slice(0, 6),
      topCustomers,
      charts: {
        labels: timelineLabels.length > 0 ? timelineLabels : ['Hôm nay'],
        revenue: timelineValues.length > 0 ? timelineValues : [totalRevenue],
        statusDistribution: [
          statusCounts.pending,
          statusCounts.shipping,
          statusCounts.completed,
          statusCounts.cancelled
        ]
      }
    }
  });
};

// ==================== 3. QUẢN LÝ KHÁCH HÀNG (CRM) ====================

exports.getAllCustomers = (req, res) => {
  const { search, tag } = req.query;
  const list = CustomerModel.getAll({ search, tag });
  res.json({ success: true, count: list.length, data: list });
};

exports.getCustomerDetail = (req, res) => {
  const { id } = req.params;
  const customer = CustomerModel.findById(id);
  if (!customer) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
  }

  // Lấy toàn bộ đơn hàng của khách hàng này
  const customerOrders = OrderModel.findByCustomerId(id);

  res.json({
    success: true,
    data: {
      customer,
      orders: customerOrders
    }
  });
};

exports.createCustomer = (req, res) => {
  try {
    const { fullName, phone, email, address, note, adminNote, tag } = req.body;
    const newCust = CustomerModel.createCustomer({ fullName, phone, email, address, note, adminNote, tag });
    res.json({ success: true, message: 'Thêm khách hàng thành công!', data: newCust });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCustomer = (req, res) => {
  const { id } = req.params;
  const updated = CustomerModel.updateCustomer(id, req.body);
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng để sửa' });
  }
  res.json({ success: true, message: 'Cập nhật thông tin khách hàng thành công!', data: updated });
};

exports.deleteCustomer = (req, res) => {
  const { id } = req.params;
  const deleted = CustomerModel.deleteCustomer(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng để xóa' });
  }
  res.json({ success: true, message: 'Đã xóa khách hàng khỏi hệ thống!' });
};

exports.exportCustomersCsv = (req, res) => {
  const customers = CustomerModel.getAll();
  const headers = ['Mã KH', 'Họ và Tên', 'Số Điện Thoại', 'Email', 'Địa Chỉ', 'Phân Hạng', 'Số Lần Mua', 'Tổng Chi Tiêu (VNĐ)', 'Ghi Chú Khách', 'Ghi Chú Admin', 'Ngày Tạo'];
  
  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const rows = customers.map(c => [
    escapeCsv(c.id),
    escapeCsv(c.fullName),
    escapeCsv(c.phone),
    escapeCsv(c.email || ''),
    escapeCsv(c.address || ''),
    escapeCsv(c.tag || 'Mới'),
    escapeCsv(c.orderCount || 0),
    escapeCsv(c.totalSpent || 0),
    escapeCsv(c.note || ''),
    escapeCsv(c.adminNote || ''),
    escapeCsv(new Date(c.createdAt || Date.now()).toLocaleString('vi-VN'))
  ].join(','));

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="DanhSachKhachHang.csv"');
  res.send(csvContent);
};

// ==================== 4. QUẢN LÝ ĐƠN HÀNG ====================

exports.getAllOrders = (req, res) => {
  const { status, search } = req.query;
  const list = OrderModel.getAll({ status, search });
  res.json({ success: true, count: list.length, data: list });
};

exports.getOrderDetail = (req, res) => {
  const { id } = req.params;
  const order = OrderModel.findById(id);
  if (!order) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
  }
  res.json({ success: true, data: order });
};

exports.updateOrderStatus = (req, res) => {
  const { id } = req.params;
  const { status, note } = req.body;
  try {
    const updated = OrderModel.updateStatus(id, status, note);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    res.json({ success: true, message: 'Đã cập nhật trạng thái đơn hàng!', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteOrder = (req, res) => {
  const { id } = req.params;
  const deleted = OrderModel.deleteOrder(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng để xóa' });
  }
  res.json({ success: true, message: 'Đã xóa đơn hàng thành công!' });
};

exports.exportOrdersCsv = (req, res) => {
  const orders = OrderModel.getAll();
  const headers = ['Mã Đơn', 'Khách Hàng', 'Số Điện Thoại', 'Địa Chỉ Nhận Hàng', 'Sản Phẩm', 'Tổng Tiền (VNĐ)', 'Trạng Thái', 'Ghi Chú Đơn', 'Thời Gian Đặt'];
  
  const statusNames = {
    pending: 'Chờ xác nhận',
    shipping: 'Đang giao hàng',
    completed: 'Đã hoàn thành',
    cancelled: 'Đã hủy'
  };

  const escapeCsv = (val) => `"${String(val ?? '').replace(/"/g, '""')}"`;

  const rows = orders.map(o => {
    const itemsStr = (o.items || []).map(i => `${i.name} (SL: ${i.quantity})`).join('; ');
    return [
      escapeCsv(o.id),
      escapeCsv(o.customerInfo?.fullName || 'Khách'),
      escapeCsv(o.customerInfo?.phone || ''),
      escapeCsv(o.customerInfo?.address || ''),
      escapeCsv(itemsStr),
      escapeCsv(o.totalAmount || 0),
      escapeCsv(statusNames[o.status] || o.status),
      escapeCsv(o.note || o.customerInfo?.note || ''),
      escapeCsv(new Date(o.createdAt).toLocaleString('vi-VN'))
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\r\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="DanhSachDonHang.csv"');
  res.send(csvContent);
};

// ==================== 5. QUẢN LÝ SẢN PHẨM ====================

exports.addProduct = (req, res) => {
  const { name, brand, price, oldPrice, specs, image } = req.body;
  if (!name || !price) {
    return res.status(400).json({ success: false, message: 'Thiếu tên hoặc giá sản phẩm' });
  }
  const newProduct = {
    id: 'p_' + Date.now(),
    name,
    brand: brand || 'Khác',
    price: parseInt(price),
    oldPrice: parseInt(oldPrice || price),
    specs: specs || 'Thông số tiêu chuẩn',
    image: image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=500&auto=format&fit=crop&q=80',
    createdAt: new Date().toISOString()
  };
  productDB.insert(newProduct);
  res.json({ success: true, message: 'Đã thêm sản phẩm mới thành công!', data: newProduct });
};

exports.updateProduct = (req, res) => {
  const { id } = req.params;
  const { name, brand, price, oldPrice, specs, image } = req.body;
  const updated = productDB.update(id, {
    name,
    brand,
    price: parseInt(price),
    oldPrice: parseInt(oldPrice || price),
    specs,
    image
  });
  if (!updated) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
  }
  res.json({ success: true, message: 'Đã cập nhật sản phẩm thành công!', data: updated });
};

exports.deleteProduct = (req, res) => {
  const { id } = req.params;
  const deleted = productDB.delete(id);
  if (!deleted) {
    return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
  }
  res.json({ success: true, message: 'Đã xóa sản phẩm thành công!' });
};
