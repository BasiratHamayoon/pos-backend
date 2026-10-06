const mongoose = require('mongoose');

const shopkeeperSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    shopName: { type: String, required: true, trim: true },
    phone: { type: String, required: true },
    address: { type: String, default: '' },
    totalCredit: { type: Number, default: 0 },
    totalPurchases: { type: Number, default: 0 },
    status: { type: String, enum: ['active', 'inactive'], default: 'active' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Shopkeeper', shopkeeperSchema);