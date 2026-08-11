const mongoose = require('mongoose');

const CollaborativeActivitySchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    collaboration_month_year: { type: Date }, // Original: Collaboration_Month_Year
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    duration: { type: String }, // Original: Duration
    collaborative_activity_title: { type: String }, // Original: Collaborative_Activity_Title
    collaborative_agency_name_contact_details: { type: String }, // Original: Collaborative_Agency_Name_Contact_Details
    employee_code: { type: String }, // Original: Employee_Code
    participant_name: { type: String }, // Original: Participant_Name
    nature_of_the_activity: { type: String }, // Original: Nature_of_the_activity
    financial_support_source: { type: String }, // Original: Financial_Support_Source
    outcome: { type: String }, // Original: Outcome
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('CollaborativeActivity', CollaborativeActivitySchema);
