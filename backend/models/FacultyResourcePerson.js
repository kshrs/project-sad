const mongoose = require('mongoose');

const FacultyResourcePersonSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    employee_code: { type: String }, // Original: Employee_Code
    faculty_name: { type: String }, // Original: Faculty_Name
    type_of_activity: { type: String }, // Original: Type_of_Activity
    activity_title: { type: String }, // Original: Activity_Title
    organised_by: { type: String }, // Original: Organised_by
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    level: { type: String }, // Original: Level
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('FacultyResourcePerson', FacultyResourcePersonSchema);
