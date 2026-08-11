const mongoose = require('mongoose');

const StudentPaperPresentSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    roll_no: { type: String }, // Original: Roll_No
    student_name: { type: String }, // Original: Student_Name
    event_name: { type: String }, // Original: Event_Name
    event_date: { type: Date }, // Original: Event_Date
    level: { type: String }, // Original: Level
    organised_by: { type: String }, // Original: Organised_by
    participated_presented_paper: { type: String }, // Original: Participated_Presented_Paper
    issn_no: { type: String }, // Original: ISSN_No
    impact_factor: { type: Number }, // Original: Impact_Factor
    paper_details: { type: String }, // Original: Paper_Details
    indexed_in: { type: String }, // Original: Indexed_in
    guide_name: { type: String }, // Original: Guide_Name
    employee_code: { type: String }, // Original: Employee_Code
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentPaperPresent', StudentPaperPresentSchema);
