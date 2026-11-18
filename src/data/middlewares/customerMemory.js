const CustomerModel = require('../models/Customer');
const AdminModel = require('../models/Admin');

module.exports = async function (req, res, next) {
  if (req.session && !req.session.cart) req.session.cart = [];

  // 1. Customer session handling & rehydration
  if (req.session?.customer) {
    req.session.customer = CustomerModel.toSafeCustomer(req.session.customer);
    req.currentCustomer = req.session.customer;
  } else {
    const phone = req.cookies?.remember_customer_phone;
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
  }

  // 2. Admin session rehydration across serverless invocations
  if (!req.session?.admin && req.cookies?.admin_token) {
    try {
      const verified = AdminModel.verifyToken(req.cookies.admin_token);
      if (verified && verified.username) {
        const admin = await AdminModel.findByUsername(verified.username);
        if (admin) {
          req.session.admin = {
            id: admin.id,
            username: admin.username,
            fullName: admin.fullName,
            email: admin.email,
            role: admin.role
          };
        }
      }
    } catch (err) {
      console.error('Error remembering admin in middleware:', err.message);
    }
  }

  next();
};
