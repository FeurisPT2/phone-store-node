module.exports = function (req, res, next) {
  if (req.session && req.session.admin) {
    return next();
  }

  // API endpoint request
  if (req.originalUrl && req.originalUrl.startsWith('/api/admin')) {
    return res.status(401).json({
      success: false,
      message: 'Phiên làm việc hết hạn hoặc chưa đăng nhập quản trị viên'
    });
  }

  // HTML page request
  return res.redirect('/login.html');
};
