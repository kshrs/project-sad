const mongoose = require('mongoose');

const InternshipsSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    duration: { type: String }, // Original: Duration
    batch: { type: String }, // Original: Batch
    roll_no: { type: String }, // Original: Roll_No
    student_name: { type: String }, // Original: Student_Name
    industry_name_address: { type: String }, // Original: Industry_Name_Address
    stipend: { type: Number }, // Original: Stipend
    faculty_name: { type: String }, // Original: Faculty_Name
    employee_code: { type: String }, // Original: Employee_Code
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('Internships', InternshipsSchema);
