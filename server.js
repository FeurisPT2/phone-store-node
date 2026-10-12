const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const sessionConfig = require('./src/config/sessionConfig');
const customerMemoryMiddleware = require('./src/middlewares/customerMemory');
const apiRoutes = require('./src/routes');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessionConfig);
app.use(customerMemoryMiddleware);

// Điều hướng & bảo vệ truy cập trang Admin
app.use((req, res, next) => {
  if (req.path === '/admin' || req.path === '/admin.html') {
    if (!req.session || !req.session.admin) {
      return res.redirect('/login.html');
    }
    return res.sendFile(path.join(__dirname, 'src', 'public', 'admin.html'));
  }

  if (req.path === '/login.html' || req.path === '/admin/login') {
    if (req.session && req.session.admin) {
      return res.redirect('/admin');
    }
  }

  next();
});

app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use('/api', apiRoutes);

// Fallback route cho 404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'src', 'public', 'index.html'));
});

// Chỉ listen port khi chạy cục bộ / standalone (Vercel tự quản lý serverless)
if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 WEB BÁN ĐIỆN THOẠI CHẠY TẠI: http://localhost:${PORT}`);
    console.log(`🛡️  ADMIN PANEL: http://localhost:${PORT}/admin`);
    console.log(`🔑 TÀI KHOẢN MẶC ĐỊNH: admin / admin123`);
    console.log(`✨ Ghi nhớ thông tin khách hàng: [ĐANG HOẠT ĐỘNG]`);
    console.log(`===================================================`);
  });
}

module.exports = app;
