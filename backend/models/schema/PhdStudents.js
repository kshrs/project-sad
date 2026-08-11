const mongoose = require('mongoose');

const PhdStudentsSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    student_name: { type: String }, // Original: Student_Name
    registration_no: { type: String }, // Original: Registration_No
    phd_registration_date: { type: Date }, // Original: PhD_Registration_Date
    university_name: { type: String }, // Original: University_Name
    guide_name_department: { type: String }, // Original: Guide_Name_Department
    phd_completion_date: { type: Date }, // Original: PhD_Completion_Date
    mode: { type: String }, // Original: Mode
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('PhdStudents', PhdStudentsSchema);
