const AdminModel = require('../models/Admin');
const CustomerModel = require('../models/Customer');

/**
 * Unified authentication controller
 * Supports both Admin accounts and Customer / Student accounts in a single login flow.
 */
exports.unifiedLogin = async (req, res) => {
  try {
    const { identifier, phone, username, password, rememberMe } = req.body;
    const loginId = (identifier || phone || username || '').trim();

    if (!loginId || !password) {
      return res.status(400).json({
        success: false,
        message: 'Vui lòng nhập số điện thoại hoặc tên tài khoản và mật khẩu.'
      });
    }

    // 1. Check Admin credentials first
    const admin = await AdminModel.verify(loginId, password);
    if (admin) {
      req.session.admin = admin;
      const adminToken = AdminModel.generateToken(admin);
      if (adminToken) {
        res.cookie('admin_token', adminToken, {
          maxAge: 7 * 24 * 60 * 60 * 1000,
          httpOnly: true,
          sameSite: 'lax',
          path: '/'
        });
      }
      return res.json({
        success: true,
        role: 'admin',
        redirectUrl: '/admin',
        message: 'Xác thực Quản trị viên thành công!',
        admin
      });
    }

    // 2. Check Customer / Student credentials
    try {
      const customer = await CustomerModel.login({ phone: loginId, password });
      if (customer) {
        req.session.customer = customer;
        if (rememberMe) {
          res.cookie('remember_customer_phone', customer.phone, {
            maxAge: 30 * 24 * 60 * 60 * 1000,
            httpOnly: true
          });
        }
        return res.json({
          success: true,
          role: 'customer',
          redirectUrl: '/',
          message: 'Đăng nhập thành công!',
          customer
        });
      }
    } catch {
      // CustomerModel.login throws when credentials do not match; proceed to unified 401
    }

    return res.status(401).json({
      success: false,
      message: 'Số điện thoại, tên tài khoản hoặc mật khẩu không chính xác.'
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      message: 'Lỗi máy chủ khi xử lý đăng nhập: ' + err.message
    });
  }
};
