const mongoose = require('../mongoose');

const emailLogSchema = new mongoose.Schema({
  recipient: { type: String, required: true },
  subject: { type: String, required: true },
  template: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed', 'retrying'], default: 'pending' },
  attempts: { type: Number, default: 0 },
  error: { type: String, default: '' },
  messageId: { type: String, default: '' },
  sentAt: { type: Date },
  lastAttemptAt: { type: Date, default: Date.now },
  payload: { type: Object, default: {} }
}, { timestamps: true });

module.exports = mongoose.model('EmailLog', emailLogSchema);
