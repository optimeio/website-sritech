const jwt = require('jsonwebtoken');
const User = require('../models/User');

const FALLBACK_JWT_SECRET = 'sritech_default_secret_2026';

const getTokenFromHeader = (req) => {
  const authHeader = req.headers.authorization || req.headers.Authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }
  return null;
};

const verifyToken = (token) => {
  const secrets = [process.env.JWT_SECRET, FALLBACK_JWT_SECRET].filter(Boolean);
  let lastError;

  for (const secret of secrets) {
    try {
      return jwt.verify(token, secret);
    } catch (err) {
      lastError = err;
    }
  }

  throw lastError;
};

const protect = async (req, res, next) => {
  const token = getTokenFromHeader(req);

  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }

  try {
    const decoded = verifyToken(token);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({ message: 'Invalid token. User not found.' });
    }
    req.user = user;
    next();
  } catch (err) {
    console.error('Token verification failed:', err.message);
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

const protectAdmin = async (req, res, next) => {
  const token = getTokenFromHeader(req);
  if (!token) {
    return res.status(401).json({ message: 'Access denied. Token missing.' });
  }

  try {
    const decoded = verifyToken(token);
    if (decoded.role !== 'admin') {
      return res.status(401).json({ message: 'Admin access denied.' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    console.error('Admin token verification failed:', err.message);
    res.status(401).json({ message: 'Invalid or expired admin token.' });
  }
};

const authorizeRoles = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Forbidden. You do not have permission to access this resource.' });
  }
  next();
};

module.exports = { protect, protectAdmin, authorizeRoles };
