const express = require('express');
const { protect, protectAdmin, authorizeRoles } = require('../middleware/auth');
const refundController = require('../controllers/refundController');
const router = express.Router();

router.get('/', protectAdmin, refundController.getRefundRequests);
router.get('/:id', protect, refundController.getRefundRequestById);
router.post('/', protect, refundController.createRefundRequest);
router.patch('/:id', protect, authorizeRoles('admin'), refundController.updateRefundRequest);

module.exports = router;
