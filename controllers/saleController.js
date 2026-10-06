const Sale = require('../models/Sale');
const Product = require('../models/Product');
const Shopkeeper = require('../models/Shopkeeper');

const generateInvoiceNo = async () => {
  const count = await Sale.countDocuments();
  const randomPart = Math.floor(1000 + Math.random() * 9000);
  return `${1000 + count + 1}${randomPart.toString().slice(-2)}`;
};

const createSale = async (req, res) => {
  try {
    const { shopkeeperId, items, subtotal, discount, discountPercent, totalAmount, paidAmount, creditAmount, paymentMethod } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let shopkeeperData = { shopkeeper: null, shopkeeperName: 'Walk-in Customer', shopName: 'Walk-in', phone: '', address: '' };

    if (shopkeeperId) {
      const sk = await Shopkeeper.findById(shopkeeperId);
      if (!sk) return res.status(404).json({ message: 'Shopkeeper not found' });
      shopkeeperData = {
        shopkeeper: sk._id,
        shopkeeperName: sk.name,
        shopName: sk.shopName,
        phone: sk.phone,
        address: sk.address,
      };
    }

    const enrichedItems = [];
    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) return res.status(404).json({ message: `Product ${item.name} not found` });
      if (product.stock < item.qty) {
        return res.status(400).json({ message: `Insufficient stock for ${product.name}` });
      }

      product.stock -= item.qty;
      if (product.stock <= 0) product.status = 'out_of_stock';
      else if (product.stock <= product.minStock) product.status = 'low_stock';
      else product.status = 'in_stock';
      await product.save();

      enrichedItems.push({
        productId: product._id,
        name: product.name,
        brand: product.brand,
        unitValue: product.unitValue,
        unit: product.unit,
        qty: item.qty,
        price: item.price,
        costPrice: product.costPrice,
        total: item.qty * item.price,
      });
    }

    const invoiceNo = await generateInvoiceNo();

    let status = 'completed';
    if (paymentMethod === 'credit') status = 'unpaid';
    else if (paymentMethod === 'partial') status = 'partial';
    else status = 'paid';

    const sale = await Sale.create({
      invoiceNo,
      ...shopkeeperData,
      items: enrichedItems,
      itemsCount: enrichedItems.length,
      subtotal,
      discount,
      discountPercent,
      totalAmount,
      paidAmount,
      creditAmount,
      paymentMethod,
      status,
      createdBy: req.user._id,
    });

    if (shopkeeperId && (creditAmount > 0 || paymentMethod !== 'credit')) {
      await Shopkeeper.findByIdAndUpdate(shopkeeperId, {
        $inc: {
          totalCredit: creditAmount,
          totalPurchases: totalAmount,
        },
      });
    }

    res.status(201).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSales = async (req, res) => {
  try {
    const sales = await Sale.find({}).sort({ createdAt: -1 });
    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getSaleById = async (req, res) => {
  try {
    const sale = await Sale.findById(req.params.id);
    if (!sale) return res.status(404).json({ message: 'Sale not found' });
    res.status(200).json(sale);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createSale, getSales, getSaleById };