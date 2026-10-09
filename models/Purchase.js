const mongoose = require('mongoose');

const purchaseItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  variantId: { type: mongoose.Schema.Types.ObjectId, required: true },
  name: { type: String, required: true },
  variantLabel: { type: String, required: true },
  qty: { type: Number, required: true },
  costPrice: { type: Number, required: true }, // The rate bought from supplier
  total: { type: Number, required: true },
}, { _id: false });

const purchaseSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true }, // Purchase Order Number
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true },
    supplierName: { type: String, required: true },
    companyName: { type: String, required: true },
    items: [purchaseItemSchema],
    itemsCount: { type: Number, required: true },
    subtotal: { type: Number, required: true },
    discount: { type: Number, default: 0 },
    totalAmount: { type: Number, required: true },
    paidAmount: { type: Number, default: 0 },
    dueAmount: { type: Number, default: 0 }, // Credit owed to supplier
    paymentMethod: { type: String, enum: ['cash', 'credit', 'partial'], required: true },
    status: { type: String, enum: ['received', 'pending'], default: 'received' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Purchase', purchaseSchema);