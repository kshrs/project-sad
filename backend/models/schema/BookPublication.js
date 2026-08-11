const mongoose = require('mongoose');

const BookPublicationSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    faculty_name: { type: String }, // Original: Faculty_Name
    employee_code: { type: String }, // Original: Employee_Code
    publication_month_year: { type: Date }, // Original: Publication_Month_Year
    book_title: { type: String }, // Original: Book_Title
    publisher_name: { type: String }, // Original: Publisher_Name
    isbn_no: { type: String }, // Original: ISBN_No
    collabortive_publication: { type: Boolean }, // Original: Collabortive_Publication
    co_author_details: { type: String }, // Original: Co-Author_Details
    level: { type: String }, // Original: Level
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('BookPublication', BookPublicationSchema);
