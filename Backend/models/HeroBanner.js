const mongoose = require('mongoose');

const heroBannerSchema = new mongoose.Schema({
  image: { type: String, required: true }, // Base64 or URL
  caption: { type: String, default: '' },
  order: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HeroBanner', heroBannerSchema);
