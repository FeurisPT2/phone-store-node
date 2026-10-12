const express = require('express');
const router = express.Router();
const c = require('../controllers/cartController');
router.get('/', c.getCart);
router.post('/add', c.addToCart);
module.exports = router;
