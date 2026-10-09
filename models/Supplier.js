const mongoose = require('mongoose');

const supplierSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    companyName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, default: '' },
    totalPayable: { type: Number, default: 0 }, // Money the store owes to the supplier
    totalPurchased: { type: Number, default: 0 }, // Lifetime value of goods bought
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Supplier', supplierSchema);