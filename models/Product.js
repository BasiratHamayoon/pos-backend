const mongoose = require('mongoose');

const variantSchema = new mongoose.Schema({
  label: { type: String, required: true },
  unitValue: { type: Number, default: 1 },
  unit: {
    type: String,
    enum: ['pcs', 'pack', 'box', 'kg', 'g', 'l', 'ml'],
    default: 'pcs',
  },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  stock: { type: Number, required: true, default: 0 },
  minStock: { type: Number, default: 10 },
  status: {
    type: String,
    enum: ['in_stock', 'low_stock', 'out_of_stock'],
    default: 'in_stock',
  },
});

const productSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    brand: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Brand',
      default: null,
    },
    brandName: {
      type: String,
      default: '',
    },
    category: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Category',
      required: true,
    },
    categoryName: { type: String, required: true },
    variants: {
      type: [variantSchema],
      validate: [arr => arr.length > 0, 'At least one variant is required'],
    },
  },
  { timestamps: true }
);

productSchema.pre('save', function (next) {
  this.variants.forEach(v => {
    if (v.stock <= 0) v.status = 'out_of_stock';
    else if (v.stock <= v.minStock) v.status = 'low_stock';
    else v.status = 'in_stock';
  });
  next();
});

module.exports = mongoose.model('Product', productSchema);