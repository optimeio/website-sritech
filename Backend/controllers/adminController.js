const asyncHandler = require('../middleware/asyncHandler');
const generateToken = require('../utils/token');

exports.verifyAdmin = asyncHandler(async (req, res) => {
  res.json({
    success: true,
    message: 'Admin authenticated.',
    admin: {
      username: req.admin?.username || req.admin?.email || 'admin'
    }
  });
});

exports.adminLogin = asyncHandler(async (req, res) => {
  const { username, password } = req.body;
  const adminUsername = process.env.ADMIN_USERNAME || 'thesmgroups@gmail.com';
  const adminPassword = process.env.ADMIN_PASSWORD || 'TSMGPVT@2026';

  if (!username || !password) {
    return res.status(400).json({ message: 'Username and password are required.' });
  }

  const normalizedUsername = String(username || '').toLowerCase().trim();
  const isAdminUser = normalizedUsername === adminUsername || normalizedUsername === 'thesmgroups@gamil.com';

  if (isAdminUser && password === adminPassword) {
    const token = generateToken({ role: 'admin', username: normalizedUsername }, '7d');
    return res.json({ message: 'Admin authenticated successfully.', token });
  }

  res.status(401).json({ message: 'Invalid admin credentials.' });
});
