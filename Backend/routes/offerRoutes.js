const express = require('express');
const { body } = require('express-validator');
const { protectAdmin } = require('../middleware/auth');
const offerController = require('../controllers/offerController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', offerController.getOffers);
router.get('/active', offerController.getOffer);
router.post('/',
  protectAdmin,
  [
    body('title').notEmpty().withMessage('Offer title is required'),
    body('description').notEmpty().withMessage('Offer description is required'),
    body('code').notEmpty().withMessage('Offer code is required')
  ],
  validateRequest,
  offerController.upsertOffer
);
router.put('/:id', protectAdmin, offerController.updateOffer);
router.delete('/:id', protectAdmin, offerController.deleteOffer);
router.patch('/:id/toggle', protectAdmin, offerController.toggleOffer);

module.exports = router;
