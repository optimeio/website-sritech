const RefundRequest = require('../models/RefundRequest');
const Order = require('../models/Order');
const ReturnRequest = require('../models/ReturnRequest');
const asyncHandler = require('../middleware/asyncHandler');
const { sendEmail, templates } = require('../utils/emailService');

const generateRefundId = () => `REF-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;

const buildTimelineEntry = (status, note = '') => ({ status, note, timestamp: new Date() });

exports.getRefundRequests = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.query.customerId) filter.customerId = req.query.customerId;
  if (req.query.orderId) filter.orderId = req.query.orderId;
  const refunds = await RefundRequest.find(filter).sort({ createdAt: -1 });
  res.json(refunds);
});

exports.getRefundRequestById = asyncHandler(async (req, res) => {
  const refundRequest = await RefundRequest.findOne({
    $or: [
      { _id: req.params.id },
      { refundId: req.params.id }
    ]
  });
  if (!refundRequest) return res.status(404).json({ message: 'Refund request not found.' });
  res.json(refundRequest);
});

exports.createRefundRequest = asyncHandler(async (req, res) => {
  const { orderId, refundAmount, refundMethod, returnId, description, images } = req.body;
  if (!orderId || !refundAmount || !refundMethod) {
    return res.status(400).json({ message: 'orderId, refundAmount, and refundMethod are required.' });
  }

  const order = await Order.findById(orderId);
  if (!order) return res.status(404).json({ message: 'Order not found.' });
  if (order.status !== 'Delivered') {
    return res.status(400).json({ message: 'Refund requests are only allowed after delivery.' });
  }

  const refundRequest = new RefundRequest({
    refundId: generateRefundId(),
    orderId: order._id,
    customerId: req.user._id,
    refundAmount,
    refundMethod,
    status: 'Requested',
    timelineHistory: [buildTimelineEntry('Requested', 'Customer submitted refund request.')],
    returnId: returnId || null,
    description: description || '',
    images: Array.isArray(images) ? images : []
  });

  await refundRequest.save();

  const customerOrderUrl = `${process.env.CLIENT_URL || 'https://thesritech.com'}/orders/${order.orderId}`;
  const adminAddress = process.env.OWNER_EMAIL || process.env.SUPPORT_EMAIL;
  const adminUrl = process.env.ADMIN_URL || `${process.env.CLIENT_URL || 'https://thesritech.com'}/admin/refunds`;

  if (order && order.customerEmail) {
    sendEmail(
      order.customerEmail,
      `Refund Request Received - #${order.orderId}`,
      templates.refundStatusUpdate({
        order,
        refundRequest,
        statusTitle: 'Refund Requested',
        statusNote: 'We have received your refund request and our team will review it shortly.',
        viewOrderUrl: customerOrderUrl
      }),
      {
        template: 'refundStatusUpdate',
        payload: { orderId: order.orderId, refundId: refundRequest.refundId, status: refundRequest.status }
      }
    ).catch(err => console.error('Refund request email failed:', err.message));
  }

  if (adminAddress && order) {
    sendEmail(
      adminAddress,
      `Refund Request Submitted - #${order.orderId}`,
      templates.adminRefundNotification({ order, refundRequest, adminUrl }),
      {
        template: 'adminRefundNotification',
        payload: { orderId: order.orderId, refundId: refundRequest.refundId }
      }
    ).catch(err => console.error('Admin refund notification failed:', err.message));
  }

  res.status(201).json(refundRequest);
});

exports.updateRefundRequest = asyncHandler(async (req, res) => {
  const refundRequest = await RefundRequest.findById(req.params.id);
  if (!refundRequest) return res.status(404).json({ message: 'Refund request not found.' });

  const updates = req.body;
  const oldStatus = refundRequest.status;
  if (updates.status && updates.status !== refundRequest.status) {
    refundRequest.timelineHistory.push(buildTimelineEntry(updates.status, updates.note || `Status updated to ${updates.status}`));
  }

  Object.assign(refundRequest, updates);
  await refundRequest.save();

  if (updates.status && updates.status !== oldStatus) {
    const order = await Order.findById(refundRequest.orderId);
    if (order && order.customerEmail) {
      const customerOrderUrl = `${process.env.CLIENT_URL || 'https://thesritech.com'}/orders/${order.orderId}`;
      const statusTitle = `Refund ${refundRequest.status}`;
      const statusNote = updates.note || `Your refund status is now ${refundRequest.status}.`;

      sendEmail(
        order.customerEmail,
        `Refund Update - #${order.orderId}`,
        templates.refundStatusUpdate({ order, refundRequest, statusTitle, statusNote, viewOrderUrl: customerOrderUrl }),
        {
          template: 'refundStatusUpdate',
          payload: { orderId: order.orderId, refundId: refundRequest.refundId, status: refundRequest.status }
        }
      ).catch(err => console.error('Refund status update email failed:', err.message));
    }
  }

  res.json(refundRequest);
});
