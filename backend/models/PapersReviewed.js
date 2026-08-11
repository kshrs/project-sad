const mongoose = require('mongoose');

const PapersReviewedSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    employee_code: { type: String }, // Original: Employee_Code
    faculty_name: { type: String }, // Original: Faculty_Name
    paper_title: { type: String }, // Original: Paper_Title
    journal_name: { type: String }, // Original: Journal_Name
    journal_type: { type: String }, // Original: Journal_Type
    indexed_in: { type: String }, // Original: Indexed_in
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('PapersReviewed', PapersReviewedSchema);
