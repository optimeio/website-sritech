const ReturnRequest = require('../models/ReturnRequest');
const Order = require('../models/Order');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail, templates } = require('../utils/emailService');

const generateReturnId = () => `RET-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

exports.getReturnRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.customerId) filter.customerId = req.query.customerId;
  if (req.query.orderId) filter.orderId = req.query.orderId;
  const returns = await ReturnRequest.find(filter).sort({ createdAt: -1 });
  res.json(returns);
});

exports.getReturnRequestById = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findOne({
    $or: [
      { _id: req.params.id },
      { returnId: req.params.id }
    ]
  });
  if (!returnRequest) return res.status(404).json({ message: 'Return request not found.' });
  res.json(returnRequest);
});

exports.createReturnRequest = asyncHandler(async (req, res) => {
  const { orderId, productId, quantity, reason, description, images } = req.body;
  if (!orderId || !productId || !quantity || !reason) {
    return res.status(400).json({ message: 'orderId, productId, quantity, and reason are required.' });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.status !== 'Delivered') {
    return res.status(400).json({ message: 'Return requests are only allowed after delivery.' });
  }

  const returnRequest = new ReturnRequest({
    returnId: generateReturnId(),
    orderId: order._id,
    customerId: req.user._id,
    productId,
    quantity,
    reason,
    description: description || '',
    images: Array.isArray(images) ? images : [],
    status: 'Requested'
  });

  await returnRequest.save();

  const customerOrderUrl = `${process.env.CLIENT_URL || 'https://thesritech.com'}/orders/${order.orderId}`;
  const adminAddress = process.env.OWNER_EMAIL || process.env.SUPPORT_EMAIL;
  const adminUrl = process.env.ADMIN_URL || `${process.env.CLIENT_URL || 'https://thesritech.com'}/admin/returns`;

  if (order.customerEmail) {
    sendEmail(
      order.customerEmail,
      `Return Request Received - #${order.orderId}`,
      templates.returnRequest({ order, returnRequest, viewOrderUrl: customerOrderUrl }),
      {
        template: 'returnRequest',
        payload: { orderId: order.orderId, returnId: returnRequest.returnId }
      }
    ).catch(err => console.error('Return request email failed:', err.message));
  }

  if (adminAddress) {
    sendEmail(
      adminAddress,
      `Return Request Submitted - #${order.orderId}`,
      templates.adminReturnNotification({ order, returnRequest, adminUrl }),
      {
        template: 'adminReturnNotification',
        payload: { orderId: order.orderId, returnId: returnRequest.returnId }
      }
    ).catch(err => console.error('Admin return notification failed:', err.message));
  }

  res.status(201).json(returnRequest);
});

exports.updateReturnRequest = asyncHandler(async (req, res) => {
  const returnRequest = await ReturnRequest.findById(req.params.id);
  if (!returnRequest) return res.status(404).json({ message: 'Return request not found.' });

  const oldStatus = returnRequest.status;
  const updates = req.body;
  Object.assign(returnRequest, updates);
  await returnRequest.save();

  if (updates.status && updates.status !== oldStatus) {
    const order = await Order.findById(returnRequest.orderId);
    if (order && order.customerEmail) {
      const customerOrderUrl = `${process.env.CLIENT_URL || 'https://thesritech.com'}/orders/${order.orderId}`;
      const statusTitle = `Return ${returnRequest.status}`;
      const statusNote = updates.note || `Return status updated to ${returnRequest.status}`;

      sendEmail(
        order.customerEmail,
        `Return Update - #${order.orderId}`,
        templates.returnStatusUpdate({ order, returnRequest, statusTitle, statusNote, viewOrderUrl: customerOrderUrl }),
        {
          template: 'returnStatusUpdate',
          payload: { orderId: order.orderId, returnId: returnRequest.returnId, status: returnRequest.status }
        }
      ).catch(err => console.error('Return status update email failed:', err.message));
    }
  }

  res.json(returnRequest);
});
