const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  sku: { type: String, required: false, sparse: true },
  slug: { type: String, required: false, sparse: true },
  name: { type: String, required: true },
  price: { type: String, required: true },
  originalPrice: { type: Number, default: 0 },
  mrp: { type: Number, default: 0 },
  category: { type: String, required: true },
  description: { type: String, default: '' },
  specifications: { type: String, default: '' },
  howToUse: { type: String, default: '' },
  burnerSize: { type: String, default: '' },
  stoveWeight: { type: String, default: '' },
  dimensions: { type: String, default: '' },
  material: { type: String, default: '' },
  usage: { type: String, default: '' },
  fuelType: { type: String, default: '' },
  cookingSurface: { type: String, default: '' },
  cookingCapacity: { type: String, default: '' },
  stock: { type: Number, default: 0 },
  icon: { type: String, default: 'fa-box' },
  isNewArrival: { type: Boolean, default: false },
  images: [{ type: String }], // Array of base64 strings or URLs
  video: { type: String, default: '' }, // Video URL or base64
  shippingCharge: { type: Number, default: 0 },
  gstPercent: { type: Number, default: 0 },
  discountPercent: { type: Number, default: 0 },
  courierOptions: [
    {
      name: { type: String },
      price: { type: Number, default: 0 }
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Product', productSchema);
