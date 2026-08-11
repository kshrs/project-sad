const mongoose = require('mongoose');

const AlumniMeetSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    event_name: { type: String }, // Original: Event_Name
    venue: { type: String }, // Original: Venue
    strength: { type: Number }, // Original: Strength
    remarks: { type: String }, // Original: Remarks
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('AlumniMeet', AlumniMeetSchema);
