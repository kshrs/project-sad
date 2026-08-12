const express = require('express');
const router = express.Router();
const controllers = require('../controllers');
const { uploadToGridFS } = require('../middleware/upload');

// Health check endpoint
router.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date() });
});

// ==========================================
// 1. Layer 1: Academic Year Routes
// ==========================================
router.post('/years', controllers.academicYear.createYear);
router.get('/years', controllers.academicYear.getAllYears);
router.get('/years/:id', controllers.academicYear.getYearById);
router.delete('/years/:id', controllers.academicYear.deleteYear);

// ==========================================
// 2. Layer 2: Monthly Report Routes
// ==========================================
router.post('/reports', controllers.monthlyReport.createMonthlyReport);
router.get('/reports/year/:yearId', controllers.monthlyReport.getReportsByYear);
router.get('/reports/:id', controllers.monthlyReport.getReportById);
router.post('/reports/:monthId/access-rules', controllers.monthlyReport.addAccessRule);
router.delete('/reports/:monthId/access-rules', controllers.monthlyReport.revokeAccessRule);
router.patch('/reports/:monthId/status', controllers.monthlyReport.updateStatus);

// ==========================================
// 3. Layer 3: Dynamic 52-Sheet Entries Routes
// ==========================================
router.post('/sheets-entry/:sheetName', controllers.sheetEntry.createEntry);
router.get('/sheets-entry/:sheetName/month/:monthId', controllers.sheetEntry.getEntriesByMonth);
router.get('/sheets-entry/:sheetName/:id', controllers.sheetEntry.getEntryById);
router.put('/sheets-entry/:sheetName/:id', controllers.sheetEntry.updateEntry);
router.delete('/sheets-entry/:sheetName/:id', controllers.sheetEntry.deleteEntry);

// ==========================================
// 4. Layer 4: System Metadata & Aggregation Routes
// ==========================================
router.get('/sheets', controllers.sheets.getAllSheetsMetadata);
router.get('/sheets/full-report', controllers.sheets.getFullReport);
router.get('/sheets/:sheetName', controllers.sheets.getSheetItems);

// ==========================================
// 5. Layer 5: GridFS File Upload & Download Routes
// ==========================================
router.post('/files/upload', uploadToGridFS, controllers.file.uploadFile);
router.get('/files/:id', controllers.file.getFileById);
router.delete('/files/:id', controllers.file.deleteFileById);

module.exports = router;
