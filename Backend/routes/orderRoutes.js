const express = require('express');
const { body } = require('express-validator');
const orderController = require('../controllers/orderController');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.get('/', orderController.getOrders);
router.get('/me', protect, orderController.getOrdersForUser);
router.get('/:id', orderController.getOrderById);
router.post('/',
  [
    body('customerName').notEmpty().withMessage('Customer name is required'),
    body('items').isArray({ min: 1 }).withMessage('At least one item is required'),
    body('totalAmount').notEmpty().withMessage('Total amount is required')
  ],
  validateRequest,
  orderController.createOrder
);
router.patch('/:id', orderController.updateOrderStatus);

module.exports = router;
