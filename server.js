require('dotenv').config();
require('./src/config/db');

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const sessionConfig = require('./src/config/sessionConfig');
const customerMemoryMiddleware = require('./src/middlewares/customerMemory');
const apiRoutes = require('./src/routes');
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Hỗ trợ reverse proxy (Vercel, Render, Railway, HTTPS)
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(sessionConfig);
app.use(customerMemoryMiddleware);

// Health check endpoint cho các nền tảng deploy (Render, Railway, Kubernetes)
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: Math.floor(process.uptime()),
    database: db.isPostgres() ? 'neon-postgres' : 'json-db',
    timestamp: new Date().toISOString()
  });
});

// Điều hướng Cổng Đăng Nhập tập trung
app.get(['/login', '/login.html', '/admin/login'], (req, res) => {
  if (req.session && req.session.admin && (req.query.role === 'admin' || req.path === '/admin/login')) {
    return res.redirect('/admin');
  }
  return res.sendFile(path.join(__dirname, 'src', 'public', 'login.html'));
});

// Điều hướng & bảo vệ truy cập trang Admin
app.use((req, res, next) => {
  if (req.path === '/admin' || req.path === '/admin.html') {
    if (!req.session || !req.session.admin) {
      return res.redirect('/login?role=admin&redirect=/admin');
    }
    return res.sendFile(path.join(__dirname, 'src', 'public', 'admin.html'));
  }

  next();
});

app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use('/api', apiRoutes);

// Fallback route cho SPA/404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'src', 'public', 'index.html'));
});

// Chỉ listen port khi chạy cục bộ / standalone (Vercel tự quản lý serverless)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, () => {
    console.log(`===================================================`);
    console.log(`🚀 WEB BÁN ĐIỆN THOẠI CHẠY TẠI: http://localhost:${PORT}`);
    console.log(`🔑 CỔNG ĐĂNG NHẬP (DUAL PORTAL): http://localhost:${PORT}/login`);
    console.log(`🛡️  ADMIN PANEL: http://localhost:${PORT}/admin`);
    console.log(`✨ Chế độ CSDL: [${db.isPostgres() ? 'Neon PostgreSQL' : 'Local JSON DB'}]`);
    console.log(`===================================================`);
  });
}

module.exports = app;
