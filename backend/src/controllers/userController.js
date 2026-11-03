const { User } = require('../models');

const userController = {
  // Real-time debounce search of staff by email or name
  searchUsers: async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || q.trim().length === 0) {
        return res.json({ success: true, users: [] });
      }

      const queryRegex = new RegExp(q.trim(), 'i');

      const users = await User.find({
        $or: [{ email: queryRegex }, { displayName: queryRegex }],
        isActive: true
      })
        .select('displayName email role department avatarUrl')
        .limit(10);

      res.json({
        success: true,
        count: users.length,
        users
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // DPDP Act 2023: Export user data package
  exportMyData: async (req, res) => {
    try {
      const userId = req.user.id;
      const user = await User.findById(userId).select('-__v');

      res.json({
        success: true,
        exportDate: new Date(),
        user
      });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};

module.exports = userController;
