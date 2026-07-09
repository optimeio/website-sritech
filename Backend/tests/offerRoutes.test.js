const test = require('node:test');
const assert = require('node:assert/strict');
const express = require('express');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

const offerRoutes = require('../routes/offerRoutes');

let mongod;

test.before(async () => {
  mongod = await MongoMemoryServer.create();
  const uri = mongod.getUri();
  await mongoose.connect(uri);
});

test.after(async () => {
  await mongoose.disconnect();
  await mongod.stop();
});

test('offers API returns a list and creates a new offer', async () => {
  const app = express();
  app.use(express.json());
  app.use('/offers', offerRoutes);

  const server = app.listen(0);
  const { port } = await new Promise((resolve) => server.once('listening', () => resolve(server.address())));

  try {
    const listRes = await fetch(`http://127.0.0.1:${port}/offers`);
    assert.equal(listRes.status, 200);
    const listBody = await listRes.json();
    assert.ok(Array.isArray(listBody));

    const createRes = await fetch(`http://127.0.0.1:${port}/offers`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: 'Flash Sale',
        description: 'Limited-time bundle offer',
        code: 'FLASH10',
        type: 'product',
        targetProduct: 'product-1',
        discountType: 'percentage',
        discountValue: 10,
        isActive: true,
        isPublished: true
      })
    });

    assert.equal(createRes.status, 200);
    const created = await createRes.json();
    assert.equal(created.title, 'Flash Sale');
    assert.equal(created.type, 'product');
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
});
