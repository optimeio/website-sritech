const express = require('express');
const { protect, authorizeRoles } = require('../middleware/auth');
const refundController = require('../controllers/refundController');
const router = express.Router();

router.get('/', protect, refundController.getRefundRequests);
router.get('/:id', protect, refundController.getRefundRequestById);
router.post('/', protect, refundController.createRefundRequest);
router.patch('/:id', protect, authorizeRoles('admin'), refundController.updateRefundRequest);

module.exports = router;
