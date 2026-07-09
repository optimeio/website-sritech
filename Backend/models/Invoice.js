const mongoose = require('../mongoose');

const invoiceItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku: { type: String, default: '' },
  name: { type: String, required: true },
  image: { type: String, default: '' },
  quantity: { type: Number, required: true, default: 1 },
  unitPrice: { type: Number, required: true, default: 0 },
  discount: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  totalPrice: { type: Number, required: true, default: 0 }
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  transactionId: { type: String, default: '' },
  invoiceDate: { type: Date, default: Date.now },
  billingAddress: { type: Object, default: {} },
  shippingAddress: { type: Object, default: {} },
  paymentMethod: { type: String, default: 'Razorpay' },
  paymentStatus: { type: String, default: 'Pending' },
  items: { type: [invoiceItemSchema], default: [] },
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  couponDiscount: { type: Number, default: 0 },
  shippingCharges: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  pdfPath: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

invoiceSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Invoice', invoiceSchema);
