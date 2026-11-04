const jwt = require('jsonwebtoken');
const { User } = require('../models');

const JWT_SECRET = process.env.JWT_SECRET || 'sad_jwt_super_secret_dev_key_2026_institutional';

const authenticate = async (req, res, next) => {
  try {
    let token = null;

    // Check Authorization header (Bearer token)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        code: 'UNAUTHORIZED',
        message: 'Authentication required. Please sign in.'
      });
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // { id, email, role, displayName, department }
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      code: 'INVALID_TOKEN',
      message: 'Session expired or token invalid. Please sign in again.'
    });
  }
};

// Role-based access control middleware
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'Access denied: insufficient permissions for this action.'
      });
    }
    next();
  };
};

module.exports = {
  authenticate,
  requireRole
};
