const jwt = require('jsonwebtoken');
const { DateTime } = require('luxon');
const { User, GlobalActivityLog } = require('../models');
const logger = require('../config/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'sad_jwt_super_secret_dev_key_2026_institutional';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

// Generate token
const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      email: user.email,
      role: user.role,
      displayName: user.displayName,
      department: user.department
    },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

// Set token in secure HTTP-only cookie
const setAuthCookie = (res, token) => {
  const isProd = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProd,
    sameSite: isProd ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

const authController = {
  // 1. Development Bypass Login (kishorjsk2006@gmail.com = ADMIN, kishor14112006@gmail.com = STAFF)
  devLogin: async (req, res) => {
    try {
      const isProd = process.env.NODE_ENV === 'production';
      const allowTest = process.env.ALLOW_TEST_LOGIN === 'true';

      if (isProd || !allowTest) {
        return res.status(403).json({
          success: false,
          code: 'TEST_LOGIN_DISABLED',
          message: 'Development quick login is disabled in production environments.'
        });
      }

      const { email } = req.body;
      if (!email) {
        return res.status(400).json({ success: false, message: 'Email is required' });
      }

      let user = await User.findOne({ email: email.toLowerCase().trim() });
      if (!user) {
        // Auto-seed user if one of the approved test accounts
        const role = email.toLowerCase().includes('admin') || email.toLowerCase() === 'kishorjsk2006@gmail.com'
          ? 'ADMIN'
          : 'STAFF';

        user = await User.create({
          email: email.toLowerCase().trim(),
          displayName: role === 'ADMIN' ? 'Kishor (Admin)' : 'Kishor Staff',
          role: role,
          department: 'Information Technology',
          authProvider: 'local_dev',
          avatarUrl: `https://ui-avatars.com/api/?name=${encodeURIComponent(email)}&background=1e2842&color=fff`
        });
      }

      const token = generateToken(user);
      setAuthCookie(res, token);

      // Record in GlobalActivityLog
      const now = DateTime.now().setZone(TIMEZONE);
      await GlobalActivityLog.create({
        timestamp: now.toJSDate(),
        timestampIST: now.toFormat('yyyy-MM-dd HH:mm:ss.SSS'),
        actor: {
          userId: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role
        },
        action: 'AUTH_LOGIN',
        metadata: {
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          requestId: req.headers['x-request-id'] || 'dev-login'
        }
      });

      res.json({
        success: true,
        message: 'Logged in successfully via dev credentials',
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          department: user.department,
          avatarUrl: user.avatarUrl
        },
        token
      });
    } catch (error) {
      logger.error({ error }, 'Dev login error:');
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 2. Get Current Authenticated User Profile
  getMe: async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select('-__v');
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }

      res.json({
        success: true,
        user: {
          id: user._id,
          email: user.email,
          displayName: user.displayName,
          role: user.role,
          department: user.department,
          avatarUrl: user.avatarUrl
        }
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // 3. Logout
  logout: async (req, res) => {
    try {
      if (req.user) {
        const now = DateTime.now().setZone(TIMEZONE);
        await GlobalActivityLog.create({
          timestamp: now.toJSDate(),
          timestampIST: now.toFormat('yyyy-MM-dd HH:mm:ss.SSS'),
          actor: {
            userId: req.user.id,
            email: req.user.email,
            displayName: req.user.displayName,
            role: req.user.role
          },
          action: 'AUTH_LOGOUT',
          metadata: {
            ipAddress: req.ip,
            userAgent: req.get('user-agent')
          }
        });
      }

      res.clearCookie('token');
      res.json({ success: true, message: 'Logged out successfully' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = authController;
