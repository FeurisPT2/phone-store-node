const express = require('express');
const router = express.Router();
const c = require('../controllers/cartController');

router.get('/', c.getCart);
router.post('/add', c.addToCart);
router.post('/update', c.updateCartItem);
router.post('/remove', c.removeFromCart);
router.post('/clear', c.clearCart);

module.exports = router;
