const mongoose = require('mongoose');

const IndustrialVisitSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    programme: { type: String }, // Original: Programme
    year: { type: Number }, // Original: Year
    no_of_students: { type: Number }, // Original: No._of_Students
    industry_name: { type: String }, // Original: Industry_Name
    industry_location: { type: String }, // Original: Industry_Location
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    faculty_coordinator: { type: String }, // Original: Faculty_Coordinator
    employee_code: { type: String }, // Original: Employee_Code
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('IndustrialVisit', IndustrialVisitSchema);
