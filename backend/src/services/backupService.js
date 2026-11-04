const fs = require('fs');
const path = require('path');
const { DateTime } = require('luxon');
const { SheetEntry, SheetDefinition, MonthlyReport, AcademicYear, User, GlobalActivityLog } = require('../models');
const logger = require('../config/logger');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';
const BACKUP_DIR = process.env.BACKUP_DIR || path.join(__dirname, '../../../backups');

const backupService = {
  // Execute database snapshot export
  runBackup: async () => {
    try {
      if (!fs.existsSync(BACKUP_DIR)) {
        fs.mkdirSync(BACKUP_DIR, { recursive: true });
      }

      const nowIST = DateTime.now().setZone(TIMEZONE);
      const timestampStr = nowIST.toFormat('yyyy_MM_dd_HHmmss');
      const backupPath = path.join(BACKUP_DIR, `backup_${timestampStr}`);
      fs.mkdirSync(backupPath, { recursive: true });

      logger.info({ backupPath }, 'Starting automated database backup snapshot...');

      // Export collections to JSON archives
      const collections = [
        { name: 'users', model: User },
        { name: 'academic_years', model: AcademicYear },
        { name: 'monthly_reports', model: MonthlyReport },
        { name: 'sheet_definitions', model: SheetDefinition },
        { name: 'sheet_entries', model: SheetEntry }
      ];

      for (const col of collections) {
        const docs = await col.model.find({});
        fs.writeFileSync(path.join(backupPath, `${col.name}.json`), JSON.stringify(docs, null, 2), 'utf8');
      }

      logger.info(`Backup completed successfully at ${backupPath}`);
      return { success: true, backupPath, timestamp: nowIST.toISO() };
    } catch (err) {
      logger.error({ err }, 'Backup snapshot failed:');
      throw err;
    }
  }
};

module.exports = backupService;
