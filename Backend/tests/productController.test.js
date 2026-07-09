const test = require('node:test');
const assert = require('node:assert/strict');
const productController = require('../controllers/productController');
const Product = require('../models/Product');
const mongoose = require('../mongoose');

test('getProducts returns mock-backed products when the mock database is active', async () => {
  mongoose.useMock();

  const seededProduct = await new Product({
    name: 'Mock Stove',
    price: '₹999',
    category: 'Stoves',
    icon: 'fa-fire',
    images: ['mock-image.png'],
    isNewArrival: true,
    createdAt: new Date('2024-01-01T00:00:00.000Z')
  }).save();

  try {
    const req = {};
    let resolved = false;
    let payload;

    const res = {
      json(products) {
        resolved = true;
        payload = products;
      }
    };

    await productController.getProducts(req, res, () => {});

    assert.equal(resolved, true);
    assert.ok(Array.isArray(payload), 'expected an array of products');
    assert.ok(payload.some(product => product._id === seededProduct._id || product.name === 'Mock Stove'));
  } finally {
    mongoose.useReal();
  }
});

test('getProducts returns fallback catalog promptly when the database is unavailable', async () => {
  const req = {};
  let resolved = false;

  const res = {
    json(payload) {
      resolved = true;
      assert.ok(Array.isArray(payload), 'expected an array of products');
      assert.ok(payload.length > 0, 'expected fallback products to be returned');
    }
  };

  const start = Date.now();
  await Promise.race([
    productController.getProducts(req, res, () => {}),
    new Promise((_, reject) => setTimeout(() => reject(new Error('product controller timed out')), 2000))
  ]);

  assert.equal(resolved, true);
  assert.ok(Date.now() - start < 5000, 'expected the controller to avoid long database timeouts');
});

test('getProducts returns a lightweight sanitized product payload when the database is available', async () => {
  const originalFind = Product.find;
  const payload = {
    _id: 'product-1',
    name: 'Test Stove',
    price: '₹1,000',
    category: 'Stoves',
    description: 'A test product',
    specifications: 'Heavy duty',
    stock: 2,
    icon: 'fa-fire',
    isNewArrival: true,
    images: ['img-1', 'img-2', 'img-3'],
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    __v: 0
  };

  Product.find = () => ({
    select() { return this; },
    sort() { return this; },
    lean() {
      return Promise.resolve([payload]);
    }
  });

  try {
    const req = {};
    let resolved = false;

    const res = {
      json(products) {
        resolved = true;
        assert.ok(Array.isArray(products), 'expected an array of products');
        assert.ok(products.length > 0, 'expected product data to be returned');
        assert.equal('__v' in products[0], false, 'expected mongoose internals to be removed');
        assert.ok(products[0].images.length <= 2, 'expected product image list to be trimmed');
      }
    };

    await productController.getProducts(req, res, () => {});
    assert.equal(resolved, true);
  } finally {
    Product.find = originalFind;
  }
});
