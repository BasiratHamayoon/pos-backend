const mongoose = require('mongoose');

const creditPaymentSchema = new mongoose.Schema(
  {
    shopkeeper: { type: mongoose.Schema.Types.ObjectId, ref: 'Shopkeeper', required: true },
    amount: { type: Number, required: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('CreditPayment', creditPaymentSchema);