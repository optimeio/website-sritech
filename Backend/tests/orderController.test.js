const test = require('node:test');
const assert = require('node:assert/strict');

const emailService = require('../utils/emailService');
const mongoose = require('../mongoose');

const originalSendEmail = emailService.sendEmail;

const resetEmailStub = () => {
  emailService.sendEmail = async (...args) => {
    return { messageId: 'test-message-id', accepted: [args[0]] };
  };
};

test('updateOrderStatus sends a customer email when the status changes', async () => {
  mongoose.useMock();
  resetEmailStub();

  delete require.cache[require.resolve('../controllers/orderController')];
  const orderController = require('../controllers/orderController');
  const Order = require('../models/Order');

  const order = await new Order({
    orderId: 'SRI-TEST-001',
    invoiceNumber: 'INV-TEST-001',
    customerName: 'Test Customer',
    customerEmail: 'customer@example.com',
    items: [{ name: 'Test Product', quantity: 1, price: 100, totalPrice: 100 }],
    subtotal: 100,
    grandTotal: 100,
    status: 'Order Confirmed',
    timelineHistory: []
  }).save();

  const sent = [];
  emailService.sendEmail = async (to, subject, html, options = {}) => {
    sent.push({ to, subject, options });
    return { messageId: 'test-message-id', accepted: [to] };
  };

  const req = { params: { id: order._id }, body: { status: 'Shipped', note: 'Packed and dispatched.' } };
  const res = {
    json(payload) {
      this.payload = payload;
    }
  };

  try {
    await orderController.updateOrderStatus(req, res, () => {});

    assert.equal(sent.length, 1, 'expected one customer email notification');
    assert.equal(sent[0].to, 'customer@example.com');
    assert.match(sent[0].subject, /Order Update/);
    assert.equal(res.payload.status, 'Shipped');
  } finally {
    emailService.sendEmail = originalSendEmail;
    mongoose.useReal();
  }
});

test('updateOrderStatus sends a customer email for status variants like out for delivery', async () => {
  mongoose.useMock();
  resetEmailStub();

  delete require.cache[require.resolve('../controllers/orderController')];
  const orderController = require('../controllers/orderController');
  const Order = require('../models/Order');

  const order = await new Order({
    orderId: 'SRI-TEST-002',
    invoiceNumber: 'INV-TEST-002',
    customerName: 'Test Customer',
    customerEmail: 'customer@example.com',
    items: [{ name: 'Test Product', quantity: 1, price: 100, totalPrice: 100 }],
    subtotal: 100,
    grandTotal: 100,
    status: 'Shipped',
    timelineHistory: []
  }).save();

  const sent = [];
  emailService.sendEmail = async (to, subject, html, options = {}) => {
    sent.push({ to, subject, options });
    return { messageId: 'test-message-id', accepted: [to] };
  };

  const req = { params: { id: order._id }, body: { status: 'out for delivery', note: 'On the way.' } };
  const res = {
    json(payload) {
      this.payload = payload;
    }
  };

  try {
    await orderController.updateOrderStatus(req, res, () => {});

    assert.equal(sent.length, 1, 'expected one customer email notification for status variants');
    assert.equal(sent[0].to, 'customer@example.com');
    assert.match(sent[0].subject, /Order Update/);
    assert.equal(res.payload.status, 'Out For Delivery');
  } finally {
    emailService.sendEmail = originalSendEmail;
    mongoose.useReal();
  }
});
