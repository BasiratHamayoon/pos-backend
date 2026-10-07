const mongoose = require('mongoose');

const reportSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'yearly', 'shopkeeper', 'stock'], 
      required: true 
    },
    date: { type: String, required: true },
    totalSales: { type: Number, required: true, default: 0 },
    totalItems: { type: Number, required: true, default: 0 },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Report', reportSchema);