const mongoose = require('mongoose');

const StudentCompetitionParticiDetailsSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    hackathonscompetitionexchange_programs_other_related_activities: { type: String }, // Original: Hackathons/Competition/Exchange Programs/ other related activities
    awardsrecognitionsprize_if_any: { type: String }, // Original: Awards/Recognitions/Prize, If any
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentCompetitionParticiDetails', StudentCompetitionParticiDetailsSchema);
