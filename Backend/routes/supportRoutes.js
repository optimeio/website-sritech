const express = require('express');
const { body } = require('express-validator');
const { protectAdmin } = require('../middleware/auth');
const supportController = require('../controllers/supportController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', protectAdmin, supportController.getSupportQueries);
router.post('/',
  [
    body('customerName').notEmpty().withMessage('Name is required'),
    body('email').isEmail().withMessage('Valid email is required'),
    body('subject').notEmpty().withMessage('Subject is required'),
    body('message').notEmpty().withMessage('Message is required')
  ],
  validateRequest,
  supportController.createSupportQuery
);
router.post('/:id/respond',
  protectAdmin,
  [
    body('response').notEmpty().withMessage('Response is required')
  ],
  validateRequest,
  supportController.respondToSupportQuery
);

module.exports = router;
