const mongoose = require('mongoose');

const MouActivitiesSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    duration: { type: String }, // Original: Duration
    mou_signed_organization: { type: String }, // Original: MoU_Signed_Organization
    activity: { type: String }, // Original: Activity
    nature: { type: String }, // Original: Nature
    no_students_or_faculty_participated: { type: Number }, // Original: No._Students_Or_Faculty_Participated
    status: { type: String }, // Original: Status
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('MouActivities', MouActivitiesSchema);
