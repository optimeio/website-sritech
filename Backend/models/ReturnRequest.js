const mongoose = require('../mongoose');

const returnRequestSchema = new mongoose.Schema({
  returnId: { type: String, required: true, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  quantity: { type: Number, required: true, default: 1 },
  reason: { type: String, required: true },
  description: { type: String, default: '' },
  images: { type: [String], default: [] },
  status: { type: String, enum: ['Requested', 'Under Review', 'Approved', 'Rejected', 'Pickup Scheduled', 'Received', 'Completed'], default: 'Requested' },
  adminNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

returnRequestSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('ReturnRequest', returnRequestSchema);
