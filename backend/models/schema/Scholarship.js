const mongoose = require('mongoose');

const ScholarshipSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    roll_no: { type: String }, // Original: Roll_No
    student_name: { type: String }, // Original: Student_Name
    sponsoring_agency: { type: String }, // Original: Sponsoring_Agency
    sponsorship_name: { type: String }, // Original: Sponsorship_Name
    amount_received_rs: { type: Number }, // Original: Amount_Received_Rs
    receipt_month_year: { type: Date }, // Original: Receipt_Month_Year
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('Scholarship', ScholarshipSchema);
