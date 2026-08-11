const mongoose = require('mongoose');

const PhdCompletedSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    employee_code: { type: String }, // Original: Employee_Code
    faculty_name: { type: String }, // Original: Faculty_Name
    designation: { type: String }, // Original: Designation
    thesis_title: { type: String }, // Original: Thesis_Title
    phd_completion_date: { type: Date }, // Original: Ph.D_Completion_Date
    supervisor_details: { type: String }, // Original: Supervisor_Details
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('PhdCompleted', PhdCompletedSchema);
