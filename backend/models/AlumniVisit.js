const mongoose = require('mongoose');

const AlumniVisitSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    roll_no: { type: String }, // Original: Roll_No
    name: { type: String }, // Original: Name
    year_of_study: { type: Date }, // Original: Year_of_Study
    designation: { type: String }, // Original: Designation
    name_of_the_organization: { type: String }, // Original: Name_of_the_Organization
    address: { type: String }, // Original: Address
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('AlumniVisit', AlumniVisitSchema);
