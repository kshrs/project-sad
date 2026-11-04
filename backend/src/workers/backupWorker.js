const cron = require('node-cron');
const backupService = require('../services/backupService');
const logger = require('../config/logger');

function initBackupWorker() {
  // Run on the 28th-31st of every month at 23:59:00 IST
  cron.schedule(
    '59 23 28-31 * *',
    async () => {
      try {
        logger.info('Month-end automated backup cron triggered');
        await backupService.runBackup();
      } catch (err) {
        logger.error({ err }, 'Automated month-end backup worker failed');
      }
    },
    {
      timezone: process.env.TIMEZONE || 'Asia/Kolkata'
    }
  );
  logger.info('Scheduled month-end backup worker initialized (Asia/Kolkata timezone)');
}

module.exports = { initBackupWorker };
