const mongoose = require('mongoose');

const BookChapterPublicationSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    faculty_name: { type: String }, // Original: Faculty_Name
    employee_code: { type: String }, // Original: Employee_Code
    publication_month_year: { type: Date }, // Original: Publication_Month_Year
    book_title: { type: String }, // Original: Book_Title
    chapter_title: { type: String }, // Original: Chapter_Title
    publisher_name: { type: String }, // Original: Publisher_Name
    pages: { type: String }, // Original: Pages
    isbn_no: { type: String }, // Original: ISBN_No
    co_author_details: { type: String }, // Original: Co-Author_Details
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('BookChapterPublication', BookChapterPublicationSchema);
