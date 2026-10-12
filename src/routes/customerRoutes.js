const express = require('express');
const router = express.Router();
const c = require('../controllers/customerController');
router.get('/profile', c.getProfile);
router.get('/lookup', c.lookup);
router.post('/forget', c.forget);
module.exports = router;
