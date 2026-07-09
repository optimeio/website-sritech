const express = require('express');
const { protect, authorizeRoles } = require('../middleware/auth');
const returnController = require('../controllers/returnController');
const router = express.Router();

router.get('/', protect, returnController.getReturnRequests);
router.get('/:id', protect, returnController.getReturnRequestById);
router.post('/', protect, returnController.createReturnRequest);
router.patch('/:id', protect, authorizeRoles('admin'), returnController.updateReturnRequest);

module.exports = router;
