const mongoose = require('mongoose');

const MouSignedSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    mou_signed_organization: { type: String }, // Original: MoU_Signed_Organization
    academic_institution_or_industry: { type: String }, // Original: Academic_Institution_Or_Industry
    national_or_international: { type: String }, // Original: National_Or_International
    mou_signed_date: { type: Date }, // Original: MoU_Signed_Date
    duration: { type: String }, // Original: Duration
    kct_faculty_coordinator: { type: String }, // Original: KCT_Faculty_Coordinator
    employee_code: { type: String }, // Original: Employee_Code
    mou_activities: { type: String }, // Original: MoU_Activities
    no_students_or_faculty_participated: { type: Number }, // Original: No._Students_Or_Faculty_Participated
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('MouSigned', MouSignedSchema);
