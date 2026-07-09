const Offer = require('../models/Offer');
const asyncHandler = require('../middleware/asyncHandler');

exports.getOffers = asyncHandler(async (req, res) => {
  const offers = await Offer.find().sort({ priority: -1, createdAt: -1 });
  res.json(offers);
});

exports.getOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findOne({ isPublished: true, isActive: true }).sort({ priority: -1, createdAt: -1 });
  res.json(offer || null);
});

exports.upsertOffer = asyncHandler(async (req, res) => {
  const { _id, id, ...payload } = req.body || {};
  const offerId = _id || id;

  if (offerId) {
    const offer = await Offer.findByIdAndUpdate(offerId, payload, { new: true, runValidators: true });
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' });
    }
    return res.json(offer);
  }

  const offer = new Offer(payload);
  await offer.save();
  res.status(201).json(offer);
});

exports.updateOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!offer) {
    return res.status(404).json({ message: 'Offer not found.' });
  }
  res.json(offer);
});

exports.deleteOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findByIdAndDelete(req.params.id);
  if (!offer) {
    return res.status(404).json({ message: 'Offer not found.' });
  }
  res.json({ message: 'Offer deleted successfully.' });
});

exports.toggleOffer = asyncHandler(async (req, res) => {
  const offer = await Offer.findById(req.params.id);
  if (!offer) {
    return res.status(404).json({ message: 'Offer not found.' });
  }
  offer.isActive = !offer.isActive;
  await offer.save();
  res.json(offer);
});
