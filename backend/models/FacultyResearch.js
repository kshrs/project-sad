const mongoose = require('mongoose');

const FacultyResearchSchema = new mongoose.Schema(
  {
    112_faculty_research: { type: String }, // Original: 1.12_Faculty_Research
    note_kindly_update_all_faculty_details_in_this_table: { type: Date }, // Original: Note: Kindly update all faculty details in this table.
  },
  { timestamps: true }
);

module.exports = mongoose.model('FacultyResearch', FacultyResearchSchema);
