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
    const {
      shopkeeperId,
      items,
      subtotal,
      discount,
      discountPercent,
      totalAmount,
      paidAmount,
      paymentMethod,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const safeTotalAmount = Number(totalAmount) || 0;
    let safePaidAmount = 0;
    let safeCreditAmount = 0;

    if (paymentMethod === 'cash') {
      safePaidAmount = safeTotalAmount;
      safeCreditAmount = 0;
    } else if (paymentMethod === 'credit') {
      safePaidAmount = 0;
      safeCreditAmount = safeTotalAmount;
    } else if (paymentMethod === 'partial') {
      safePaidAmount = Number(paidAmount) || 0;
      safeCreditAmount = Math.max(0, safeTotalAmount - safePaidAmount);
    }

    let shopkeeperData = {
      shopkeeper: null,
      shopkeeperName: 'Walk-in Customer',
      shopName: 'Walk-in',
      phone: '',
      address: '',
    };

    let shopkeeperDoc = null;

    if (shopkeeperId) {
      shopkeeperDoc = await Shopkeeper.findById(shopkeeperId);
      if (!shopkeeperDoc) {
        return res.status(404).json({ message: 'Shopkeeper not found' });
      }

      shopkeeperData = {
        shopkeeper: shopkeeperDoc._id,
        shopkeeperName: shopkeeperDoc.name,
        shopName: shopkeeperDoc.shopName,
        phone: shopkeeperDoc.phone || '',
        address: shopkeeperDoc.address || '',
      };
    }

    if ((paymentMethod === 'credit' || paymentMethod === 'partial') && !shopkeeperDoc) {
      return res.status(400).json({ message: 'Customer is required for credit or partial payment' });
    }

    const enrichedItems = [];

    for (const item of items) {
      const product = await Product.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.name || ''} not found` });
      }

      let variant = null;

      if (product.variants && product.variants.length > 0) {
        if (item.variantId) {
          variant = product.variants.find((v) => String(v._id) === String(item.variantId));
        }
        if (!variant && item.variantLabel) {
          variant = product.variants.find((v) => v.label === item.variantLabel);
        }
        if (!variant) {
          variant = product.variants[0];
        }
      }

      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || (variant ? variant.price : 0);
      const costPrice = Number(item.costPrice) || (variant ? Number(variant.costPrice) : 0) || 0;

      if (qty <= 0) {
        return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
      }

      if (variant) {
        if (variant.stock < qty) {
          return res.status(400).json({ message: `Insufficient stock for ${product.name} (${variant.label})` });
        }
        variant.stock -= qty;

        if (variant.stock <= 0) variant.status = 'out_of_stock';
        else if (variant.stock <= variant.minStock) variant.status = 'low_stock';
        else variant.status = 'in_stock';
      }

      await product.save();

      enrichedItems.push({
        productId: product._id,
        name: product.name,
        variantLabel: item.variantLabel || (variant ? variant.label : ''),
        brandName: product.brandName || '',
        categoryName: product.categoryName || '',
        unitValue: variant ? variant.unitValue : 1,
        unit: variant ? variant.unit : 'pcs',
        qty,
        price,
        costPrice,
        total: qty * price,
      });
    }

    const invoiceNo = await generateInvoiceNo();

    let status = 'paid';
    if (paymentMethod === 'credit') status = 'unpaid';
    else if (paymentMethod === 'partial') status = 'partial';

    const sale = await Sale.create({
      invoiceNo,
      ...shopkeeperData,
      items: enrichedItems,
      itemsCount: enrichedItems.length,
      subtotal: Number(subtotal) || 0,
      discount: Number(discount) || 0,
      discountPercent: Number(discountPercent) || 0,
      totalAmount: safeTotalAmount,
      paidAmount: safePaidAmount,
      creditAmount: safeCreditAmount,
      paymentMethod,
      status,
      createdBy: req.user._id,
    });

    if (shopkeeperDoc && safeCreditAmount > 0) {
      shopkeeperDoc.totalPurchases = (shopkeeperDoc.totalPurchases || 0) + safeTotalAmount;
      shopkeeperDoc.totalCredit = (shopkeeperDoc.totalCredit || 0) + safeCreditAmount;
      await shopkeeperDoc.save();
    } else if (shopkeeperDoc) {
      shopkeeperDoc.totalPurchases = (shopkeeperDoc.totalPurchases || 0) + safeTotalAmount;
      await shopkeeperDoc.save();
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