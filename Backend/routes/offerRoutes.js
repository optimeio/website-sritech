const express = require('express');
const { body } = require('express-validator');
const offerController = require('../controllers/offerController');
const validateRequest = require('../middleware/validateRequest');

const router = express.Router();

router.get('/', offerController.getOffers);
router.get('/active', offerController.getOffer);
router.post('/',
  [
    body('title').notEmpty().withMessage('Offer title is required'),
    body('description').notEmpty().withMessage('Offer description is required'),
    body('code').notEmpty().withMessage('Offer code is required')
  ],
  validateRequest,
  offerController.upsertOffer
);
router.put('/:id', offerController.updateOffer);
router.delete('/:id', offerController.deleteOffer);
router.patch('/:id/toggle', offerController.toggleOffer);

module.exports = router;
