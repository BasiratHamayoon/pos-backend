const Shopkeeper = require('../models/Shopkeeper');
const Sale = require('../models/Sale');
const CreditPayment = require('../models/CreditPayment');

const getShopkeepers = async (req, res) => {
  try {
    const shopkeepers = await Shopkeeper.find({}).sort({ name: 1 });
    res.status(200).json(shopkeepers);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getShopkeeperById = async (req, res) => {
  try {
    const shopkeeper = await Shopkeeper.findById(req.params.id);
    if (!shopkeeper) {
      return res.status(404).json({ message: 'Shopkeeper not found' });
    }
    res.status(200).json(shopkeeper);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getShopkeeperHistory = async (req, res) => {
  try {
    const shopkeeper = await Shopkeeper.findById(req.params.id);
    if (!shopkeeper) {
      return res.status(404).json({ message: 'Shopkeeper not found' });
    }

    const sales = await Sale.find({ shopkeeper: shopkeeper._id }).sort({ createdAt: -1 });
    const payments = await CreditPayment.find({ shopkeeper: shopkeeper._id }).sort({ createdAt: -1 });

    const totalSales = sales.length;
    const totalSpent = sales.reduce((sum, s) => sum + (Number(s.totalAmount) || 0), 0);
    const totalPaidOnSales = sales.reduce((sum, s) => sum + (Number(s.paidAmount) || 0), 0);
    const totalCreditPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
    const totalPaid = totalPaidOnSales + totalCreditPaid;
    const outstandingCredit = sales.reduce((sum, s) => sum + (Number(s.creditAmount) || 0), 0);

    const paidInvoices = sales.filter((s) => s.status === 'paid').length;
    const partialInvoices = sales.filter((s) => s.status === 'partial').length;
    const unpaidInvoices = sales.filter((s) => s.status === 'unpaid').length;

    const itemsPurchased = {};
    sales.forEach((sale) => {
      (sale.items || []).forEach((item) => {
        const key = item.productName || 'Unknown';
        if (!itemsPurchased[key]) {
          itemsPurchased[key] = { name: key, quantity: 0, total: 0 };
        }
        itemsPurchased[key].quantity += Number(item.quantity) || 0;
        itemsPurchased[key].total += Number(item.subtotal || item.total || 0);
      });
    });
    const topProducts = Object.values(itemsPurchased)
      .sort((a, b) => b.total - a.total)
      .slice(0, 10);

    const timeline = [];
    sales.forEach((s) => {
      timeline.push({
        type: 'sale',
        date: s.createdAt,
        invoiceNo: s.invoiceNo,
        amount: s.totalAmount,
        paid: s.paidAmount || 0,
        credit: s.creditAmount || 0,
        status: s.status,
        itemCount: (s.items || []).length,
        refId: s._id,
      });
    });
    payments.forEach((p) => {
      timeline.push({
        type: 'payment',
        date: p.createdAt,
        amount: p.amount,
        refId: p._id,
      });
    });
    timeline.sort((a, b) => new Date(b.date) - new Date(a.date));

    const firstSaleDate = sales.length > 0 ? sales[sales.length - 1].createdAt : null;
    const lastSaleDate = sales.length > 0 ? sales[0].createdAt : null;
    const lastPaymentDate = payments.length > 0 ? payments[0].createdAt : null;
    const lastPaymentAmount = payments.length > 0 ? payments[0].amount : 0;

    res.status(200).json({
      shopkeeper: {
        _id: shopkeeper._id,
        name: shopkeeper.name,
        shopName: shopkeeper.shopName,
        phone: shopkeeper.phone || '',
        address: shopkeeper.address || '',
        createdAt: shopkeeper.createdAt,
      },
      stats: {
        totalSales,
        totalSpent,
        totalPaid,
        totalCreditPaid,
        outstandingCredit,
        paidInvoices,
        partialInvoices,
        unpaidInvoices,
        firstSaleDate,
        lastSaleDate,
        lastPaymentDate,
        lastPaymentAmount,
      },
      sales,
      payments,
      topProducts,
      timeline,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const createShopkeeper = async (req, res) => {
  try {
    const { name, shopName, phone, address } = req.body;
    if (!name || !shopName) {
      return res.status(400).json({ message: 'Name and shop name are required' });
    }
    const shopkeeper = await Shopkeeper.create({ name, shopName, phone, address });
    res.status(201).json(shopkeeper);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateShopkeeper = async (req, res) => {
  try {
    const shopkeeper = await Shopkeeper.findById(req.params.id);
    if (!shopkeeper) {
      return res.status(404).json({ message: 'Shopkeeper not found' });
    }
    shopkeeper.name = req.body.name || shopkeeper.name;
    shopkeeper.shopName = req.body.shopName || shopkeeper.shopName;
    shopkeeper.phone = req.body.phone ?? shopkeeper.phone;
    shopkeeper.address = req.body.address ?? shopkeeper.address;
    const updated = await shopkeeper.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteShopkeeper = async (req, res) => {
  try {
    const shopkeeper = await Shopkeeper.findById(req.params.id);
    if (!shopkeeper) {
      return res.status(404).json({ message: 'Shopkeeper not found' });
    }
    await shopkeeper.deleteOne();
    res.status(200).json({ message: 'Shopkeeper deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getShopkeepers,
  getShopkeeperById,
  getShopkeeperHistory,
  createShopkeeper,
  updateShopkeeper,
  deleteShopkeeper,
};