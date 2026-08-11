const mongoose = require('mongoose');

const RevenueCorporateTrainingSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_no_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    faculty_name: { type: String }, // Original: Faculty_Name
    employee_code: { type: String }, // Original: Employee_Code
    corporate_training_programme_name: { type: String }, // Original: Corporate_Training_Programme_Name
    agency_details_seeking_training: { type: String }, // Original: Agency_Details_Seeking_Training
    revenue_generated: { type: Number }, // Original: Revenue_Generated
    no_of_trainees: { type: Number }, // Original: No_of_Trainees
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('RevenueCorporateTraining', RevenueCorporateTrainingSchema);
