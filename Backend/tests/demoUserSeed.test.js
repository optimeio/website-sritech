const test = require('node:test');
const assert = require('node:assert/strict');
const mongoose = require('../mongoose');
const User = require('../models/User');
const { ensureDemoUser } = require('../utils/ensureDemoUser');

test('ensureDemoUser creates a verified demo account', async () => {
  mongoose.useMock && mongoose.useMock();
  await User.deleteMany({ email: 'demo@sritech.com' });

  const firstUser = await ensureDemoUser();
  assert.equal(firstUser.email, 'demo@sritech.com');
  assert.equal(firstUser.isVerified, true);

  const secondUser = await ensureDemoUser();
  assert.equal(secondUser._id.toString(), firstUser._id.toString());
});
