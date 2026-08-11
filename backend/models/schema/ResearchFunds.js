const mongoose = require('mongoose');

const ResearchFundsSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    month_year: { type: Date }, // Original: Month_Year
    duration_months: { type: Number }, // Original: Duration_Months
    project_nature: { type: String }, // Original: Project_Nature
    project_title: { type: String }, // Original: Project_Title
    pi_name: { type: String }, // Original: PI_Name
    pi_employee_code: { type: String }, // Original: PI_Employee_Code
    co_pi_name: { type: String }, // Original: Co_PI_Name
    co_pi_employee_code: { type: String }, // Original: CO_PI_Employee_Code
    sponsored_by_agency: { type: String }, // Original: Sponsored_by_Agency
    agency_name: { type: String }, // Original: Agency_Name
    total_grant_lakhs: { type: Number }, // Original: Total_Grant_Lakhs
    amount_received_current_year_lakhs: { type: Number }, // Original: Amount_Received_Current_Year_Lakhs
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('ResearchFunds', ResearchFundsSchema);
