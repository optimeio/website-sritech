const Invoice = require('../models/Invoice');
const Order = require('../models/Order');
const asyncHandler = require('../middleware/asyncHandler');

const generateInvoiceNumber = () => `INV-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

exports.getInvoices = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.customerId) filter.customerId = req.query.customerId;
  if (req.query.orderId) filter.orderId = req.query.orderId;
  const invoices = await Invoice.find(filter).sort({ invoiceDate: -1 });
  res.json(invoices);
});

exports.getInvoiceById = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findOne({
    $or: [
      { _id: req.params.id },
      { invoiceNumber: req.params.id }
    ]
  });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
  res.json(invoice);
});

exports.createInvoiceForOrder = asyncHandler(async (req, res) => {
  const { orderId, customerId, transactionId, paymentMethod, paymentStatus } = req.body;
  if (!orderId || !customerId) {
    return res.status(400).json({ message: 'orderId and customerId are required.' });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  const invoiceNumber = generateInvoiceNumber();
  const items = Array.isArray(order.items) ? order.items.map(item => ({
    product: item.product,
    sku: item.sku || '',
    name: item.name || 'Product',
    image: item.image || '',
    quantity: item.quantity,
    unitPrice: item.price,
    discount: item.discount || 0,
    tax: item.tax || 0,
    totalPrice: item.totalPrice
  })) : [];

  const invoiceData = {
    invoiceNumber,
    orderId: order._id,
    customerId: order.customerId,
    transactionId: transactionId || order.paymentId || '',
    invoiceDate: new Date(),
    billingAddress: order.billingAddress || order.shippingAddress || {},
    shippingAddress: order.shippingAddress || {},
    paymentMethod: paymentMethod || order.paymentMethod || 'Razorpay',
    paymentStatus: paymentStatus || order.paymentStatus || 'Pending',
    items,
    subtotal: order.subtotal || 0,
    discount: order.discount || 0,
    couponDiscount: Number(order.couponAmount || 0) || 0,
    shippingCharges: order.shippingCost || 0,
    tax: order.tax || 0,
    grandTotal: order.grandTotal || 0,
    pdfPath: ''
  };

  const invoice = new Invoice(invoiceData);
  await invoice.save();

  res.status(201).json(invoice);
});

exports.updateInvoice = asyncHandler(async (req, res) => {
  const invoice = await Invoice.findByIdAndUpdate(req.params.id, req.body, { new: true });
  if (!invoice) return res.status(404).json({ message: 'Invoice not found.' });
  res.json(invoice);
});
