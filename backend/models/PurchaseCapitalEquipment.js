const mongoose = require('mongoose');

const PurchaseCapitalEquipmentSchema = new mongoose.Schema(
  {
    s_no: { type: Number }, // Original: S_No
    criteria_no_name: { type: String }, // Original: Criteria_No_Name
    date: { type: Date }, // Original: Date
    department: { type: String }, // Original: Department
    purchase_order_no: { type: String }, // Original: Purchase_Order_No.
    name_of_laboratory: { type: String }, // Original: Name_of_laboratory
    indent_date: { type: Date }, // Original: Indent_Date
    delivery_date: { type: Date }, // Original: Delivery_Date
    installation_date: { type: Date }, // Original: Installation_Date
    equipment_details: { type: String }, // Original: Equipment_Details
    quantity: { type: Number }, // Original: Quantity
    total_investment: { type: Number }, // Original: Total_Investment
    purpose_of_purchase: { type: String }, // Original: Purpose_of_Purchase
    file_name: { type: mongoose.Schema.Types.ObjectId, ref: 'uploads.files' }, // Original: File_Name
  },
  { timestamps: true }
);

module.exports = mongoose.model('PurchaseCapitalEquipment', PurchaseCapitalEquipmentSchema);
