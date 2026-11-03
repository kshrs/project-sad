const { User } = require('../models');

const userController = {
  // Search staff by email or name (or list all active staff if no query provided)
  searchUsers: async (req, res) => {
    try {
      const { q } = req.query;
      let queryFilter = { isActive: true, role: 'STAFF' };

      if (q && q.trim().length > 0) {
        const queryRegex = new RegExp(q.trim(), 'i');
        queryFilter.$or = [{ email: queryRegex }, { displayName: queryRegex }];
      }

      const users = await User.find(queryFilter)
        .select('displayName email role department avatarUrl')
        .sort({ displayName: 1 })
        .limit(50);

      res.json({
        success: true,
        count: users.length,
        users: users.map(u => ({
          id: u._id,
          _id: u._id,
          displayName: u.displayName,
          email: u.email,
          role: u.role,
          department: u.department,
          avatarUrl: u.avatarUrl
        }))
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
