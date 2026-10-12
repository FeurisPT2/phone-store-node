const express = require('express');
const router = express.Router();

router.use('/products', require('./productRoutes'));
router.use('/cart', require('./cartRoutes'));
router.use('/customers', require('./customerRoutes'));
router.use('/orders', require('./orderRoutes'));
router.use('/admin', require('./adminRoutes'));

module.exports = router;
