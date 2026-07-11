const User = require('../models/User');
const ActivityLog = require('../models/ActivityLog');
const asyncHandler = require('../middleware/asyncHandler');

const canAccessUserResource = (req, userId) => {
  if (!req.user) return false;
  if (req.user.role === 'admin') return true;
  return String(req.user._id) === String(userId);
};

exports.getUsers = asyncHandler(async (req, res) => {
  const users = await User.find().select('-password -resetPasswordToken -resetPasswordExpires').sort({ createdAt: -1 });
  res.json(users);
});

exports.toggleUserStatus = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  user.status = user.status === 'blocked' ? 'active' : 'blocked';
  await user.save();

  await new ActivityLog({ action: 'User Status Changed', details: `User ${user.email} status set to ${user.status}` }).save();
  res.json(user);
});

exports.deleteUser = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  await new ActivityLog({ action: 'User Deleted', details: `User ${user.email} deleted permanently` }).save();
  res.json({ message: 'User deleted successfully.' });
});

exports.addToCart = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!canAccessUserResource(req, req.params.id)) {
    return res.status(403).json({ message: 'Forbidden. You are not authorized to modify this cart.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  if (!user.cart.includes(productId)) {
    user.cart.push(productId);
    await user.save();
  }

  res.json(user.cart);
});

exports.removeFromCart = asyncHandler(async (req, res) => {
  if (!canAccessUserResource(req, req.params.id)) {
    return res.status(403).json({ message: 'Forbidden. You are not authorized to modify this cart.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  user.cart = user.cart.filter(id => id.toString() !== req.params.productId);
  await user.save();
  res.json(user.cart);
});

exports.clearCart = asyncHandler(async (req, res) => {
  if (!canAccessUserResource(req, req.params.id)) {
    return res.status(403).json({ message: 'Forbidden. You are not authorized to modify this cart.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  user.cart = [];
  await user.save();
  res.json(user.cart);
});

exports.toggleWaitlist = asyncHandler(async (req, res) => {
  const { productId } = req.body;
  if (!canAccessUserResource(req, req.params.id)) {
    return res.status(403).json({ message: 'Forbidden. You are not authorized to modify this waitlist.' });
  }

  const user = await User.findById(req.params.id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const existing = user.waitlist.find(id => id.toString() === productId);
  if (existing) {
    user.waitlist = user.waitlist.filter(id => id.toString() !== productId);
  } else {
    user.waitlist.push(productId);
  }

  await user.save();
  res.json(user.waitlist);
});

exports.getMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id).select('-password -resetPasswordToken -resetPasswordExpires -otp -otpExpires');
  if (!user) return res.status(404).json({ message: 'User not found.' });
  res.json(user);
});

exports.updateMe = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user._id);
  if (!user) return res.status(404).json({ message: 'User not found.' });

  const { name, email, phone, address, addresses, password, currentPassword } = req.body || {};

  if (name !== undefined) user.name = name;
  if (email !== undefined) user.email = email;
  if (phone !== undefined) user.phone = phone;
  if (address !== undefined) user.address = address;
  if (Array.isArray(addresses)) {
    user.addresses = addresses.map((entry, index) => ({
      ...entry,
      _id: entry._id || entry.id || undefined,
      isDefault: index === 0 ? true : Boolean(entry.isDefault)
    }));
  }

  if (password) {
    if (!currentPassword) return res.status(400).json({ message: 'Current password is required.' });
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect.' });
    user.password = password;
  }

  await user.save();
  res.json(user);
});
