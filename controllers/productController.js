const Product = require('../models/Product');
const Category = require('../models/Category');

const createProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      categoryId,
      price,
      costPrice,
      stock,
      minStock,
      unitValue,
      unit,
    } = req.body;

    const category = await Category.findById(categoryId);
    if (!category) {
      return res.status(404).json({ message: 'Category not found' });
    }

    const product = await Product.create({
      name,
      brand,
      category: category._id,
      categoryName: category.name,
      price,
      costPrice,
      stock,
      minStock,
      unitValue,
      unit,
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
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateProduct = async (req, res) => {
  try {
    const {
      name,
      brand,
      categoryId,
      price,
      costPrice,
      stock,
      minStock,
      unitValue,
      unit,
    } = req.body;

    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    if (categoryId && categoryId !== String(product.category)) {
      const category = await Category.findById(categoryId);
      if (!category) {
        return res.status(404).json({ message: 'Category not found' });
      }
      product.category = category._id;
      product.categoryName = category.name;
    }

    product.name = name || product.name;
    product.brand = brand !== undefined ? brand : product.brand;
    product.price = price !== undefined ? price : product.price;
    product.costPrice = costPrice !== undefined ? costPrice : product.costPrice;
    product.stock = stock !== undefined ? stock : product.stock;
    product.minStock = minStock !== undefined ? minStock : product.minStock;
    product.unitValue = unitValue !== undefined ? unitValue : product.unitValue;
    product.unit = unit || product.unit;

    if (product.stock <= 0) {
      product.status = 'out_of_stock';
    } else if (product.stock <= product.minStock) {
      product.status = 'low_stock';
    } else {
      product.status = 'in_stock';
    }

    const updatedProduct = await product.save();
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }

    await product.deleteOne();
    res.status(200).json({ message: 'Product removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createProduct,
  getProducts,
  getProductById,
  updateProduct,
  deleteProduct,
};