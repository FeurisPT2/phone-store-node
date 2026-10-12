const express = require('express');
const router = express.Router();
router.post('/checkout', require('../controllers/orderController').createOrder);
module.exports = router;
