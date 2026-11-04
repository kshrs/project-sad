const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const sheetsController = require('../controllers/sheetsController');
const sheetEntryController = require('../controllers/sheetEntryController');
const sheetShareController = require('../controllers/sheetShareController');
const sheetUnlockController = require('../controllers/sheetUnlockController');
const userController = require('../controllers/userController');
const pdfReportController = require('../controllers/pdfReportController');
const fileController = require('../controllers/fileController');
const { uploadToGridFS } = require('../middleware/uploadMiddleware');
const backupService = require('../services/backupService');
const { authenticate, requireRole } = require('../middleware/authMiddleware');
const auditMiddleware = require('../middleware/auditMiddleware');
const { AcademicYear, MonthlyReport, GlobalActivityLog } = require('../models');

// Attach audit middleware to all mutating requests
router.use(auditMiddleware);

// --- Auth Routes ---
router.post('/auth/dev-login', authController.devLogin);
router.get('/auth/me', authenticate, authController.getMe);
router.post('/auth/logout', authenticate, authController.logout);

// --- Academic Years & Months ---
router.get('/years', authenticate, async (req, res) => {
  try {
    const years = await AcademicYear.find({ isActive: true }).sort({ yearKey: -1 });
    res.json({ success: true, count: years.length, data: years });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

router.get('/reports/year/:yearId', authenticate, async (req, res) => {
  try {
    const currentMonthKey = new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: '2-digit'
    }).format(new Date());

    const reports = await MonthlyReport.find({ yearId: req.params.yearId }).sort({ monthNumber: 1 });
    const formatted = reports.map((r) => {
      const obj = r.toObject();
      if (obj.monthKey && obj.monthKey < currentMonthKey) {
        obj.status = 'LOCKED';
      }
      return obj;
    });
    res.json({ success: true, count: formatted.length, data: formatted });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- Sheet Definitions & Metadata ---
router.get('/sheets', authenticate, sheetsController.getSheetsMetadata);
router.get('/sheets/:sheetKey/columns', authenticate, sheetsController.getSheetColumns);
router.post('/sheets', authenticate, requireRole('ADMIN', 'COORDINATOR'), sheetsController.createSheet);
router.patch('/sheets/:sheetId/schema', authenticate, requireRole('ADMIN', 'COORDINATOR'), sheetsController.modifySchema);
router.delete('/sheets/:sheetId', authenticate, requireRole('ADMIN', 'COORDINATOR'), sheetsController.deleteSheet);

// --- Sheet Entries & Transactional Batch Auto-Save ---
router.get('/sheets/:sheetKey/entries', authenticate, sheetEntryController.getEntries);
router.post('/sheets/:sheetKey/entries/batch-save', authenticate, sheetEntryController.batchSave);
router.delete('/sheets/entries/:id', authenticate, sheetEntryController.deleteEntry);

// --- Sheet Sharing & Delegation ("Manage Access") ---
router.post('/share', authenticate, sheetShareController.grantShare);
router.get('/share/:sheetKey', authenticate, sheetShareController.getGrantedShares);
router.delete('/share/:ruleId', authenticate, sheetShareController.revokeShare);

// --- Month Locking & 24h Unlock Grants ---
router.post('/unlock', authenticate, requireRole('ADMIN', 'COORDINATOR'), sheetUnlockController.grantUnlock);
router.get('/unlock/:sheetKey/status', authenticate, sheetUnlockController.getUnlockStatus);

// --- Staff Search & DPDP Compliance ---
router.get('/users/search', authenticate, userController.searchUsers);
router.get('/users/me/data', authenticate, userController.exportMyData);

// --- Deterministic Infographic PDF Engine ---
router.get('/reports/export-pdf', authenticate, pdfReportController.exportPdf);

// --- File Upload & Streaming Routes ---
router.post('/files/upload', authenticate, uploadToGridFS, fileController.uploadFile);
router.get('/files/:id', fileController.getFileById);

// --- Global Activity Logs (Admin & Coordinator Explorer) ---
router.get('/admin/activity-logs', authenticate, requireRole('ADMIN', 'COORDINATOR'), async (req, res) => {
  try {
    const { action, staffEmail, limit = 50 } = req.query;
    const filter = {};
    if (action) filter.action = action;
    if (staffEmail) filter['actor.email'] = new RegExp(staffEmail.trim(), 'i');

    const logs = await GlobalActivityLog.find(filter).sort({ timestamp: -1 }).limit(Number(limit));
    res.json({ success: true, count: logs.length, logs });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// --- On-Demand Admin Backup Trigger ---
router.post('/admin/backups/run', authenticate, requireRole('ADMIN', 'COORDINATOR'), async (req, res) => {
  try {
    const result = await backupService.runBackup();
    res.json(result);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
