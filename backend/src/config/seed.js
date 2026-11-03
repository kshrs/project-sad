const mongoose = require('mongoose');
const { DateTime } = require('luxon');
const { User, SheetDefinition, AcademicYear, MonthlyReport, GlobalActivityLog } = require('../models');
const defaultSheets = require('./defaultSheets.json');
const logger = require('./logger');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

async function seedDatabase() {
  try {
    logger.info('Checking database seed baseline...');

    // 1. Seed Default Users
    // Admin: kishorjsk2006@gmail.com
    let admin = await User.findOne({ email: 'kishorjsk2006@gmail.com' });
    if (!admin) {
      admin = await User.create({
        email: 'kishorjsk2006@gmail.com',
        displayName: 'Kishor (Admin)',
        role: 'ADMIN',
        department: 'Information Technology',
        authProvider: 'local_dev',
        avatarUrl: 'https://ui-avatars.com/api/?name=Kishor+Admin&background=1e2842&color=fff'
      });
      logger.info('Seeded default Admin: kishorjsk2006@gmail.com');
    }

    // Staff: kishor14112006@gmail.com
    let staff = await User.findOne({ email: 'kishor14112006@gmail.com' });
    if (!staff) {
      staff = await User.create({
        email: 'kishor14112006@gmail.com',
        displayName: 'Kishor Staff',
        role: 'STAFF',
        department: 'Information Technology',
        authProvider: 'local_dev',
        avatarUrl: 'https://ui-avatars.com/api/?name=Kishor+Staff&background=2563eb&color=fff'
      });
      logger.info('Seeded default Staff: kishor14112006@gmail.com');
    }

    // 2. Seed Default Academic Year (e.g. 2025-2026)
    const currentYearKey = '2025-2026';
    let academicYear = await AcademicYear.findOne({ yearKey: currentYearKey });
    if (!academicYear) {
      academicYear = await AcademicYear.create({
        yearKey: currentYearKey,
        displayName: 'Academic Year 2025-2026',
        department: 'Information Technology',
        startDate: new Date('2025-06-01T00:00:00.000Z'),
        endDate: new Date('2026-05-31T23:59:59.999Z'),
        isActive: true,
        createdBy: admin._id
      });
      logger.info(`Seeded default Academic Year: ${currentYearKey}`);
    }

    // 3. Seed Monthly Reports for 12 months (June to May academic cycle)
    const monthsCycle = [
      { num: 6, name: 'June', year: 2025 },
      { num: 7, name: 'July', year: 2025 },
      { num: 8, name: 'August', year: 2025 },
      { num: 9, name: 'September', year: 2025 },
      { num: 10, name: 'October', year: 2025 },
      { num: 11, name: 'November', year: 2025 },
      { num: 12, name: 'December', year: 2025 },
      { num: 1, name: 'January', year: 2026 },
      { num: 2, name: 'February', year: 2026 },
      { num: 3, name: 'March', year: 2026 },
      { num: 4, name: 'April', year: 2026 },
      { num: 5, name: 'May', year: 2026 }
    ];

    const nowIST = DateTime.now().setZone(TIMEZONE);

    for (const m of monthsCycle) {
      const monthKey = `${m.year}-${String(m.num).padStart(2, '0')}`;
      const existing = await MonthlyReport.findOne({ monthKey });
      
      // Calculate locking: past months in IST are locked
      // Lock date is 00:00:00 IST on 1st of next month
      const startOfNextMonth = DateTime.fromObject(
        { year: m.num === 12 ? m.year + 1 : m.year, month: m.num === 12 ? 1 : m.num + 1, day: 1 },
        { zone: TIMEZONE }
      );
      const isPastMonth = nowIST >= startOfNextMonth;

      if (!existing) {
        await MonthlyReport.create({
          yearId: academicYear._id,
          monthKey: monthKey,
          monthNumber: m.num,
          monthName: m.name,
          status: isPastMonth ? 'LOCKED' : 'ACTIVE',
          lockDateIST: startOfNextMonth.toJSDate()
        });
      }
    }
    logger.info('Verified monthly reports cycle in IST.');

    // 4. Seed Default 52 Sheet Definitions
    const sheetCount = await SheetDefinition.countDocuments();
    if (sheetCount === 0) {
      logger.info(`Seeding ${defaultSheets.length} standard sheet definitions...`);
      for (let i = 0; i < defaultSheets.length; i++) {
        const item = defaultSheets[i];
        await SheetDefinition.create({
          sheetKey: item.sheetKey,
          displayName: item.displayName,
          category: item.category,
          orderIndex: i,
          columns: item.columns,
          targetScope: 'ALL',
          isSystemDefault: true,
          createdBy: admin._id
        });
      }
      logger.info(`Successfully seeded ${defaultSheets.length} sheet definitions.`);
    }

    logger.info('Database baseline initialization complete.');
  } catch (err) {
    logger.error({ err }, 'Error during database seed:');
  }
}

module.exports = { seedDatabase };
