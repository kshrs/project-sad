const mongoose = require('mongoose');

const PaperPresentedSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    employee_code: { type: String }, // Original: Employee_Code
    faculty_coordinator: { type: String }, // Original: Faculty_Coordinator
    designation: { type: String }, // Original: Designation
    event_name: { type: String }, // Original: Event_Name
    organised_by: { type: String }, // Original: Organised_by
    sponsored_by: { type: String }, // Original: Sponsored_by
    level: { type: String }, // Original: Level
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    paper_presented_title: { type: String }, // Original: Paper_Presented_Title
    isbn_proceeding: { type: String }, // Original: ISBN_Proceeding
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('PaperPresented', PaperPresentedSchema);
