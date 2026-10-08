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
      creditAmount,
      paymentMethod,
    } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ message: 'Cart is empty' });
    }

    const safeSubtotal = Number(subtotal) || 0;
    const safeDiscount = Number(discount) || 0;
    const safeDiscountPercent = Number(discountPercent) || 0;
    const safeTotalAmount = Number(totalAmount) || 0;
    const safePaidAmount = Number(paidAmount) || 0;
    let safeCreditAmount = Number(creditAmount) || 0;

    if (paymentMethod === 'cash') safeCreditAmount = 0;
    else if (paymentMethod === 'credit') safeCreditAmount = safeTotalAmount;
    else if (paymentMethod === 'partial') safeCreditAmount = Math.max(0, safeTotalAmount - safePaidAmount);

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
      if (!shopkeeperDoc) return res.status(404).json({ message: 'Shopkeeper not found' });
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
      if (!product) return res.status(404).json({ message: `Product ${item.name || ''} not found` });

      const variantLabel = item.variantLabel;
      const variant = product.variants.find(v => v.label === variantLabel);
      if (!variant) return res.status(404).json({ message: `Variant ${variantLabel} not found` });

      const qty = Number(item.qty) || 0;
      const price = Number(item.price) || variant.price;

      if (qty <= 0) return res.status(400).json({ message: `Invalid quantity for ${product.name}` });
      if (variant.stock < qty) return res.status(400).json({ message: `Insufficient stock for ${product.name} ${variant.label}` });

      variant.stock -= qty;
      if (variant.stock <= 0) variant.status = 'out_of_stock';
      else if (variant.stock <= variant.minStock) variant.status = 'low_stock';
      else variant.status = 'in_stock';

      await product.save();

      enrichedItems.push({
        productId: product._id,
        variantLabel: variant.label,
        name: product.name,
        brandName: product.brandName,
        categoryName: product.categoryName,
        unitValue: variant.unitValue,
        unit: variant.unit,
        qty,
        price,
        costPrice: variant.costPrice,
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
      subtotal: safeSubtotal,
      discount: safeDiscount,
      discountPercent: safeDiscountPercent,
      totalAmount: safeTotalAmount,
      paidAmount: paymentMethod === 'credit' ? 0 : safePaidAmount,
      creditAmount: safeCreditAmount,
      paymentMethod,
      status,
      createdBy: req.user._id,
    });

    if (shopkeeperDoc) {
      shopkeeperDoc.totalPurchases = (shopkeeperDoc.totalPurchases || 0) + safeTotalAmount;
      shopkeeperDoc.totalCredit = (shopkeeperDoc.totalCredit || 0) + safeCreditAmount;
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