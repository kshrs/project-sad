const mongoose = require('mongoose');

const PatentSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    ip_type: { type: String }, // Original: IP_Type
    applicants_name: { type: String }, // Original: Applicant's_Name
    inventors_name: { type: String }, // Original: Inventor's_Name
    inventor_affiliation_with_email: { type: String }, // Original: Inventor_Affiliation_With_Email
    title: { type: String }, // Original: Title
    application_no_patent_filed_date: { type: Date }, // Original: Application_No_Patent_Filed_Date
    patent_status: { type: String }, // Original: Patent_Status
    design_status: { type: String }, // Original: Design_Status
    copyright_status: { type: String }, // Original: Copyright_Status
    collabortive_ip: { type: Boolean }, // Original: Collabortive_IP
    collaborative_documents_details: { type: String }, // Original: Collaborative_Documents_Details
    earnings_if_any: { type: Number }, // Original: Earnings_If_Any
    country_name_ip_filed: { type: String }, // Original: Country_Name_IP_Filed
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('Patent', PatentSchema);
