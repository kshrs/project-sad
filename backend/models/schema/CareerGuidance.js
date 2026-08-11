const mongoose = require('mongoose');

const CareerGuidanceSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    activity: { type: String }, // Original: Activity
    agency_conducted_activity: { type: String }, // Original: Agency_Conducted_Activity
    no_of_students_attended: { type: Number }, // Original: No._of_Students_Attended
    comments: { type: String }, // Original: Comments
    outcomes: { type: String }, // Original: Outcomes
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('CareerGuidance', CareerGuidanceSchema);
