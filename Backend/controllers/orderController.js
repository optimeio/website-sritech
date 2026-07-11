const Order = require('../models/Order');
const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const Invoice = require('../models/Invoice');
const asyncHandler = require('../middleware/asyncHandler');
const emailService = require('../utils/emailService');
const { buildInvoicePayload, createInvoicePdf } = require('../utils/invoiceService');

const buildTimelineEntry = ({ status, note = '', location = '' }) => ({
  status,
  note,
  location,
  timestamp: new Date()
});

const normalizeOrderStatus = (status = '') => {
  const normalized = String(status || '').trim().toLowerCase();
  if (!normalized) return '';

  const statusMap = {
    'payment successful': 'Payment Successful',
    'order confirmed': 'Order Confirmed',
    'processing': 'Processing',
    'packed': 'Packed',
    'shipped': 'Shipped',
    'in transit': 'In Transit',
    'out for delivery': 'Out For Delivery',
    'out-for-delivery': 'Out For Delivery',
    'delivered': 'Delivered',
    'cancelled': 'Cancelled',
    'canceled': 'Cancelled',
    'return requested': 'Return Requested',
    'return approved': 'Return Approved',
    'return rejected': 'Return Rejected',
    'returned': 'Returned',
    'refund initiated': 'Refund Initiated',
    'refund completed': 'Refund Completed',
    'payment pending': 'Payment Pending'
  };

  return statusMap[normalized] || String(status || '').trim();
};

exports.getOrders = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.customerId) {
    filter.customerId = req.query.customerId;
  }
  if (req.query.status) {
    filter.status = req.query.status;
  }
  if (req.query.search) {
    const search = req.query.search.trim();
    filter.$or = [
      { orderId: { $regex: search, $options: 'i' } },
      { invoiceNumber: { $regex: search, $options: 'i' } },
      { customerName: { $regex: search, $options: 'i' } },
      { 'items.name': { $regex: search, $options: 'i' } }
    ];
  }
  const orders = await Order.find(filter).sort({ createdAt: -1 });
  res.json(orders);
});

exports.getOrdersForUser = asyncHandler(async (req, res) => {
  const orders = await Order.find({ customerId: req.user._id }).sort({ createdAt: -1 });
  res.json(orders);
});

exports.createOrder = asyncHandler(async (req, res) => {
  const orderData = { ...req.body };

  if (orderData.customerEmail) {
    const user = await User.findOne({ email: orderData.customerEmail });
    if (user && user.status === 'blocked') {
      return res.status(403).json({ message: 'Your account has been blocked. You cannot place orders.' });
    }
    if (user && !orderData.customerId) {
      orderData.customerId = user._id;
    }
  }

  if (!orderData.orderId) {
    orderData.orderId = 'SRI-' + Math.floor(Math.random() * 1000000).toString().padStart(6, '0');
  }

  if (!orderData.invoiceNumber) {
    orderData.invoiceNumber = `INV-${Date.now()}`;
  }

  orderData.subtotal = Number(orderData.subtotal || 0);
  orderData.discount = Number(orderData.discount || 0);
  orderData.shippingCost = Number(orderData.shippingCost || 0);
  orderData.tax = Number(orderData.tax || 0);
  orderData.grandTotal = Number(orderData.grandTotal || orderData.totalAmount || 0);
  orderData.paymentMethod = orderData.paymentMethod || 'Razorpay';
  orderData.paymentStatus = orderData.paymentStatus || 'Completed';
  orderData.status = normalizeOrderStatus(orderData.status || (orderData.paymentStatus === 'Completed' ? 'Order Confirmed' : 'Payment Pending'));

  orderData.items = Array.isArray(orderData.items) ? orderData.items.map(item => ({
    product: item.product,
    sku: item.sku || item.product || '',
    variant: item.variant || '',
    name: item.name || item.product || 'Product',
    quantity: Number(item.quantity || 1),
    price: Number(item.price || 0),
    totalPrice: Number(item.totalPrice || (Number(item.quantity || 1) * Number(item.price || 0)))
  })) : [];

  if (!orderData.subtotal) {
    orderData.subtotal = orderData.items.reduce((sum, item) => sum + item.totalPrice, 0);
  }
  if (!orderData.grandTotal) {
    orderData.grandTotal = orderData.subtotal - orderData.discount + orderData.shippingCost + orderData.tax;
  }

  orderData.timelineHistory = orderData.timelineHistory || [];
  if (orderData.paymentStatus === 'Completed') {
    orderData.timelineHistory.push(buildTimelineEntry({ status: 'Payment Successful', note: 'Payment verified successfully.' }));
    if (orderData.status === 'Order Confirmed') {
      orderData.timelineHistory.push(buildTimelineEntry({ status: 'Order Confirmed', note: 'Your order has been confirmed.' }));
    }
  }

  const order = new Order(orderData);
  const savedOrder = await order.save();

  let invoice = null;
  try {
    invoice = await Invoice.findOne({ orderId: savedOrder._id });
    if (!invoice) {
      const invoicePayload = buildInvoicePayload(savedOrder);
      const pdfPath = await createInvoicePdf(invoicePayload, savedOrder.customerName);
      invoice = new Invoice({ ...invoicePayload, pdfPath });
      await invoice.save();
      savedOrder.invoicePdfPath = pdfPath;
      await savedOrder.save();
    }
  } catch (err) {
    console.error('Invoice generation failed:', err.message);
  }

  await new ActivityLog({ action: 'Order Placed', details: `Order #${savedOrder.orderId} by ${savedOrder.customerName}` }).save();

  const customerOrderUrl = `${process.env.CLIENT_URL || 'https://thesritech.com'}/orders/${savedOrder.orderId}`;

  if (orderData.customerEmail) {
    emailService.sendEmail(orderData.customerEmail, `Order Confirmation - #${savedOrder.orderId}`, emailService.templates.orderConfirmation({
      order: savedOrder,
      viewOrderUrl: customerOrderUrl,
      invoiceUrl: savedOrder.invoicePdfPath || ''
    }), {
      template: 'orderConfirmation',
      payload: { orderId: savedOrder.orderId, customerEmail: savedOrder.customerEmail, invoiceUrl: savedOrder.invoicePdfPath || '' }
    }).catch(err => console.error('Order confirmation email failed:', err.message));
  }

  if (process.env.OWNER_EMAIL) {
    const adminUrl = process.env.ADMIN_URL || `${process.env.CLIENT_URL || 'https://thesritech.com'}/admin`;
    emailService.sendEmail(process.env.OWNER_EMAIL, `NEW ORDER RECEIVED - #${savedOrder.orderId}`, emailService.templates.adminOrderNotification({
      order: savedOrder,
      adminUrl,
      note: 'A new order has been placed and needs your attention.',
      invoiceUrl: savedOrder.invoicePdfPath || ''
    }), {
      template: 'adminOrderNotification',
      payload: { orderId: savedOrder.orderId, invoiceUrl: savedOrder.invoicePdfPath || '' }
    }).catch(err => console.error('Owner notification email failed:', err.message));
  }

  res.status(201).json(savedOrder);
});

exports.getOrderById = asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    $or: [
      { _id: req.params.id },
      { orderId: req.params.id },
      { invoiceNumber: req.params.id }
    ]
  });

  if (!order) return res.status(404).json({ message: 'Order not found.' });

  const isAdmin = req.user?.role === 'admin';
  const isOrderOwner = req.user && order.customerId && String(order.customerId) === String(req.user._id);
  if (!isAdmin && !isOrderOwner) {
    return res.status(403).json({ message: 'Forbidden. You are not authorized to view this order.' });
  }

  res.json(order);
});

exports.updateOrderStatus = asyncHandler(async (req, res) => {
  const updatePayload = { ...req.body };
  const existing = await Order.findById(req.params.id);
  if (!existing) return res.status(404).json({ message: 'Order not found.' });

  let statusChanged = false;
  let statusNote = '';
  let location = updatePayload.currentLocation || existing.currentLocation || '';

  if (updatePayload.status) {
    const normalizedStatus = normalizeOrderStatus(updatePayload.status);
    updatePayload.status = normalizedStatus;

    if (existing.status !== normalizedStatus) {
      statusChanged = true;
      statusNote = updatePayload.note || `Status updated to ${normalizedStatus}`;

      if (normalizedStatus === 'Shipped') {
        statusNote = `Order shipped via ${updatePayload.courierPartner || existing.courierPartner || 'your courier partner'}.`;
        if (!updatePayload.shipmentDate && !existing.shipmentDate) {
          updatePayload.shipmentDate = new Date();
        }
        if (updatePayload.trackingUrl && !updatePayload.trackingUrl.startsWith('http')) {
          updatePayload.trackingUrl = `https://${updatePayload.trackingUrl}`;
        }
      }

      existing.timelineHistory.push(buildTimelineEntry({
        status: normalizedStatus,
        note: statusNote,
        location
      }));
    }
  }

  if (updatePayload.trackingUrl && !updatePayload.trackingUrl.startsWith('http')) {
    updatePayload.trackingUrl = `https://${updatePayload.trackingUrl}`;
  }

  updatePayload.timelineHistory = existing.timelineHistory;
  const order = await Order.findByIdAndUpdate(req.params.id, updatePayload, { new: true });
  if (!order) return res.status(404).json({ message: 'Order not found.' });

  await new ActivityLog({ action: 'Order Status Updated', details: `Order #${order.orderId} status set to ${order.status}` }).save();

  const emailStatuses = new Set([
    'Payment Successful',
    'Order Confirmed',
    'Processing',
    'Packed',
    'Shipped',
    'Out For Delivery',
    'Delivered',
    'Cancelled',
    'Return Requested',
    'Return Approved',
    'Return Rejected',
    'Refund Initiated',
    'Refund Completed'
  ]);

  if (statusChanged && order.customerEmail && emailStatuses.has(order.status)) {
    const customerOrderUrl = `${process.env.CLIENT_URL || 'https://thesritech.com'}/orders/${order.orderId}`;
    const invoiceUrl = order.invoicePdfPath || '';
    let statusTitle = 'Order Update';

    switch (order.status) {
      case 'Payment Successful':
        statusTitle = 'Payment Received';
        break;
      case 'Order Confirmed':
        statusTitle = 'Order Confirmed';
        break;
      case 'Processing':
        statusTitle = 'Order Processing';
        break;
      case 'Packed':
        statusTitle = 'Order Packed';
        break;
      case 'Shipped':
        statusTitle = 'Order Shipped';
        break;
      case 'Out For Delivery':
        statusTitle = 'Out for Delivery';
        break;
      case 'Delivered':
        statusTitle = 'Order Delivered';
        break;
      case 'Cancelled':
        statusTitle = 'Order Cancelled';
        break;
      case 'Return Requested':
        statusTitle = 'Return Request Received';
        break;
      case 'Return Approved':
        statusTitle = 'Return Approved';
        break;
      case 'Return Rejected':
        statusTitle = 'Return Rejected';
        break;
      case 'Refund Initiated':
        statusTitle = 'Refund Initiated';
        break;
      case 'Refund Completed':
        statusTitle = 'Refund Completed';
        break;
      default:
        statusTitle = 'Order Update';
    }

    emailService.sendEmail(order.customerEmail, `Order Update - #${order.orderId}`, emailService.templates.orderStatusUpdate({
      order,
      statusTitle,
      statusNote,
      viewOrderUrl: customerOrderUrl,
      trackingUrl: order.trackingUrl,
      invoiceUrl
    }), {
      template: 'orderStatusUpdate',
      payload: { orderId: order.orderId, status: order.status }
    }).catch(err => console.error('Order status update email failed:', err.message));
  }

  res.json(order);
});
