const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { err } = require('../utils/response');

const authenticate = async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) return err(res, 'No token provided', 401, 'UNAUTHORIZED');
  try {
    const decoded = jwt.verify(header.split(' ')[1], process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('-passwordHash');
    if (!user) return err(res, 'User not found', 401, 'UNAUTHORIZED');
    req.user = user;
    next();
  } catch {
    return err(res, 'Invalid or expired token', 401, 'TOKEN_INVALID');
  }
};

const requireAdmin = (req, res, next) => {
  if (req.user?.role !== 'admin') return err(res, 'Admin access required', 403, 'FORBIDDEN');
  next();
};

const requireActive = (req, res, next) => {
  if (req.user?.status === 'blocked') return err(res, 'Your account is blocked. Contact your institute.', 403, 'BLOCKED');
  next();
};

module.exports = { authenticate, requireAdmin, requireActive };
