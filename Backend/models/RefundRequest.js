const mongoose = require('../mongoose');

const refundTimelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const refundRequestSchema = new mongoose.Schema({
  refundId: { type: String, required: true, unique: true },
  returnId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReturnRequest' },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  refundAmount: { type: Number, required: true, default: 0 },
  refundMethod: { type: String, enum: ['Original Payment Method', 'Wallet Credit', 'Bank Transfer'], default: 'Original Payment Method' },
  status: { type: String, enum: ['Requested', 'Under Review', 'Approved', 'Refund Initiated', 'Refund Completed', 'Rejected'], default: 'Requested' },
  timelineHistory: { type: [refundTimelineSchema], default: [] },
  transactionReference: { type: String, default: '' },
  images: { type: [String], default: [] },
  adminNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

refundRequestSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('RefundRequest', refundRequestSchema);
