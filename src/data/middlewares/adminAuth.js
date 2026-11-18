const AdminModel = require('../models/Admin');

module.exports = async function (req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }

  if (req.cookies && req.cookies.admin_token) {
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
          return next();
        }
      }
    } catch (err) {
      console.error('adminAuth token verification failed:', err.message);
    }
  }

  // API endpoint request
  if (req.originalUrl && req.originalUrl.startsWith('/api/admin')) {
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc hết hạn hoặc chưa đăng nhập quản trị viên'
    });
  }

  // HTML page request
  return res.redirect('/login?redirect=/admin');
};
