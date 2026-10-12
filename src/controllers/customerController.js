const CustomerModel = require('../models/Customer');
const OrderModel = require('../models/Order');

exports.getProfile = (req, res) => {
  const c = req.currentCustomer || req.session.customer;
  if (!c) {
    return res.json({ loggedIn: false, remembered: false, data: null });
  }
  const safe = { ...c };
  delete safe.passwordHash;
  res.json({
    loggedIn: !!(req.session.customer && req.session.customer.passwordHash !== undefined || req.session.customer),
    remembered: true,
    data: safe
  });
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
    const safe = { ...c };
    delete safe.passwordHash;
    res.json({ found: true, customer: safe });
  } catch (err) {
    res.status(500).json({ found: false, error: err.message });
  }
};

exports.forget = (req, res) => {
  req.session.customer = null;
  res.clearCookie('remember_customer_phone');
  res.json({ success: true });
};
