const mongoose = require('mongoose');

const StudentsParticipationProgSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    roll_no: { type: String }, // Original: Roll_No
    student_name: { type: String }, // Original: Student_Name
    programme_type: { type: String }, // Original: Programme_Type
    event_name: { type: String }, // Original: Event_Name
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    organizing_name: { type: String }, // Original: Organizing_Name
    organizing_address: { type: String }, // Original: Organizing_Address
    level: { type: String }, // Original: Level
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentsParticipationProg', StudentsParticipationProgSchema);
