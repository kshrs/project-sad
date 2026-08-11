const mongoose = require('mongoose');

const ReveuneConsultancySchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    faculty_name: { type: String }, // Original: Faculty_Name
    employee_code: { type: String }, // Original: Employee_Code
    facility_used: { type: String }, // Original: Facility_Used
    project_name: { type: String }, // Original: Project_Name
    agency_details: { type: String }, // Original: Agency_Details
    revenue_generated: { type: Number }, // Original: Revenue_Generated
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('ReveuneConsultancy', ReveuneConsultancySchema);
