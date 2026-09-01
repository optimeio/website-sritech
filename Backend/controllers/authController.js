const crypto = require('crypto');
const User = require('../models/User');
const asyncHandler = require('../middleware/asyncHandler');
const generateToken = require('../utils/token');
const { sendEmail } = require('../utils/emailService');
const { templates } = require('../utils/emailTemplates');
const { generateOtp } = require('../utils/otp');

const OTP_EXPIRY_MS = Number(process.env.OTP_EXPIRY_MS || 10 * 60 * 1000);
const normalizeEmail = (email = '') => String(email).trim().toLowerCase();
const normalizeOtp = (otp = '') => String(otp).trim();

const buildOtpText = (name, otp) => `Hello ${name || 'there'},\n\nYour verification code is: ${otp}\n\nThis code is valid for 10 minutes. If you did not request this, ignore this email.\n`;

const sendOtpEmail = async (user, otp) => {
  const subject = 'Verify Your Email - Sri Tech';
  const html = templates.emailVerification({ name: user.name || user.email, otp });
  const text = buildOtpText(user.name || user.email, otp);

  return sendEmail(user.email, subject, html, {
    template: 'emailVerification',
    payload: { email: user.email, otp },
    text
  });
};

exports.signup = asyncHandler(async (req, res) => {
  const { name, email, password, phone, address } = req.body;
  const normalizedEmail = normalizeEmail(email);

  console.log('[signup] signup request received', { email: normalizedEmail });

  const existingUser = await User.findOne({ email: normalizedEmail });
  if (existingUser && existingUser.isVerified) {
    console.warn('[signup] email already registered and verified', normalizedEmail);
    return res.status(400).json({
      success: false,
      error: 'Account already created. Please sign in.'
    });
  }

  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);

  let user;
  if (existingUser) {
    console.log('[signup] existing unverified user found, updating OTP', normalizedEmail);
    existingUser.name = name || existingUser.name;
    existingUser.phone = phone || existingUser.phone;
    existingUser.address = address || existingUser.address;
    existingUser.password = password || existingUser.password;
    existingUser.isVerified = false;
    existingUser.otp = otp;
    existingUser.otpExpires = otpExpires;
    user = await existingUser.save();
  } else {
    console.log('[signup] creating new unverified user entry', normalizedEmail);
    user = await User.create({
      name,
      email: normalizedEmail,
      phone,
      address,
      password,
      isVerified: false,
      otp,
      otpExpires
    });
  }

  console.log('[signup] OTP generated and saved', { email: normalizedEmail, otp });

  let emailSent = false;
  let emailError = null;
  try {
    console.log('[signup] sending verification email', { email: normalizedEmail });
    await sendOtpEmail(user, otp);
    console.log('[signup] verification email sent successfully', { email: normalizedEmail });
    emailSent = true;
  } catch (err) {
    emailError = err.message || String(err);
    console.error('[signup] failed to send verification email', {
      email: normalizedEmail,
      error: emailError
    });
    // Don't delete the user – keep the OTP so verify-otp can still work.
    console.log(`[signup] ⚠️ Email delivery failed. OTP for ${normalizedEmail}: ${otp}`);
  }

  return res.status(201).json({
    success: true,
    message: emailSent
      ? 'OTP sent successfully. Please check your email.'
      : `Account created. OTP email could not be delivered (${emailError || 'check configuration'}). Your OTP is: ${otp}`,
    requiresVerification: true,
    email: normalizedEmail,
    ...(emailSent ? {} : { otp })
  });
});

exports.verifyOtp = asyncHandler(async (req, res) => {
  const { email, otp } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const normalizedOtp = normalizeOtp(otp);

  console.log('[verifyOtp] verification request received', { email: normalizedEmail, otp: normalizedOtp });

  const user = await User.findOne({ email: normalizedEmail });
  if (!user) {
    console.warn('[verifyOtp] no user found for verification', normalizedEmail);
    return res.status(404).json({ success: false, error: 'Verification request not found. Please signup again.' });
  }

  if (user.isVerified) {
    console.warn('[verifyOtp] user already verified', normalizedEmail);
    return res.status(400).json({ success: false, error: 'User is already verified. Please login.' });
  }

  const otpExpiresAt = new Date(user.otpExpires).getTime();
  if (!normalizedOtp || user.otp !== normalizedOtp || !user.otpExpires || Date.now() > otpExpiresAt) {
    console.warn('[verifyOtp] invalid or expired OTP', { email: normalizedEmail });
    return res.status(400).json({ success: false, error: 'Invalid or expired OTP.' });
  }

  user.isVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  const token = generateToken({ id: user._id, role: user.role || 'user' });
  console.log('[verifyOtp] email verified successfully', normalizedEmail);

  // Build a clean user object (mock mongoose toJSON may not strip fields properly)
  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role || 'user',
    status: user.status || 'active',
    isVerified: true,
    createdAt: user.createdAt
  };

  return res.json({
    success: true,
    message: 'Email verified successfully.',
    token,
    user: safeUser
  });
});

exports.resendOtp = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(404).json({ success: false, error: 'User not found. Please sign up.' });
  }

  if (user.isVerified) {
    return res.status(400).json({ success: false, error: 'Email is already verified. Please login.' });
  }

  const otp = generateOtp();
  const otpExpires = new Date(Date.now() + OTP_EXPIRY_MS);
  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  let emailSent = false;
  let emailError = null;
  try {
    await sendOtpEmail(user, otp);
    emailSent = true;
  } catch (err) {
    emailError = err.message || String(err);
    console.error('[resendOtp] failed to resend verification email', { email: normalizedEmail, error: emailError });
    console.log(`[resendOtp] ⚠️ Email delivery failed. OTP for ${normalizedEmail}: ${otp}`);
  }

  return res.json({
    success: true,
    message: emailSent
      ? 'OTP resent successfully.'
      : `New OTP generated. Email could not be delivered (${emailError || 'check configuration'}). Your OTP is: ${otp}`,
    requiresVerification: true,
    email: normalizedEmail,
    ...(emailSent ? {} : { otp })
  });
});

exports.login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(401).json({ message: 'Please create an account first.' });
  }

  if (!(await user.matchPassword(password))) {
    return res.status(401).json({ message: 'Invalid email or password.' });
  }

  if (user.status === 'blocked') {
    return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
  }

  if (!user.isVerified) {
    return res.status(403).json({
      message: 'Please verify your email address before logging in.',
      requiresVerification: true,
      email: normalizedEmail
    });
  }

  const token = generateToken({ id: user._id, role: user.role || 'user' });

  const safeUser = {
    _id: user._id,
    name: user.name,
    email: user.email,
    phone: user.phone,
    address: user.address,
    role: user.role || 'user',
    status: user.status || 'active',
    isVerified: user.isVerified,
    createdAt: user.createdAt
  };

  res.json({
    token,
    user: safeUser
  });
});

exports.getMe = asyncHandler(async (req, res) => {
  res.json(req.user);
});

exports.requestPasswordReset = asyncHandler(async (req, res) => {
  const { email } = req.body;
  const normalizedEmail = normalizeEmail(email);
  const user = await User.findOne({ email: normalizedEmail });

  if (!user) {
    return res.status(404).json({ message: 'User not found.' });
  }

  const resetToken = crypto.randomBytes(32).toString('hex');
  user.resetPasswordToken = resetToken;
  user.resetPasswordExpires = Date.now() + 60 * 60 * 1000;
  await user.save();

  const resetUrl = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(normalizedEmail)}`;

  try {
    await sendEmail(normalizedEmail, 'Password Reset Request - The Sri Tech', templates.passwordReset({ name: user.name, resetUrl }), {
      template: 'passwordReset',
      payload: { userId: user._id, resetToken }
    });
  } catch (err) {
    console.error('Password reset email failed:', err.message);
  }

  res.json({ message: 'Password reset link has been sent to your email.' });
});

exports.resetPassword = asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  const user = await User.findOne({
    resetPasswordToken: token,
    resetPasswordExpires: { $gt: Date.now() }
  });

  if (!user) {
    return res.status(400).json({ message: 'Token is invalid or has expired.' });
  }

  user.password = password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpires = undefined;
  await user.save();

  res.json({ message: 'Password has been reset successfully.' });
});
