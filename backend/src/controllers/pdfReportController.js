const PDFDocument = require('pdfkit');
const { DateTime } = require('luxon');
const { SheetDefinition, SheetEntry, MonthlyReport, AcademicYear, User } = require('../models');
const logger = require('../config/logger');

const TIMEZONE = process.env.TIMEZONE || 'Asia/Kolkata';

const pdfReportController = {
  // Generate deterministic infographic PDF analytics report
  exportPdf: async (req, res) => {
    try {
      const { monthId, staffId } = req.query;
      const user = req.user;

      if (!monthId) {
        return res.status(400).json({ success: false, message: 'monthId query parameter is required' });
      }

      const month = await MonthlyReport.findById(monthId).populate('yearId');
      if (!month) {
        return res.status(404).json({ success: false, message: 'Month not found' });
      }

      const targetStaffId = staffId || user.id;
      const staffUser = await User.findById(targetStaffId);
      if (!staffUser) {
        return res.status(404).json({ success: false, message: 'Staff member not found' });
      }

      // Fetch all non-empty sheets for this staff and month
      const sheets = await SheetDefinition.find({ isArchived: false }).sort({ category: 1, orderIndex: 1 });
      const reportSections = [];
      let totalAchievementEntries = 0;
      const studentRosterSet = new Set();
      const categoryCounts = {};

      for (const s of sheets) {
        const entries = await SheetEntry.find({
          sheetId: s._id,
          monthId: monthId,
          ownerId: targetStaffId,
          deletedAt: null
        });

        if (entries.length > 0) {
          totalAchievementEntries += entries.length;
          categoryCounts[s.category] = (categoryCounts[s.category] || 0) + entries.length;

          // Extract students from data fields
          entries.forEach((e) => {
            const dataObj = e.data ? Object.fromEntries(e.data) : {};
            Object.keys(dataObj).forEach((k) => {
              const lower = k.toLowerCase();
              if (lower.includes('student') || lower.includes('roll') || lower.includes('name')) {
                if (dataObj[k] && typeof dataObj[k] === 'string' && dataObj[k].length > 2) {
                  studentRosterSet.add(dataObj[k].trim());
                }
              }
            });
          });

          reportSections.push({
            sheet: s,
            entries: entries.map((e) => (e.data ? Object.fromEntries(e.data) : {}))
          });
        }
      }

      const nowIST = DateTime.now().setZone(TIMEZONE);
      const doc = new PDFDocument({
        size: 'A4',
        margins: { top: 70, bottom: 60, left: 50, right: 50 },
        bufferPages: true
      });

      // Stream PDF to HTTP response
      const filename = `Achievement_Report_${staffUser.displayName.replace(/\s+/g, '_')}_${month.monthName}_${month.yearId.yearKey}.pdf`;
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `inline; filename="${filename}"`);

      doc.pipe(res);

      // --- Cover & Analytics Overview Page ---
      doc.fontSize(18).fillColor('#1e2842').text('STAFF & STUDENT ACHIEVEMENT REPORT', { align: 'center' });
      doc.moveDown(0.3);
      doc.fontSize(12).fillColor('#64748b').text('Kumaraguru Institutions | Institutional Accreditation & Audit', { align: 'center' });
      doc.moveDown(1.5);

      // Staff Metadata Card
      doc.rect(50, 140, 495, 80).fillAndStroke('#f8fafc', '#e2e8f0');
      doc.fillColor('#1e2842').fontSize(11).font('Helvetica-Bold');
      doc.text(`Staff Name: ${staffUser.displayName}`, 65, 155);
      doc.text(`Department: ${staffUser.department}`, 65, 175);
      doc.text(`Email: ${staffUser.email}`, 65, 195);

      doc.text(`Academic Year: ${month.yearId.yearKey}`, 330, 155);
      doc.text(`Reporting Month: ${month.monthName}`, 330, 175);
      doc.text(`Generated: ${nowIST.toFormat('dd LLL yyyy, hh:mm a')} IST`, 330, 195);

      // Deterministic KPI Stat Cards
      doc.moveDown(5);
      doc.font('Helvetica-Bold').fontSize(14).fillColor('#0f172a').text('Executive Summary & Infographics', 50, 245);
      doc.moveDown(0.8);

      // KPI Card 1: Total Activities
      doc.rect(50, 275, 155, 60).fillAndStroke('#eff6ff', '#bfdbfe');
      doc.fillColor('#1e40af').fontSize(22).text(`${totalAchievementEntries}`, 65, 285);
      doc.fontSize(9).fillColor('#1e3a8a').text('Total Criteria Entries', 65, 315);

      // KPI Card 2: Active Criteria Sheets
      doc.rect(220, 275, 155, 60).fillAndStroke('#f0fdf4', '#bbf7d0');
      doc.fillColor('#166534').fontSize(22).text(`${reportSections.length}`, 235, 285);
      doc.fontSize(9).fillColor('#14532d').text('Non-Empty Sheets', 235, 315);

      // KPI Card 3: Student Participants
      doc.rect(390, 275, 155, 60).fillAndStroke('#fefce8', '#fef08a');
      doc.fillColor('#854d0e').fontSize(22).text(`${studentRosterSet.size}`, 405, 285);
      doc.fontSize(9).fillColor('#713f12').text('Students Engaged', 405, 315);

      // Category Distribution Vector Infographic
      doc.moveDown(4.5);
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#1e2842').text('Activity Category Breakdown', 50, 360);
      let catY = 385;
      Object.keys(categoryCounts).forEach((cat) => {
        const count = categoryCounts[cat];
        const pct = totalAchievementEntries > 0 ? (count / totalAchievementEntries) * 100 : 0;
        doc.font('Helvetica').fontSize(10).fillColor('#334155').text(`${cat} (${count})`, 50, catY);
        // Vector Progress Bar
        doc.rect(170, catY + 2, 300, 8).fill('#f1f5f9');
        doc.rect(170, catY + 2, Math.max(5, (300 * pct) / 100), 8).fill('#1e2842');
        doc.fontSize(8).fillColor('#64748b').text(`${pct.toFixed(0)}%`, 480, catY + 2);
        catY += 22;
      });

      // --- Non-Empty Sheets Data Sections ---
      reportSections.forEach((section) => {
        doc.addPage();
        doc.font('Helvetica-Bold').fontSize(13).fillColor('#1e2842').text(section.sheet.displayName, 50, 75);
        doc.fontSize(9).fillColor('#64748b').text(`Category: ${section.sheet.category} | Entries: ${section.entries.length}`, 50, 93);
        doc.moveTo(50, 105).lineTo(545, 105).stroke('#cbd5e1');

        let entryY = 115;
        section.entries.forEach((data, idx) => {
          if (entryY > 680) {
            doc.addPage();
            entryY = 75;
          }

          doc.rect(50, entryY, 495, 20).fill('#f8fafc');
          doc.font('Helvetica-Bold').fontSize(9).fillColor('#1e2842').text(`#${idx + 1}`, 58, entryY + 5);

          const keys = Object.keys(data).slice(0, 4); // Display top fields
          let fieldX = 85;
          keys.forEach((k) => {
            const val = String(data[k] || '—');
            const truncated = val.length > 25 ? val.substring(0, 22) + '...' : val;
            doc.font('Helvetica').fontSize(8).fillColor('#475569').text(`${k}: ${truncated}`, fieldX, entryY + 5);
            fieldX += 110;
          });

          entryY += 26;
        });
      });

      // --- Apply Recurring Headers and Footers to All Pages ---
      const range = doc.bufferedPageRange();
      for (let i = range.start; i < range.start + range.count; i++) {
        doc.switchToPage(i);

        // Header on every page
        doc.rect(50, 20, 495, 30).fill('#1e2842');
        doc.font('Helvetica-Bold').fontSize(9).fillColor('#ffffff').text('KUMARAGURU INSTITUTIONS | ACHIEVEMENT AUDIT', 60, 28);
        doc.font('Helvetica').fontSize(8).fillColor('#cbd5e1').text(`${staffUser.displayName} (${staffUser.department}) - ${month.monthName} ${month.yearId.yearKey}`, 300, 28, { align: 'right', width: 235 });

        // Footer on every page
        doc.moveTo(50, 780).lineTo(545, 780).stroke('#cbd5e1');
        doc.font('Helvetica').fontSize(8).fillColor('#94a3b8').text(`Page ${i + 1} of ${range.count}`, 50, 788);
        doc.text('Strictly Confidential & Institutional Verification Only', 50, 788, { align: 'right', width: 495 });
      }

      doc.end();
    } catch (error) {
      logger.error({ error }, 'PDF Export failed:');
      if (!res.headersSent) {
        res.status(500).json({ success: false, message: error.message });
      }
    }
  }
};

module.exports = pdfReportController;
