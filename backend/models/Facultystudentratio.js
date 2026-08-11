const mongoose = require('mongoose');

const FacultystudentratioSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    programme: { type: String }, // Original: Programme
    first_year_pg: { type: String }, // Original: First_Year_PG
    second_year_ug: { type: String }, // Original: Second_Year_UG
    third_year_ug: { type: String }, // Original: Third_Year_UG
    final_year_ug: { type: String }, // Original: Final_Year_UG
    total: { type: String }, // Original: Total
    faculty_total: { type: String }, // Original: Faculty_Total
    faculty_student_ratio: { type: String }, // Original: Faculty_Student_Ratio
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('Facultystudentratio', FacultystudentratioSchema);
