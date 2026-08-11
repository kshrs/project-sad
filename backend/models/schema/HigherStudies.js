const mongoose = require('mongoose');

const HigherStudiesSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_no_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    programme: { type: String }, // Original: Programme
    roll_no: { type: String }, // Original: Roll_No
    student_name: { type: String }, // Original: Student_Name
    graduating_year: { type: Number }, // Original: Graduating_Year
    institution_name_joined: { type: String }, // Original: Institution_Name_Joined
    programme_name_admitted: { type: String }, // Original: Programme_Name_Admitted
    admission_year: { type: Number }, // Original: Admission_Year
    eligibility_exam_name: { type: String }, // Original: Eligibility_Exam_Name
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('HigherStudies', HigherStudiesSchema);
