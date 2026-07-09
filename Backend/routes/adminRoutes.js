const express = require('express');
const adminController = require('../controllers/adminController');
const { protectAdmin } = require('../middleware/auth');

const router = express.Router();
router.post('/login', adminController.adminLogin);
router.get('/verify', protectAdmin, adminController.verifyAdmin);

module.exports = router;
