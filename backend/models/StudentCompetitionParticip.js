const mongoose = require('mongoose');

const StudentCompetitionParticipSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    roll_no: { type: String }, // Original: Roll_No
    student_name: { type: String }, // Original: Student_Name
    programme_type: { type: String }, // Original: Programme_Type
    event_date: { type: Date }, // Original: Event_Date
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    organizing_name: { type: String }, // Original: Organizing_Name
    organizing_address: { type: String }, // Original: Organizing_Address
    level: { type: String }, // Original: Level
    achievements: { type: String }, // Original: Achievements
    internal_fund_rs: { type: Number }, // Original: Internal_Fund_Rs
    external_fund_rs: { type: Number }, // Original: External_Fund_Rs
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentCompetitionParticip', StudentCompetitionParticipSchema);
