const mongoose = require('mongoose');

const StudentCompetitionParticiDetailsSchema = new mongoose.Schema(
  {
    hackathonscompetitionexchange_programs_other_related_activities: { type: String }, // Original: Hackathons/Competition/Exchange Programs/ other related activities
    awardsrecognitionsprize_if_any: { type: String }, // Original: Awards/Recognitions/Prize, If any
  },
  { timestamps: true }
);

module.exports = mongoose.model('StudentCompetitionParticiDetails', StudentCompetitionParticiDetailsSchema);
