const mongoose = require('mongoose');

const IndustryLinkageSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    from_date: { type: Date }, // Original: From_Date
    to_date: { type: Date }, // Original: To_Date
    linkage_title: { type: String }, // Original: Linkage_Title
    partnering_institution_name_contact_details: { type: String }, // Original: Partnering_Institution_Name_Contact_Details
    nature_of_linkage: { type: String }, // Original: Nature_of_Linkage
    participant_name: { type: String }, // Original: Participant_Name
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('IndustryLinkage', IndustryLinkageSchema);
