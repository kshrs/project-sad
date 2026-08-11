const mongoose = require('mongoose');

const PurchaseConsumablesSchema = new mongoose.Schema(
  {
    month_id: { type: mongoose.Schema.Types.ObjectId, ref: 'MonthlyReport', required: true },
    created_by: { type: String },
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    laboratory_name: { type: String }, // Original: Laboratory_Name
    semi_consumables_consumable_details: { type: String }, // Original: Semi_consumables_Consumable_Details
    quantity: { type: Number }, // Original: Quantity
    total_cost: { type: Number }, // Original: Total_Cost
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseConsumables', PurchaseConsumablesSchema);
