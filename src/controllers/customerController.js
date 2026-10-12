const CustomerModel = require('../models/Customer');

exports.getProfile = (req, res) => {
  const c = req.currentCustomer || req.session.customer;
  res.json({ remembered: !!c, data: c || null });
};

exports.lookup = async (req, res) => {
  try {
    const c = await CustomerModel.findByPhone(req.query.phone);
    res.json({ found: !!c, customer: c || null });
  } catch (err) {
    res.status(500).json({ found: false, error: err.message });
  }
};

exports.forget = (req, res) => {
  req.session.customer = null;
  res.clearCookie('remember_customer_phone');
  res.json({ success: true });
};
