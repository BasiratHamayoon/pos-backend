const Brand = require('../models/Brand');

const createBrand = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const brandExists = await Brand.findOne({ name });
    if (brandExists) return res.status(400).json({ message: 'Brand already exists' });
    const brand = await Brand.create({ name, description, status });
    res.status(201).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBrands = async (req, res) => {
  try {
    const brands = await Brand.find({}).sort({ createdAt: -1 });
    res.status(200).json(brands);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBrandById = async (req, res) => {
  try {
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    res.status(200).json(brand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { name, description, status } = req.body;
    const brand = await Brand.findById(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });

    if (name && name !== brand.name) {
      const brandExists = await Brand.findOne({ name });
      if (brandExists) return res.status(400).json({ message: 'Brand name already exists' });
    }

    brand.name = name || brand.name;
    brand.description = description !== undefined ? description : brand.description;
    brand.status = status || brand.status;

    const updatedBrand = await brand.save();
    res.status(200).json(updatedBrand);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const brand = await Brand.findByIdAndDelete(req.params.id);
    if (!brand) return res.status(404).json({ message: 'Brand not found' });
    res.status(200).json({ message: 'Brand removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBrand, getBrands, getBrandById, updateBrand, deleteBrand };