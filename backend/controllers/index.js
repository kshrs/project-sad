const academicYearController = require('./academicYearController');
const monthlyReportController = require('./monthlyReportController');
const sheetEntryController = require('./sheetEntryController');
const sheetsController = require('./sheetsController');
const fileController = require('./fileController');

module.exports = {
  academicYear: academicYearController,
  monthlyReport: monthlyReportController,
  sheetEntry: sheetEntryController,
  sheets: sheetsController,
  file: fileController
};
