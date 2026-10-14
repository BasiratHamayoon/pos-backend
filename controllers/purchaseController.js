const mongoose = require('mongoose');
const Purchase = require('../models/Purchase');
const Product = require('../models/Product');
const Supplier = require('../models/Supplier');

const generatePONumber = async () => {
  const count = await Purchase.countDocuments();
  const randomPart = Math.floor(100 + Math.random() * 900);
  return `PO-${count + 1000}${randomPart}`;
};

const createPurchase = async (req, res) => {
  try {
    const { supplierId, items, subtotal, discount, totalAmount, paidAmount, paymentMethod } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ message: 'Purchase list is empty' });
    if (!mongoose.Types.ObjectId.isValid(supplierId)) return res.status(400).json({ message: 'Invalid Supplier ID' });
    
    const supplierDoc = await Supplier.findById(supplierId);
    if (!supplierDoc) return res.status(404).json({ message: 'Supplier not found' });

    const safeTotalAmount = Number(totalAmount) || 0;
    let safePaidAmount = 0;
    let safeDueAmount = 0;

    if (paymentMethod === 'credit') {
      safePaidAmount = 0;
      safeDueAmount = safeTotalAmount;
    } else {
      safePaidAmount = Number(paidAmount);
      if (isNaN(safePaidAmount)) safePaidAmount = safeTotalAmount;
      safeDueAmount = Math.max(0, safeTotalAmount - safePaidAmount);
    }

    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ${item.name} not found` });

      const variant = product.variants.id(item.variantId);
      if (!variant) return res.status(404).json({ message: `Variant ${item.variantLabel} not found` });

      const qty = Number(item.qty) || 0;
      const costPrice = Number(item.costPrice) || variant.costPrice;

      if (qty <= 0) return res.status(400).json({ message: `Invalid quantity for ${product.name}` });

      variant.stock += qty;
      variant.costPrice = costPrice;
      
      if (variant.stock <= 0) variant.status = 'out_of_stock';
      else if (variant.stock <= variant.minStock) variant.status = 'low_stock';
      else variant.status = 'in_stock';

      await product.save();

      enrichedItems.push({
        productId: product._id,
        variantId: variant._id,
        name: product.name,
        variantLabel: variant.label,
        qty,
        costPrice,
        total: qty * costPrice,
      });
    }

    const poNumber = await generatePONumber();

    const purchase = await Purchase.create({
      poNumber,
      supplier: supplierDoc._id,
      supplierName: supplierDoc.name,
      companyName: supplierDoc.companyName,
      items: enrichedItems,
      itemsCount: enrichedItems.length,
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      totalAmount: safeTotalAmount,
      paidAmount: safePaidAmount,
      dueAmount: safeDueAmount,
      paymentMethod,
      createdBy: req.user._id,
    });

    supplierDoc.totalPurchased = (supplierDoc.totalPurchased || 0) + safeTotalAmount;
    supplierDoc.totalPayable = (supplierDoc.totalPayable || 0) + safeDueAmount;
    await supplierDoc.save();

    res.status(201).json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPurchases = async (req, res) => {
  try {
    const purchases = await Purchase.find({}).sort({ createdAt: -1 });
    res.status(200).json(purchases);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPurchaseById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid Purchase ID' });
    const purchase = await Purchase.findById(req.params.id);
    if (!purchase) return res.status(404).json({ message: 'Purchase record not found' });
    res.status(200).json(purchase);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createPurchase, getPurchases, getPurchaseById };