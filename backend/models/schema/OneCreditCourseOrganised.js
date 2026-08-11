const mongoose = require('mongoose');

const OneCreditCourseOrganisedSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    course_code: { type: String }, // Original: Course_Code
    course_name: { type: String }, // Original: Course_Name
    expert_name_designation: { type: String }, // Original: Expert_Name_Designation
    industry_institute_name: { type: String }, // Original: Industry_Institute_Name
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    total_hours: { type: Number }, // Original: Total_Hours
    student_batch: { type: String }, // Original: Student_Batch
    no_of_students: { type: Number }, // Original: No_of_Students
    employee_code: { type: String }, // Original: Employee_Code
    faculty_coordinator: { type: String }, // Original: Faculty_Coordinator
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('OneCreditCourseOrganised', OneCreditCourseOrganisedSchema);
