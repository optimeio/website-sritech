const express = require('express');
const { body } = require('express-validator');
const { protectAdmin } = require('../middleware/auth');
const couponController = require('../controllers/couponController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', couponController.getCoupons);
router.post('/',
  protectAdmin,
  [
    body('code').notEmpty().withMessage('Coupon code is required'),
    body('discountValue').isNumeric().withMessage('Discount value is required'),
    body('expiryDate').isISO8601().withMessage('Valid expiry date is required')
  ],
  validateRequest,
  couponController.createCoupon
);
router.patch('/:id', protectAdmin, couponController.updateCoupon);
router.delete('/:id', protectAdmin, couponController.deleteCoupon);

module.exports = router;
