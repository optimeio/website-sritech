const express = require('express');
const { body } = require('express-validator');
const { protect, authorizeRoles } = require('../middleware/auth');
const userController = require('../controllers/userController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', protect, authorizeRoles('admin'), userController.getUsers);
router.get('/me', protect, userController.getMe);
router.put('/me', protect, userController.updateMe);
router.patch('/:id/status', protect, authorizeRoles('admin'), userController.toggleUserStatus);
router.delete('/:id', protect, authorizeRoles('admin'), userController.deleteUser);

router.post('/:id/cart',
  protect,
  [body('productId').notEmpty().withMessage('Product ID is required')],
  validateRequest,
  userController.addToCart
);
router.delete('/:id/cart/:productId', protect, userController.removeFromCart);
router.delete('/:id/cart', protect, userController.clearCart);
router.post('/:id/waitlist',
  protect,
  [body('productId').notEmpty().withMessage('Product ID is required')],
  validateRequest,
  userController.toggleWaitlist
);

module.exports = router;
