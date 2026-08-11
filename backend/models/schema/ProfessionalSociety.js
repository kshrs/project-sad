const mongoose = require('mongoose');

const ProfessionalSocietySchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    details_of_activity: { type: String }, // Original: Details_of_Activity
    chief_guest_details: { type: String }, // Original: Chief_Guest_Details
    no_of_student_participants: { type: Number }, // Original: No._of_Student_Participants
    no_of_faculty_participants: { type: Number }, // Original: No._of_Faculty_Participants
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProfessionalSociety', ProfessionalSocietySchema);
