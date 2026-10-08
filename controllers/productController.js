const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Brand = require('../models/Brand');

const createProduct = async (req, res) => {
  try {
    const { name, brandId, categoryId, variants } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ message: 'Product name and categoryId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(categoryId)) {
      return res.status(400).json({ message: 'Invalid Category ID format. Must be a 24-character hexadecimal ID.' });
    }

    const category = await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: 'Category not found' });

    let brandData = { brand: null, brandName: '' };
    if (brandId) {
      if (!mongoose.Types.ObjectId.isValid(brandId)) {
        return res.status(400).json({ message: 'Invalid Brand ID format. Must be a 24-character hexadecimal ID.' });
      }
      const brand = await Brand.findById(brandId);
      if (!brand) return res.status(404).json({ message: 'Brand not found' });
      brandData = { brand: brand._id, brandName: brand.name };
    }

    if (!variants || !Array.isArray(variants) || variants.length === 0) {
      return res.status(400).json({ message: 'At least one variant in the variants array is required' });
    }

    const product = await Product.create({
      name,
      ...brandData,
      category: category._id,
      categoryName: category.name,
      variants,
    });

    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProducts = async (req, res) => {
  try {
    const products = await Product.find({}).sort({ createdAt: -1 });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getProductById = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Product ID format' });
    }
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Product ID format' });
    }

    const { name, brandId, categoryId, variants } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (categoryId && categoryId !== String(product.category)) {
      if (!mongoose.Types.ObjectId.isValid(categoryId)) {
        return res.status(400).json({ message: 'Invalid Category ID format' });
      }
      const category = await Category.findById(categoryId);
      if (!category) return res.status(404).json({ message: 'Category not found' });
      product.category = category._id;
      product.categoryName = category.name;
    }

    if (brandId !== undefined) {
      if (!brandId) {
        product.brand = null;
        product.brandName = '';
      } else {
        if (!mongoose.Types.ObjectId.isValid(brandId)) {
          return res.status(400).json({ message: 'Invalid Brand ID format' });
        }
        const brand = await Brand.findById(brandId);
        if (!brand) return res.status(404).json({ message: 'Brand not found' });
        product.brand = brand._id;
        product.brandName = brand.name;
      }
    }

    product.name = name || product.name;
    if (variants && Array.isArray(variants)) {
      product.variants = variants;
    }

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ message: 'Invalid Product ID format' });
    }
    const product = await Product.findByIdAndDelete(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createProduct, getProducts, getProductById, updateProduct, deleteProduct };