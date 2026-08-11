const mongoose = require('mongoose');

const AwardsReceivedSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    employee_code: { type: String }, // Original: Employee_Code
    faculty_name: { type: String }, // Original: Faculty_Name
    award_receiving_date: { type: Date }, // Original: Award_Receiving_Date
    award_title: { type: String }, // Original: Award_Title
    agency_offering_award: { type: String }, // Original: Agency_Offering_Award
    agency_level: { type: String }, // Original: Agency_Level
    agency_type: { type: String }, // Original: Agency_Type
    agency_address: { type: String }, // Original: Agency_Address
    nature_of_activity_recognized: { type: String }, // Original: Nature_of_Activity_Recognized
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('AwardsReceived', AwardsReceivedSchema);
