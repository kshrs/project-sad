const mongoose = require('mongoose');

const SeedMoneySchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    employee_code: { type: String }, // Original: Employee_Code
    faculty_name: { type: String }, // Original: Faculty_Name
    seed_money_amount: { type: Number }, // Original: Seed_Money_Amount
    grant_received_month_year: { type: Date }, // Original: Grant_Received_Month_Year
    duration: { type: String }, // Original: Duration
    nature_of_activity: { type: String }, // Original: Nature_of_Activity
    outcome: { type: String }, // Original: Outcome
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('SeedMoney', SeedMoneySchema);
