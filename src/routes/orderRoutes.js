const express = require('express');
const router = express.Router();
const orderController = require('../controllers/orderController');

router.post('/checkout', orderController.createOrder);
router.get('/track', orderController.trackOrder);
router.post('/track', orderController.trackOrder);
router.get('/:id/payment-status', orderController.getPaymentStatus);
router.post('/:id/simulate-payment', orderController.handleSandboxWebhook);
router.post('/:id/cancel', orderController.cancelOrder);

module.exports = router;
