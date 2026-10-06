const mongoose = require('mongoose');
const Shopkeeper = require('../models/Shopkeeper');
const Sale = require('../models/Sale');

const enrichShopkeeper = async (shopkeeper) => {
  const sales = await Sale.find({ shopkeeper: shopkeeper._id });
  const totalPurchases = sales.reduce((sum, s) => sum + s.totalAmount, 0);
  const totalCredit = sales.reduce((sum, s) => sum + s.creditAmount, 0);
  const salesCount = sales.length;
  const lastSale = sales.length > 0 ? sales[sales.length - 1].createdAt : null;

  return {
    ...shopkeeper.toObject(),
    totalPurchases,
    totalCredit,
    salesCount,
    lastSale,
  };
};

const createShopkeeper = async (req, res) => {
  try {
    const { name, shopName, phone, address } = req.body;
    const shopkeeper = await Shopkeeper.create({ name, shopName, phone, address });
    res.status(201).json(shopkeeper);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getShopkeepers = async (req, res) => {
  try {
    const shopkeepers = await Shopkeeper.find({}).sort({ createdAt: -1 });
    const enriched = await Promise.all(shopkeepers.map(enrichShopkeeper));
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getShopkeeperById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Customer ID format' });
    }
    const shopkeeper = await Shopkeeper.findById(req.params.id);
    if (!shopkeeper) return res.status(404).json({ message: 'Shopkeeper not found' });
    const enriched = await enrichShopkeeper(shopkeeper);
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateShopkeeper = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Customer ID format' });
    }
    const { name, shopName, phone, address, status } = req.body;
    
    const shopkeeper = await Shopkeeper.findById(req.params.id);
    if (!shopkeeper) return res.status(404).json({ message: 'Shopkeeper not found' });

    if (name) shopkeeper.name = name;
    if (shopName) shopkeeper.shopName = shopName;
    if (phone) shopkeeper.phone = phone;
    if (address !== undefined) shopkeeper.address = address;
    if (status) shopkeeper.status = status;

    const updated = await shopkeeper.save();
    const enriched = await enrichShopkeeper(updated);
    res.status(200).json(enriched);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteShopkeeper = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Customer ID format' });
    }
    const shopkeeper = await Shopkeeper.findByIdAndDelete(req.params.id);
    if (!shopkeeper) return res.status(404).json({ message: 'Shopkeeper not found' });
    res.status(200).json({ message: 'Shopkeeper removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createShopkeeper, getShopkeepers, getShopkeeperById, updateShopkeeper, deleteShopkeeper };