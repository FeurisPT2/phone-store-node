const AdminModel = require('../models/Admin');
const CustomerModel = require('../models/Customer');
const OrderModel = require('../models/Order');
const ProductModel = require('../models/Product');
const CrawlerService = require('../services/crawlerService');

// ==================== 1. XÁC THỰC ADMIN ====================

exports.login = async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ success: false, message: 'Vui lòng nhập tên đăng nhập và mật khẩu' });
  }

  const admin = await AdminModel.verify(username, password);
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

exports.changePassword = async (req, res) => {
  const { oldPassword, newPassword } = req.body;
  const username = req.session.admin?.username;
  if (!username) {
    return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
  }

  const result = await AdminModel.changePassword(username, oldPassword, newPassword);
  if (!result.success) {
    return res.status(400).json(result);
  }
  res.json(result);
};

// ==================== 2. THỐNG KÊ & BIỂU ĐỒ ====================

exports.getStats = async (req, res) => {
  try {
    const customers = await CustomerModel.getAll();
    const orders = await OrderModel.getAll();
    const products = await ProductModel.getAll();

    // Doanh thu (không tính đơn hủy)
    const validOrders = orders.filter(o => o.status !== 'cancelled');
    const totalRevenue = validOrders.reduce((sum, o) => sum + (Number(o.totalAmount) || 0), 0);

    const statusCounts = {
      pending: orders.filter(o => o.status === 'pending').length,
      shipping: orders.filter(o => o.status === 'shipping').length,
      completed: orders.filter(o => o.status === 'completed').length,
      cancelled: orders.filter(o => o.status === 'cancelled').length
    };

    // Doanh thu theo timeline
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
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ==================== 3. QUẢN LÝ KHÁCH HÀNG (CRM) ====================

exports.getAllCustomers = async (req, res) => {
  try {
    const { search, tag } = req.query;
    const list = await CustomerModel.getAll({ search, tag });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getCustomerDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const customer = await CustomerModel.findById(id);
    if (!customer) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
    }

    const customerOrders = await OrderModel.findByCustomerId(id);

    res.json({
      success: true,
      data: {
        customer,
        orders: customerOrders
      }
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.createCustomer = async (req, res) => {
  try {
    const { fullName, phone, email, address, note, adminNote, tag } = req.body;
    const newCust = await CustomerModel.createCustomer({ fullName, phone, email, address, note, adminNote, tag });
    res.json({ success: true, message: 'Thêm khách hàng thành công!', data: newCust });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

exports.updateCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const updated = await CustomerModel.updateCustomer(id, req.body);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng để sửa' });
    }
    res.json({ success: true, message: 'Cập nhật thông tin khách hàng thành công!', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteCustomer = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CustomerModel.deleteCustomer(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng để xóa' });
    }
    res.json({ success: true, message: 'Đã xóa khách hàng khỏi hệ thống!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportCustomersCsv = async (req, res) => {
  try {
    const customers = await CustomerModel.getAll();
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
  } catch (err) {
    res.status(500).send('Lỗi xuất CSV: ' + err.message);
  }
};

// ==================== 4. QUẢN LÝ ĐƠN HÀNG ====================

exports.getAllOrders = async (req, res) => {
  try {
    const { status, search } = req.query;
    const list = await OrderModel.getAll({ status, search });
    res.json({ success: true, count: list.length, data: list });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getOrderDetail = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await OrderModel.findById(id);
    if (!order) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, note } = req.body;
    const updated = await OrderModel.updateStatus(id, status, note);
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng' });
    }
    res.json({ success: true, message: 'Đã cập nhật trạng thái đơn hàng!', data: updated });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await OrderModel.deleteOrder(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy đơn hàng để xóa' });
    }
    res.json({ success: true, message: 'Đã xóa đơn hàng thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportOrdersCsv = async (req, res) => {
  try {
    const orders = await OrderModel.getAll();
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
  } catch (err) {
    res.status(500).send('Lỗi xuất CSV: ' + err.message);
  }
};

// ==================== 5. QUẢN LÝ SẢN PHẨM ====================

exports.crawlProducts = async (req, res) => {
  try {
    const { keyword, brand, limit = 10, source = 'tiki', skipExisting = true } = req.body;
    let result;
    if (source === 'dummy') {
      result = await CrawlerService.crawlFromDummyJson({
        limit: parseInt(limit) || 10,
        skipExisting: skipExisting !== false
      });
    } else {
      result = await CrawlerService.crawlFromTiki({
        keyword: keyword || '',
        brand: brand || 'all',
        limit: parseInt(limit) || 10,
        skipExisting: skipExisting !== false
      });
    }

    res.json({
      success: true,
      message: `Đã cào thành công ${result.savedCount} sản phẩm từ ${result.source}!`,
      data: result
    });
  } catch (err) {
    console.error('Lỗi cào sản phẩm:', err);
    res.status(500).json({ success: false, message: 'Lỗi cào dữ liệu: ' + err.message });
  }
};

exports.addProduct = async (req, res) => {
  try {
    const { name, brand, price, oldPrice, specs, image } = req.body;
    if (!name || !price) {
      return res.status(400).json({ success: false, message: 'Thiếu tên hoặc giá sản phẩm' });
    }
    const newProduct = await ProductModel.create({ name, brand, price, oldPrice, specs, image });
    res.json({ success: true, message: 'Đã thêm sản phẩm mới thành công!', data: newProduct });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, brand, price, oldPrice, specs, image } = req.body;
    const updated = await ProductModel.update(id, { name, brand, price, oldPrice, specs, image });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, message: 'Đã cập nhật sản phẩm thành công!', data: updated });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ProductModel.delete(id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm' });
    }
    res.json({ success: true, message: 'Đã xóa sản phẩm thành công!' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
