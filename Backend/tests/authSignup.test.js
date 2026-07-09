const test = require('node:test');
const assert = require('node:assert/strict');

const mongoose = require('../mongoose');
const User = require('../models/User');

const emailServicePath = require.resolve('../utils/emailService');

test('mock mongoose supports User.create for signup flow', async () => {
  mongoose.useMock();

  const createdUser = await User.create({
    name: 'Test User',
    email: 'testuser@example.com',
    password: '123456',
    phone: '1234567890',
    address: 'Test Address',
    isVerified: true
  });

  assert.ok(createdUser);
  assert.equal(createdUser.email, 'testuser@example.com');

  const foundUser = await User.findOne({ email: 'testuser@example.com' });
  assert.ok(foundUser);
  assert.equal(foundUser.name, 'Test User');
});

test('matchPassword accepts legacy plaintext passwords for older accounts', async () => {
  mongoose.useMock();

  const user = new User({
    name: 'Legacy User',
    email: 'legacy-user@example.com',
    password: 'legacy-pass-123',
    isVerified: true
  });

  const isMatch = await user.matchPassword('legacy-pass-123');
  assert.equal(isMatch, true);
});

test('signup creates an unverified user with an OTP for email verification', async () => {
  mongoose.useMock();

  delete require.cache[emailServicePath];
  const emailService = require('../utils/emailService');
  emailService.sendEmail = async () => ({ messageId: 'test-message-id' });
  delete require.cache[require.resolve('../controllers/authController')];
  const authController = require('../controllers/authController');

  const req = {
    body: {
      name: 'OTP User',
      email: 'otpuser@example.com',
      password: '123456',
      phone: '1234567890',
      address: 'Test Address'
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

  await authController.signup(req, res, () => {});

  const createdUser = await User.findOne({ email: 'otpuser@example.com' });
  assert.equal(statusCode, 201);
  assert.ok(createdUser);
  assert.equal(createdUser.isVerified, false);
  assert.match(createdUser.otp, /^\d{6}$/);
  const otpExpiresAt = new Date(createdUser.otpExpires).getTime();
  assert.ok(otpExpiresAt > Date.now());
  assert.equal(payload.success, true);
  assert.equal(payload.message, 'OTP sent successfully.');
});

test('requestPasswordReset generates a reset token for existing users', async () => {
  mongoose.useMock();

  delete require.cache[emailServicePath];
  const emailService = require('../utils/emailService');
  emailService.sendEmail = async () => ({ messageId: 'reset-message-id' });
  delete require.cache[require.resolve('../controllers/authController')];
  const authController = require('../controllers/authController');

  await User.create({
    name: 'Reset User',
    email: 'resetuser@example.com',
    password: '123456',
    isVerified: true
  });

  const req = { body: { email: 'resetuser@example.com' } };
  let payload;
  const res = {
    json(data) {
      payload = data;
    }
  };

  await authController.requestPasswordReset(req, res, () => {});

  const updatedUser = await User.findOne({ email: 'resetuser@example.com' });
  assert.equal(payload.message, 'Password reset link has been sent to your email.');
  assert.ok(updatedUser.resetPasswordToken);
  assert.ok(updatedUser.resetPasswordExpires > Date.now());
});
