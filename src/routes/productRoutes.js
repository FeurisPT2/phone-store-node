const express = require('express');
const router = express.Router();
router.get('/', require('../controllers/productController').getProducts);
module.exports = router;
