const express = require('express');
const { body } = require('express-validator');
const authController = require('../controllers/authController');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/auth');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

router.post('/signup',
  [
    body('name').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
  ],
  validateRequest,
  authController.signup
);

router.post('/verify-otp',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('otp').isLength({ min: 6, max: 6 }).withMessage('OTP must be 6 digits')
  ],
  validateRequest,
  authController.verifyOtp
);

router.post('/resend-otp',
  [
    body('email').isEmail().withMessage('Valid email is required')
  ],
  validateRequest,
  authController.resendOtp
);

router.post('/test-email', asyncHandler(async (req, res) => {
  const recipient = req.body.to || process.env.EMAIL_USER;
  if (!recipient) {
    return res.status(400).json({ success: false, error: 'Recipient email is required.' });
  }

  console.log('[test-email] sending test email', recipient);
  const info = await sendEmail(recipient, 'SMTP Test', '<p>This is a test email from SriTech.</p>', {
    template: 'custom',
    payload: { recipient }
  });

  return res.json({ success: true, message: 'Test email sent successfully.', info });
}));

router.post('/login',
  [
    body('email').isEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
  ],
  validateRequest,
  authController.login
);

router.get('/me', protect, authController.getMe);
router.post('/forgot-password', authController.requestPasswordReset);
router.post('/reset-password', authController.resetPassword);

module.exports = router;
