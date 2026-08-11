const mongoose = require('mongoose');

const ProgramsOrganisedStudentsSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    programme_type: { type: String }, // Original: Programme_Type
    programme_title: { type: String }, // Original: Programme_Title
    level: { type: String }, // Original: Level
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    days: { type: Number }, // Original: Days
    faculty_coordinator: { type: String }, // Original: Faculty_Coordinator
    employee_code: { type: String }, // Original: Employee_Code
    no_of_participants: { type: Number }, // Original: No._of_Participants
    resource_person_details: { type: String }, // Original: Resource_Person_Details
    is_resource_person_alumni: { type: Boolean }, // Original: Is_Resource_Person_Alumni
    external_agency: { type: Boolean }, // Original: External_Agency
    external_agency_name_address: { type: String }, // Original: External_Agency_Name_Address
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('ProgramsOrganisedStudents', ProgramsOrganisedStudentsSchema);
