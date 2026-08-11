const mongoose = require('mongoose');

const PrgmAttendAbove5DaysSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    employee_code: { type: String }, // Original: Employee_Code
    faculty_name: { type: String }, // Original: Faculty_Name
    designation: { type: String }, // Original: Designation
    event_type: { type: String }, // Original: Event_Type
    level: { type: String }, // Original: Level
    programme_title: { type: String }, // Original: Programme_Title
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    duration: { type: String }, // Original: Duration
    hours_per_day: { type: Number }, // Original: Hours_Per_Day
    programme_mode: { type: String }, // Original: Programme_Mode
    organizing_agency: { type: String }, // Original: Organizing_Agency
    organizing_agency_address: { type: String }, // Original: Organizing_Agency_Address
    sponsorship: { type: Boolean }, // Original: Sponsorship
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('PrgmAttendAbove5Days', PrgmAttendAbove5DaysSchema);
