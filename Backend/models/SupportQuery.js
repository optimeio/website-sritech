const mongoose = require('mongoose');

const supportQuerySchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  email: { type: String, required: true },
  subject: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['Open', 'In Progress', 'Resolved', 'Closed', 'Responded'], default: 'Open' },
  adminResponse: { type: String, default: '' },
  respondedAt: { type: Date },
  isRead: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('SupportQuery', supportQuerySchema);
