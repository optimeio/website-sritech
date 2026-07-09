const mongoose = require('../mongoose');

const offerSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  code: { type: String, required: true },
  type: { type: String, enum: ['product', 'category', 'storewide'], default: 'product' },
  targetValue: { type: String, default: '' },
  discountType: { type: String, enum: ['percentage', 'fixed', 'free-shipping'], default: 'percentage' },
  discountValue: { type: Number, default: 0 },
  priority: { type: Number, default: 0 },
  poster: { type: String },
  images: [{ type: String }],
  productName: { type: String },
  category: { type: String },
  condition: { type: String, default: 'New' },
  badgeLabel: { type: String, default: 'Featured Offer' },
  originalPrice: { type: Number, default: 0 },
  offerPrice: { type: Number, default: 0 },
  mrpIllusion: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  stockUnits: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  startDate: { type: String },
  endDate: { type: String },
  comboContents: { type: String },
  isActive: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Offer', offerSchema);
