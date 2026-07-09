const mongoose = require('../mongoose');

const addressSchema = new mongoose.Schema({
  name: { type: String },
  phone: { type: String },
  addressLine1: { type: String },
  addressLine2: { type: String },
  city: { type: String },
  state: { type: String },
  zipCode: { type: String },
  country: { type: String, default: 'India' }
}, { _id: false });

const timelineSchema = new mongoose.Schema({
  status: { type: String, required: true },
  note: { type: String, default: '' },
  location: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now }
}, { _id: false });

const orderItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
  sku: { type: String },
  variant: { type: String },
  name: { type: String },
  quantity: { type: Number, required: true, default: 1 },
  price: { type: Number, required: true, default: 0 },
  totalPrice: { type: Number, required: true, default: 0 }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  invoiceNumber: { type: String, required: true, unique: true },
  invoicePdfPath: { type: String, default: '' },
  customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  customerName: { type: String, required: true },
  customerEmail: { type: String, required: true },
  customerPhone: { type: String },
  shippingAddress: addressSchema,
  billingAddress: addressSchema,
  items: [orderItemSchema],
  subtotal: { type: Number, default: 0 },
  discount: { type: Number, default: 0 },
  coupon: { type: String, default: '' },
  shippingCost: { type: Number, default: 0 },
  tax: { type: Number, default: 0 },
  grandTotal: { type: Number, default: 0 },
  paymentMethod: { type: String, default: 'Razorpay' },
  paymentStatus: { type: String, enum: ['Pending', 'Completed', 'Failed', 'Refund Initiated', 'Refund Completed'], default: 'Pending' },
  status: { type: String, enum: ['Payment Pending', 'Payment Successful', 'Order Confirmed', 'Processing', 'Packed', 'Shipped', 'In Transit', 'Out For Delivery', 'Delivered', 'Cancelled', 'Return Requested', 'Return Approved', 'Return Rejected', 'Returned', 'Refund Initiated', 'Refund Completed'], default: 'Payment Pending' },
  trackingNumber: { type: String, default: '' },
  courierPartner: { type: String, default: '' },
  trackingUrl: { type: String, default: '' },
  shipmentDate: { type: Date },
  currentLocation: { type: String, default: '' },
  estimatedDelivery: { type: Date },
  deliveryPersonName: { type: String, default: '' },
  deliveryPhone: { type: String, default: '' },
  deliveryOtp: { type: String, default: '' },
  timelineHistory: { type: [timelineSchema], default: [] },
  orderNotes: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

orderSchema.pre('save', function () {
  this.updatedAt = new Date();
});

module.exports = mongoose.model('Order', orderSchema);
