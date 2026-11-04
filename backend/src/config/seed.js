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

    // Staff 1: kishor14112006@gmail.com
    let staff = await User.findOne({ email: 'kishor14112006@gmail.com' });
    if (!staff) {
      staff = await User.create({
        email: 'kishor14112006@gmail.com',
        displayName: 'Staff 1',
        role: 'STAFF',
        department: 'Information Technology',
        authProvider: 'local_dev',
        avatarUrl: 'https://ui-avatars.com/api/?name=Staff+1&background=2563eb&color=fff'
      });
      logger.info('Seeded default Staff: kishor14112006@gmail.com');
    } else if (staff.displayName !== 'Staff 1') {
      staff.displayName = 'Staff 1';
      await staff.save();
    }

    // Staff 2: staff2@kct.ac.in (For delegation testing)
    let staff2 = await User.findOne({ email: 'staff2@kct.ac.in' });
    if (!staff2) {
      staff2 = await User.create({
        email: 'staff2@kct.ac.in',
        displayName: 'Staff 2',
        role: 'STAFF',
        department: 'Information Technology',
        authProvider: 'local_dev',
        avatarUrl: 'https://ui-avatars.com/api/?name=Staff+2&background=059669&color=fff'
      });
      logger.info('Seeded test Staff: staff2@kct.ac.in');
    } else if (staff2.displayName !== 'Staff 2') {
      staff2.displayName = 'Staff 2';
      await staff2.save();
    }

    // Staff 3: staff3@kct.ac.in
    let staff3 = await User.findOne({ email: 'staff3@kct.ac.in' });
    if (!staff3) {
      staff3 = await User.create({
        email: 'staff3@kct.ac.in',
        displayName: 'Staff 3',
        role: 'STAFF',
        department: 'Information Technology',
        authProvider: 'local_dev',
        avatarUrl: 'https://ui-avatars.com/api/?name=Staff+3&background=7c3aed&color=fff'
      });
      logger.info('Seeded test Staff: staff3@kct.ac.in');
    } else if (staff3.displayName !== 'Staff 3') {
      staff3.displayName = 'Staff 3';
      await staff3.save();
    }

    // 2. Seed Academic Year based on current system time
    const nowIST = DateTime.now().setZone(TIMEZONE);
    // Academic year runs from June to May: e.g. June 2026 to May 2027 is 2026-2027
    const startYear = nowIST.month >= 6 ? nowIST.year : nowIST.year - 1;
    const endYear = startYear + 1;
    const currentYearKey = `${startYear}-${endYear}`;

    let academicYear = await AcademicYear.findOne({ yearKey: currentYearKey });
    if (!academicYear) {
      academicYear = await AcademicYear.create({
        yearKey: currentYearKey,
        displayName: `Academic Year ${currentYearKey}`,
        department: 'Information Technology',
        startDate: new Date(`${startYear}-06-01T00:00:00.000Z`),
        endDate: new Date(`${endYear}-05-31T23:59:59.999Z`),
        isActive: true,
        createdBy: admin._id
      });
      logger.info(`Seeded Academic Year: ${currentYearKey}`);
    }

    // 3. Seed Monthly Reports for 12 months in this academic cycle
    const monthsCycle = [
      { num: 6, name: 'June', year: startYear },
      { num: 7, name: 'July', year: startYear },
      { num: 8, name: 'August', year: startYear },
      { num: 9, name: 'September', year: startYear },
      { num: 10, name: 'October', year: startYear },
      { num: 11, name: 'November', year: startYear },
      { num: 12, name: 'December', year: startYear },
      { num: 1, name: 'January', year: endYear },
      { num: 2, name: 'February', year: endYear },
      { num: 3, name: 'March', year: endYear },
      { num: 4, name: 'April', year: endYear },
      { num: 5, name: 'May', year: endYear }
    ];

    for (const m of monthsCycle) {
      const monthKey = `${m.year}-${String(m.num).padStart(2, '0')}`;
      
      // Calculate locking: past months strictly BEFORE current month in IST are locked
      // Current month and future months are ACTIVE!
      const isPastMonth = m.year < nowIST.year || (m.year === nowIST.year && m.num < nowIST.month);

      const startOfNextMonth = DateTime.fromObject(
        { year: m.num === 12 ? m.year + 1 : m.year, month: m.num === 12 ? 1 : m.num + 1, day: 1 },
        { zone: TIMEZONE }
      );

      await MonthlyReport.findOneAndUpdate(
        { monthKey },
        {
          yearId: academicYear._id,
          monthKey: monthKey,
          monthNumber: m.num,
          monthName: m.name,
          status: isPastMonth ? 'LOCKED' : 'ACTIVE',
          lockDateIST: startOfNextMonth.toJSDate()
        },
        { upsert: true, new: true }
      );
    }
    logger.info('Verified monthly reports cycle in IST with active current month.');

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
