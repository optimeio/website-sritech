const express = require('express');
const { protectAdmin } = require('../middleware/auth');
const logController = require('../controllers/logController');

const router = express.Router();
router.get('/', protectAdmin, logController.getLogs);

module.exports = router;
