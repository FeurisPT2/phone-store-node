const CustomerModel = require('../models/Customer');

module.exports = async function (req, res, next) {
  if (!req.session.cart) req.session.cart = [];
  if (req.session.customer) {
    req.currentCustomer = req.session.customer;
    return next();
  }

  const phone = req.cookies.remember_customer_phone;
  if (phone) {
    try {
      const customer = await CustomerModel.findByPhone(phone);
      if (customer) {
        req.session.customer = customer;
        req.currentCustomer = customer;
      }
    } catch (err) {
      console.error('Error remembering customer in middleware:', err.message);
    }
  }
  next();
};
