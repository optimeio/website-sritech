const test = require('node:test');
const assert = require('node:assert/strict');

const mongoose = require('../mongoose');
const emailService = require('../utils/emailService');
const invoiceService = require('../utils/invoiceService');

const originalSendEmail = emailService.sendEmail;
const originalCreateInvoicePdf = invoiceService.createInvoicePdf;

test('createOrder computes totals and saves a new order', async () => {
  mongoose.useMock();
  delete require.cache[require.resolve('../models/Order')];
  delete require.cache[require.resolve('../models/Invoice')];
  const Order = require('../models/Order');
  const Invoice = require('../models/Invoice');

  emailService.sendEmail = async () => ({ messageId: 'test-message-id' });
  invoiceService.createInvoicePdf = async () => '/uploads/invoices/test-order.pdf';

  delete require.cache[require.resolve('../controllers/orderController')];
  const orderController = require('../controllers/orderController');

  await Order.deleteMany({});
  await Invoice.deleteMany({});

  const req = {
    body: {
      customerName: 'Test Order Customer',
      customerEmail: 'order-customer@example.com',
      items: [
        {
          product: 'test-product-001',
          name: 'Test Product',
          quantity: 2,
          price: 100,
          totalPrice: 200
        }
      ],
      discount: 20,
      shippingCost: 500,
      tax: 18,
      paymentStatus: 'Completed'
    }
  };

  let statusCode = 0;
  let payload;
  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(data) {
      payload = data;
    }
  };

  try {
    await orderController.createOrder(req, res, () => {});

    assert.equal(statusCode, 201);
    assert.ok(payload._id, 'Expected saved order to have an _id');
    assert.equal(payload.status, 'Order Confirmed');
    assert.equal(payload.subtotal, 200);
    assert.equal(payload.discount, 20);
    assert.equal(payload.shippingCost, 500);
    assert.equal(payload.tax, 18);
    assert.equal(payload.grandTotal, 698);
    assert.equal(Array.isArray(payload.items), true);
    assert.equal(payload.items.length, 1);
    assert.equal(payload.items[0].name, 'Test Product');
  } finally {
    emailService.sendEmail = originalSendEmail;
    invoiceService.createInvoicePdf = originalCreateInvoicePdf;
    mongoose.useReal();
  }
});
