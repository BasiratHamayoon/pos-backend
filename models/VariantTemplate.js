const mongoose = require('mongoose');

const variantTemplateSchema = new mongoose.Schema(
  {
    label: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    unitValue: {
      type: Number,
      required: true,
      default: 1,
    },
    unit: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Unit',
      required: true,
    },
    unitName: {
      type: String,
      required: true,
    },
    unitSymbol: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'inactive'],
      default: 'active',
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('VariantTemplate', variantTemplateSchema);