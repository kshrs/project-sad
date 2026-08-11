const academicYearController = require('./academicYearController');
const monthlyReportController = require('./monthlyReportController');
const sheetEntryController = require('./sheetEntryController');
const sheetsController = require('./sheetsController');

module.exports = {
  academicYear: academicYearController,
  monthlyReport: monthlyReportController,
  sheetEntry: sheetEntryController,
  sheets: sheetsController
};
