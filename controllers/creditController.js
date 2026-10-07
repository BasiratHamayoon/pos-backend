const Shopkeeper = require('../models/Shopkeeper');
const Sale = require('../models/Sale');
const CreditPayment = require('../models/CreditPayment');

const buildCreditRecord = async (shopkeeper) => {
  const sales = await Sale.find({
    shopkeeper: shopkeeper._id,
    creditAmount: { $gt: 0 },
  }).sort({ createdAt: -1 });

  const payments = await CreditPayment.find({
    shopkeeper: shopkeeper._id,
  }).sort({ createdAt: -1 });

  const totalCreditGiven = sales.reduce((sum, s) => sum + (Number(s.creditAmount) || 0), 0);
  const totalPaid = payments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);
  const outstanding = Math.max(0, totalCreditGiven - totalPaid);

  const lastPayment = payments[0] || null;

  let status = 'paid';
  if (outstanding > 0) {
    status = 'pending';
  }

  if (shopkeeper.totalCredit !== outstanding) {
    shopkeeper.totalCredit = outstanding;
    await shopkeeper.save();
  }

  return {
    _id: shopkeeper._id,
    shopkeeperId: shopkeeper._id,
    shopkeeperName: shopkeeper.name,
    shopName: shopkeeper.shopName,
    phone: shopkeeper.phone || '',
    address: shopkeeper.address || '',
    totalCredit: outstanding,
    totalCreditGiven,
    totalPaid,
    lastPayment: lastPayment ? lastPayment.amount : 0,
    lastPaymentDate: lastPayment ? lastPayment.createdAt : null,
    invoices: sales.map((s) => s.invoiceNo),
    salesCount: sales.length,
    status,
  };
};

const getCredits = async (req, res) => {
  try {
    const shopkeepers = await Shopkeeper.find({}).sort({ name: 1 });
    const credits = await Promise.all(shopkeepers.map(buildCreditRecord));
    res.status(200).json(credits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getCreditById = async (req, res) => {
  try {
    const shopkeeper = await Shopkeeper.findById(req.params.id);
    if (!shopkeeper) {
      return res.status(404).json({ message: 'Credit record not found' });
    }

    const credit = await buildCreditRecord(shopkeeper);
    res.status(200).json(credit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const processPayment = async (req, res) => {
  try {
    const { shopkeeperId, amount } = req.body;
    const payAmount = Number(amount) || 0;

    const shopkeeper = await Shopkeeper.findById(shopkeeperId);
    if (!shopkeeper) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const current = await buildCreditRecord(shopkeeper);

    if (payAmount <= 0) {
      return res.status(400).json({ message: 'Payment amount must be greater than 0' });
    }

    if (payAmount > current.totalCredit) {
      return res.status(400).json({ message: 'Payment cannot exceed outstanding credit' });
    }

    await CreditPayment.create({
      shopkeeper: shopkeeper._id,
      amount: payAmount,
      createdBy: req.user._id,
    });

    const updated = await buildCreditRecord(shopkeeper);
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getCredits,
  getCreditById,
  processPayment,
};