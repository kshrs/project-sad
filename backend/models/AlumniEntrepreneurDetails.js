const mongoose = require('mongoose');

const AlumniEntrepreneurDetailsSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    programme_name: { type: String }, // Original: Programme_Name
    roll_no: { type: String }, // Original: Roll_No
    student_name: { type: String }, // Original: Student_Name
    batch: { type: String }, // Original: Batch
    company_name_address: { type: String }, // Original: Company_Name_Address
    domain: { type: String }, // Original: Domain
    position_in_company: { type: String }, // Original: Position_in_Company
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('AlumniEntrepreneurDetails', AlumniEntrepreneurDetailsSchema);
