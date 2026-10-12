const express = require('express');
const router = express.Router();
const c = require('../controllers/customerController');

router.get('/profile', c.getProfile);
router.get('/lookup', c.lookup);
router.post('/register', c.register);
router.post('/login', c.login);
router.post('/logout', c.logout);
router.get('/my-orders', c.getMyOrders);
router.post('/forget', c.forget);

module.exports = router;
