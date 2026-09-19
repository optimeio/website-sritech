const express = require('express');
const { body } = require('express-validator');
const leadController = require('../controllers/leadController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', leadController.getLeads);

router.post(
  '/',
  [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('whatsapp').optional().trim(),
    body('phone').optional().trim(),
    (req, res, next) => {
      if (!req.body.whatsapp && !req.body.phone) {
        return res.status(400).json({ errors: [{ msg: 'Phone or WhatsApp number is required' }] });
      }
      next();
    }
  ],
  validateRequest,
  leadController.createLead
);

router.patch('/:id', leadController.updateLeadStatus);
router.put('/:id', leadController.updateLeadStatus);
router.delete('/:id', leadController.deleteLead);

module.exports = router;
