const mongoose = require('mongoose');

const JournalPublicationScopusSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    employee_code: { type: String }, // Original: Employee_Code
    faculty_name: { type: String }, // Original: Faculty_Name
    publication_month_year: { type: Date }, // Original: Publication_Month_Year
    publication_details: { type: String }, // Original: Publication_Details
    publisher_details: { type: String }, // Original: Publisher_Details
    impact_factor: { type: Number }, // Original: Impact_Factor
    indexed_in: { type: String }, // Original: Indexed_in
    collaborative_publication: { type: Boolean }, // Original: Collaborative_Publication
    colloborator_name_affliation: { type: String }, // Original: Colloborator_Name_Affliation
    collaboration_details: { type: String }, // Original: Collaboration_Details
    in_ugc_care_list: { type: Boolean }, // Original: In_UGC_Care_List
    journal_home_page_link: { type: String }, // Original: Journal_Home_Page_Link
    article_link: { type: String }, // Original: Article_Link
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
    cite_the_publication_apa_style: { type: String }, // Original: Cite the Publication (APA Style)
  },
  { timestamps: true }
);

module.exports = mongoose.model('JournalPublicationScopus', JournalPublicationScopusSchema);
