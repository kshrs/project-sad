const mongoose = require('mongoose');

const FacultyCompetitionSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    competition_month_year: { type: Date }, // Original: Competition_Month_Year
    employee_code: { type: String }, // Original: Employee_Code
    faculty_name: { type: String }, // Original: Faculty_Name
    programme_type: { type: String }, // Original: Programme_Type
    event_name: { type: String }, // Original: Event_Name
    organizing_agency_name: { type: String }, // Original: Organizing_Agency_Name
    level: { type: String }, // Original: Level
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    duration: { type: String }, // Original: Duration
    hours_per_day: { type: Number }, // Original: Hours_Per_Day
    programme_mode: { type: String }, // Original: Programme_mode
    organizing_agency_name2: { type: String }, // Original: Organizing_Agency_Name2
    organizing_agency_address: { type: String }, // Original: Organizing_Agency_Address
    achievements: { type: String }, // Original: Achievements
    sponsorship: { type: Boolean }, // Original: Sponsorship
    sponsorship_amount: { type: Number }, // Original: Sponsorship_Amount
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('FacultyCompetition', FacultyCompetitionSchema);
