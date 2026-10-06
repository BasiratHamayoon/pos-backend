const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      default: '',
      trim: true,
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    categoryName: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    costPrice: {
      type: Number,
      required: true,
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
    },
    minStock: {
      type: Number,
      default: 10,
    },
    unitValue: {
      type: Number,
      default: 1,
    },
    unit: {
      type: String,
      enum: ['pcs', 'pack', 'box', 'kg', 'g', 'l', 'ml'],
      default: 'pcs',
    },
    status: {
      type: String,
      enum: ['in_stock', 'low_stock', 'out_of_stock'],
      default: 'in_stock',
    },
  },
  { timestamps: true }
);

productSchema.pre('save', function () {
  if (this.stock <= 0) {
    this.status = 'out_of_stock';
  } else if (this.stock <= this.minStock) {
    this.status = 'low_stock';
  } else {
    this.status = 'in_stock';
  }
});

module.exports = mongoose.model('Product', productSchema);