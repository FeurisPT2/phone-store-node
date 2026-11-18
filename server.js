require('dotenv').config();
require('./src/config/db');

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const sessionConfig = require('./src/config/sessionConfig');
const customerMemoryMiddleware = require('./src/middlewares/customerMemory');
const compressionMiddleware = require('./src/middlewares/compression');
const apiRoutes = require('./src/routes');
const db = require('./src/config/db');

const app = express();
const PORT = process.env.PORT || 3000;

// Hỗ trợ reverse proxy (Vercel, Render, Railway, HTTPS)
app.set('trust proxy', 1);

app.use(cors());
app.use(compressionMiddleware);
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

// Tránh lỗi 404 cho favicon khi trình duyệt tự động request
app.get('/favicon.ico', (req, res) => res.status(204).end());

// Điều hướng Cổng Đăng Nhập tập trung
app.get(['/login', '/login.html', '/admin/login'], (req, res) => {
  if (req.session && req.session.admin) {
    return res.redirect('/admin');
  }
  return res.sendFile(path.join(__dirname, 'src', 'public', 'login.html'));
});

// Gộp chung Dịch vụ và Cho thuê vào Cửa Hàng (/shop)
app.get(['/services', '/services.html'], (req, res) => {
  return res.redirect('/shop?category=service');
});

app.get(['/rentals', '/rentals.html', '/rental', '/rental.html'], (req, res) => {
  return res.redirect('/shop?category=rental');
});

// Điều hướng Cửa Hàng Tổng Hợp (Dịch vụ, Cho thuê & Phụ kiện)
app.get(['/shop', '/shop.html', '/store', '/store.html'], (req, res) => {
  return res.sendFile(path.join(__dirname, 'src', 'public', 'shop.html'));
});

// Điều hướng Trang Chi Tiết Sản Phẩm & Dịch Vụ (/product)
app.get(['/product', '/product.html', '/product/:id', '/item', '/item.html'], (req, res) => {
  return res.sendFile(path.join(__dirname, 'src', 'public', 'product.html'));
});

// Bỏ trang Chức năng: Điều hướng về Cửa Hàng
app.get(['/features', '/features.html'], (req, res) => {
  return res.redirect('/shop');
});

// Điều hướng Cổng Khách Hàng (Customer Self-Service Portal)
app.get('/customer-portal', (req, res) => {
  return res.sendFile(path.join(__dirname, 'src', 'public', 'shop.html'));
});

// Điều hướng Trang Cài Đặt Khách Hàng / Hồ Sơ Sinh Viên (Customer Settings Page)
app.get(['/settings', '/settings.html', '/profile', '/profile.html', '/user-settings'], (req, res) => {
  return res.sendFile(path.join(__dirname, 'src', 'public', 'settings.html'));
});

// Điều hướng Trang Giỏ Hàng & Lịch Hẹn (/cart)
app.get(['/cart', '/cart.html', '/checkout', '/checkout.html'], (req, res) => {
  return res.sendFile(path.join(__dirname, 'src', 'public', 'cart.html'));
});

// Điều hướng & bảo vệ truy cập trang Admin
app.use(async (req, res, next) => {
  if (req.path === '/admin' || req.path === '/admin.html') {
    if (!req.session?.admin && req.cookies?.admin_token) {
      const AdminModel = require('./src/models/Admin');
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
    }
    if (!req.session || !req.session.admin) {
      return res.redirect('/login?redirect=/admin');
    }
    return res.sendFile(path.join(__dirname, 'src', 'public', 'admin.html'));
  }

  next();
});

app.get(['/src/public/logo.png', '/logo.png', '/src/public/logo2.png'], (req, res) => {
  const filename = req.path.endsWith('logo2.png') ? 'logo2.png' : 'logo.png';
  res.sendFile(path.join(__dirname, 'src', 'public', filename));
});

app.use(express.static(path.join(__dirname, 'src', 'public')));
app.use('/api', async (req, res, next) => {
  if (db.isPostgres() && typeof db.ensureReady === 'function') {
    try {
      await db.ensureReady();
    } catch (err) {
      console.error('DB readiness check failed:', err.message);
    }
  }
  next();
}, apiRoutes);

// Fallback route cho SPA/404
app.use((req, res) => {
  res.status(404).sendFile(path.join(__dirname, 'src', 'public', 'index.html'));
});

// Chỉ listen port khi chạy cục bộ / standalone (Vercel tự quản lý serverless)
if (!process.env.VERCEL && process.env.NODE_ENV !== 'test') {
  app.listen(PORT, '0.0.0.0', () => {
    console.log(`===================================================`);
    console.log(`🚀 WEB BÁN ĐIỆN THOẠI CHẠY TẠI: http://localhost:${PORT}`);
    console.log(`🔑 CỔNG ĐĂNG NHẬP (DUAL PORTAL): http://localhost:${PORT}/login`);
    console.log(`🛡️  ADMIN PANEL: http://localhost:${PORT}/admin`);
    console.log(`✨ Chế độ CSDL: [${db.isPostgres() ? 'Neon PostgreSQL' : 'Local JSON DB'}]`);
    console.log(`===================================================`);
  });
}

module.exports = app;
