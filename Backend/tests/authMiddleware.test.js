const test = require('node:test');
const assert = require('node:assert/strict');
const jwt = require('jsonwebtoken');
const { protect, protectAdmin } = require('../middleware/auth');
const User = require('../models/User');

test('protect accepts tokens signed with the fallback JWT secret', async () => {
  const originalSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  User.findById = (id) => ({
    _id: id,
    role: 'customer',
    select: () => ({ _id: id, role: 'customer' })
  });

  const token = jwt.sign({ id: 'user-123' }, 'sritech_default_secret_2026');
  const req = {
    headers: { authorization: `Bearer ${token}` }
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  let nextCalled = false;
  await protect(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
  assert.deepEqual(req.user, { _id: 'user-123', role: 'customer' });

  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});

test('protectAdmin accepts tokens signed with the fallback JWT secret', async () => {
  const originalSecret = process.env.JWT_SECRET;
  delete process.env.JWT_SECRET;

  const token = jwt.sign({ role: 'admin', username: 'admin-user' }, 'sritech_default_secret_2026');
  const req = {
    headers: { authorization: `Bearer ${token}` }
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  let nextCalled = false;
  await protectAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
  assert.deepEqual(req.admin, { role: 'admin', username: 'admin-user', iat: req.admin.iat });

  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});

test('protectAdmin accepts legacy fallback tokens when a different JWT secret is configured', async () => {
  const originalSecret = process.env.JWT_SECRET;
  process.env.JWT_SECRET = 'rotated-secret-2026';

  const token = jwt.sign({ role: 'admin', username: 'legacy-user' }, 'sritech_default_secret_2026');
  const req = {
    headers: { authorization: `Bearer ${token}` }
  };
  const res = {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    }
  };

  let nextCalled = false;
  await protectAdmin(req, res, () => {
    nextCalled = true;
  });

  assert.equal(nextCalled, true);
  assert.equal(res.statusCode, null);
  assert.equal(req.admin.username, 'legacy-user');
  assert.equal(req.admin.role, 'admin');

  if (originalSecret === undefined) {
    delete process.env.JWT_SECRET;
  } else {
    process.env.JWT_SECRET = originalSecret;
  }
});
