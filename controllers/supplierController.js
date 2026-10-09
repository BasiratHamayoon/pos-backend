const mongoose = require('mongoose');
const Supplier = require('../models/Supplier');
const Purchase = require('../models/Purchase');

const enrichSupplier = async (supplier) => {
  const purchases = await Purchase.find({ supplier: supplier._id });
  const totalPurchased = purchases.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPayable = purchases.reduce((sum, p) => sum + p.dueAmount, 0);
  const purchaseCount = purchases.length;
  const lastPurchase = purchases.length > 0 ? purchases[purchases.length - 1].createdAt : null;

  return {
    ...supplier.toObject(),
    totalPurchased,
    totalPayable,
    purchaseCount,
    lastPurchase,
  };
};

const createSupplier = async (req, res) => {
  try {
    const { name, companyName, phone, address } = req.body;
    const supplier = await Supplier.create({ name, companyName, phone, address });
    res.status(201).json(supplier);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSuppliers = async (req, res) => {
  try {
    const suppliers = await Supplier.find({}).sort({ createdAt: -1 });
    const enriched = await Promise.all(suppliers.map(enrichSupplier));
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSupplierById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid Supplier ID' });
    const supplier = await Supplier.findById(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    const enriched = await enrichSupplier(supplier);
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateSupplier = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid Supplier ID' });
    const supplier = await Supplier.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    const enriched = await enrichSupplier(supplier);
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteSupplier = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) return res.status(400).json({ message: 'Invalid Supplier ID' });
    const supplier = await Supplier.findByIdAndDelete(req.params.id);
    if (!supplier) return res.status(404).json({ message: 'Supplier not found' });
    res.status(200).json({ message: 'Supplier removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSupplier, getSuppliers, getSupplierById, updateSupplier, deleteSupplier };