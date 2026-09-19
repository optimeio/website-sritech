const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true },
  whatsapp: { type: String, required: true },
  phone: { type: String },
  email: { type: String },
  location: { type: String, default: '' },
  purpose: { type: String, default: 'Commercial' },
  stoveModel: { type: String, default: 'Rocket Stove' },
  fuelType: { type: String, default: 'Wood & Biomass' },
  capacity: { type: String, default: 'Commercial' },
  notes: { type: String, default: '' },
  adminNotes: { type: String, default: '' },
  status: {
    type: String,
    enum: ['New', 'Contacted', 'In Discussion', 'Converted', 'Closed'],
    default: 'New'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Lead', leadSchema);
