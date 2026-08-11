const mongoose = require('mongoose');

const StudentInhouseProjectsSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    programme_name: { type: String }, // Original: Programme_Name
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    roll_no: { type: String }, // Original: Roll_No
    student_name: { type: String }, // Original: Student_Name
    project_title: { type: String }, // Original: Project_Title
    guide_name: { type: String }, // Original: Guide_Name
    outcome: { type: String }, // Original: Outcome
    fund: { type: Number }, // Original: Fund
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentInhouseProjects', StudentInhouseProjectsSchema);
