const CustomerModel = require('../models/Customer');
const OrderModel = require('../models/Order');
const ProductModel = require('../models/Product');

exports.getProfile = async (req, res) => {
  let sessionCust = req.currentCustomer || req.session?.customer;
  if (!sessionCust && req.query.phone) {
    sessionCust = await CustomerModel.findByPhone(req.query.phone);
  }
  if (!sessionCust) {
    return res.json({ loggedIn: false, remembered: false, data: null });
  }
  const fresh = (await CustomerModel.findById(sessionCust.id)) || CustomerModel.toSafeCustomer(sessionCust);
  if (req.session) req.session.customer = fresh;
  res.json({
    loggedIn: !!(req.session?.customer),
    remembered: true,
    data: fresh
  });
};

exports.updateProfile = async (req, res) => {
  try {
    const sessionCust = req.currentCustomer || req.session?.customer;
    if (!sessionCust) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để cập nhật thông tin' });
    }
    const { fullName, email, address, note } = req.body;
    const updated = await CustomerModel.updateCustomer(sessionCust.id, {
      fullName,
      email,
      address,
      note
    });
    if (!updated) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản khách hàng' });
    }
    if (req.session) req.session.customer = updated;
    res.json({
      success: true,
      message: 'Cập nhật hồ sơ & sổ địa chỉ thành công!',
      customer: updated
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const sessionCust = req.currentCustomer || req.session?.customer;
    if (!sessionCust) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để đổi mật khẩu' });
    }
    const { oldPassword, newPassword } = req.body;
    await CustomerModel.changePassword(sessionCust.id, { oldPassword, newPassword });
    res.json({
      success: true,
      message: 'Đổi mật khẩu tài khoản thành công!'
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.getWishlist = async (req, res) => {
  try {
    const sessionCust = req.currentCustomer || req.session?.customer;
    let wishlistIds = [];
    if (sessionCust) {
      const fresh = await CustomerModel.findById(sessionCust.id);
      wishlistIds = Array.isArray(fresh?.wishlist) ? fresh.wishlist : [];
    } else if (Array.isArray(req.session?.wishlist)) {
      wishlistIds = req.session.wishlist;
    }

    const allProducts = await ProductModel.getAll('all');
    const products = allProducts.filter((p) => wishlistIds.includes(String(p.id)));

    res.json({
      success: true,
      wishlist: wishlistIds,
      products
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleWishlist = async (req, res) => {
  try {
    const { productId } = req.body;
    if (!productId) {
      return res.status(400).json({ success: false, message: 'Thiếu mã sản phẩm (productId)' });
    }

    const sessionCust = req.currentCustomer || req.session?.customer;
    if (sessionCust) {
      const result = await CustomerModel.toggleWishlist(sessionCust.id, productId);
      if (!result) {
        return res.status(404).json({ success: false, message: 'Không tìm thấy khách hàng' });
      }
      if (req.session) req.session.customer = result.customer;
      return res.json({
        success: true,
        added: result.added,
        wishlist: result.wishlist,
        message: result.added ? 'Đã thêm vào danh sách yêu thích ❤️' : 'Đã bỏ khỏi danh sách yêu thích'
      });
    }

    // Guest session wishlist fallback
    if (!Array.isArray(req.session.wishlist)) {
      req.session.wishlist = [];
    }
    const pid = String(productId);
    const idx = req.session.wishlist.indexOf(pid);
    let added = false;
    if (idx >= 0) {
      req.session.wishlist.splice(idx, 1);
    } else {
      req.session.wishlist.push(pid);
      added = true;
    }
    res.json({
      success: true,
      added,
      wishlist: req.session.wishlist,
      message: added ? 'Đã thêm vào danh sách yêu thích ❤️' : 'Đã bỏ khỏi danh sách yêu thích'
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.register = async (req, res) => {
  try {
    const { fullName, phone, password, email, address } = req.body;
    const customer = await CustomerModel.register({ fullName, phone, password, email, address });

    req.session.customer = customer;
    res.cookie('remember_customer_phone', customer.phone, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });

    res.json({
      success: true,
      message: 'Đăng ký tài khoản thành công!',
      customer
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.login = async (req, res) => {
  try {
    const { phone, password, rememberMe } = req.body;
    const customer = await CustomerModel.login({ phone, password });

    req.session.customer = customer;
    if (rememberMe) {
      res.cookie('remember_customer_phone', customer.phone, { maxAge: 30 * 24 * 60 * 60 * 1000, httpOnly: true });
    }

    res.json({
      success: true,
      message: 'Đăng nhập thành công!',
      customer
    });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

exports.logout = (req, res) => {
  req.session.customer = null;
  res.clearCookie('remember_customer_phone');
  res.json({ success: true, message: 'Đã đăng xuất tài khoản!' });
};

exports.getMyOrders = async (req, res) => {
  try {
    const customer = req.currentCustomer || req.session.customer;
    if (!customer) {
      return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để xem đơn hàng' });
    }
    const orders = await OrderModel.findByCustomerId(customer.id);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.lookup = async (req, res) => {
  try {
    const c = await CustomerModel.findByPhone(req.query.phone);
    if (!c) return res.json({ found: false, customer: null });
    res.json({ found: true, customer: c });
  } catch (err) {
    res.status(500).json({ found: false, error: err.message });
  }
};

exports.forget = (req, res) => {
  req.session.customer = null;
  res.clearCookie('remember_customer_phone');
  res.json({ success: true });
};
