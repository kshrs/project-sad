const mongoose = require('mongoose');

const StudentPublicationSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    roll_no: { type: String }, // Original: Roll_No
    student_name: { type: String }, // Original: Student_Name
    faculty_guide_name: { type: String }, // Original: Faculty_Guide_Name
    employee_code: { type: String }, // Original: Employee_Code
    paper_details: { type: String }, // Original: Paper Details
    impact_factor: { type: Number }, // Original: Impact_Factor
    indexed_in: { type: String }, // Original: Indexed_in
    collaborative_publication: { type: Boolean }, // Original: Collaborative_Publication
    collaborator_name_affiliation: { type: String }, // Original: Collaborator_Name_Affiliation
    listed_in_ugc_website_during_the_year: { type: String }, // Original: Listed_in_UGC_Website_during_the_year
    level: { type: String }, // Original: Level
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentPublication', StudentPublicationSchema);
