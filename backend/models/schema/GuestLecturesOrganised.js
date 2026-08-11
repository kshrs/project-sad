const mongoose = require('mongoose');

const GuestLecturesOrganisedSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    guest_lecture_topic: { type: String }, // Original: Guest_Lecture_Topic
    expert_name_designation: { type: String }, // Original: Expert_Name_Designation
    industry_institute_name: { type: String }, // Original: Industry_Institute_Name
    student_batch: { type: String }, // Original: Student_Batch
    no_of_participants: { type: Number }, // Original: No_of_Participants
    employee_code: { type: String }, // Original: Employee_Code
    faculty_coordinator: { type: String }, // Original: Faculty_Coordinator
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('GuestLecturesOrganised', GuestLecturesOrganisedSchema);
