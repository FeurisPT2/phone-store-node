const express = require('express');
const router = express.Router();
const admin = require('../controllers/adminController');
const adminAuth = require('../middlewares/adminAuth');

// 1. Xác thực Admin
router.post('/login', admin.login);
router.post('/logout', adminAuth, admin.logout);
router.get('/me', adminAuth, admin.getMe);
router.post('/change-password', adminAuth, admin.changePassword);

// 2. Thống kê & Biểu đồ
router.get('/stats', adminAuth, admin.getStats);

// 3. Quản lý Khách Hàng (CRM)
router.get('/customers/export', adminAuth, admin.exportCustomersCsv);
router.get('/customers', adminAuth, admin.getAllCustomers);
router.get('/customers/:id', adminAuth, admin.getCustomerDetail);
router.post('/customers', adminAuth, admin.createCustomer);
router.put('/customers/:id', adminAuth, admin.updateCustomer);
router.delete('/customers/:id', adminAuth, admin.deleteCustomer);

// 4. Quản lý Đơn Hàng
router.get('/orders/export', adminAuth, admin.exportOrdersCsv);
router.get('/orders', adminAuth, admin.getAllOrders);
router.get('/orders/:id', adminAuth, admin.getOrderDetail);
router.patch('/orders/:id/status', adminAuth, admin.updateOrderStatus);
router.delete('/orders/:id', adminAuth, admin.deleteOrder);

// 5. Quản lý Sản Phẩm
router.post('/products', adminAuth, admin.addProduct);
router.put('/products/:id', adminAuth, admin.updateProduct);
router.delete('/products/:id', adminAuth, admin.deleteProduct);

module.exports = router;
