const mongoose = require('mongoose');

const saleItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  brand: String,
  unitValue: Number,
  unit: String,
  qty: { type: Number, required: true },
  price: { type: Number, required: true },
  costPrice: { type: Number, required: true },
  total: { type: Number, required: true },
}, { _id: false });

const saleSchema = new mongoose.Schema(
  {
    invoiceNo: { type: String, required: true, unique: true },
    shopkeeper: { type: mongoose.Schema.Types.ObjectId, ref: 'Shopkeeper', default: null },
    shopkeeperName: { type: String, default: 'Walk-in Customer' },
    shopName: { type: String, default: 'Walk-in' },
    phone: { type: String, default: '' },
    address: { type: String, default: '' },
    items: [saleItemSchema],
    itemsCount: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    discountPercent: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    creditAmount: { type: Number, default: 0 },
    paymentMethod: { type: String, enum: ['cash', 'credit', 'partial'], required: true },
    status: { type: String, enum: ['completed', 'pending', 'partial', 'paid', 'unpaid'], default: 'completed' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Sale', saleSchema);