const express = require('express');
const router = express.Router();

const orderController = require('../controllers/orderController');

router.use('/products', require('./productRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/customers', require('./customerRoutes'));
router.use('/auth', require('./authRoutes'));
router.use('/orders', require('./orderRoutes'));
router.post('/payments/sandbox-webhook', orderController.handleSandboxWebhook);
router.use('/admin', require('./adminRoutes'));
router.use('/chat', require('./chatRoutes'));

module.exports = router;
