const express = require('express');
const { protect, protectAdmin, authorizeRoles } = require('../middleware/auth');
const returnController = require('../controllers/returnController');
const router = express.Router();

router.get('/', protectAdmin, returnController.getReturnRequests);
router.get('/:id', protect, returnController.getReturnRequestById);
router.post('/', protect, returnController.createReturnRequest);
router.patch('/:id', protect, authorizeRoles('admin'), returnController.updateReturnRequest);

module.exports = router;
