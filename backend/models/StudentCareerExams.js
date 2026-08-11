const mongoose = require('mongoose');

const StudentCareerExamsSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_no_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    roll_no: { type: String }, // Original: Roll_No
    student_name: { type: String }, // Original: Student_Name
    exam_details: { type: String }, // Original: Exam_Details
    registration_no_date: { type: Date }, // Original: Registration_No_Date
    success_details: { type: String }, // Original: Success_Details
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentCareerExams', StudentCareerExamsSchema);
