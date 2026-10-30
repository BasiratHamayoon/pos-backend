const Shopkeeper = require('../models/Shopkeeper');
const Sale = require('../models/Sale');
const CreditPayment = require('../models/CreditPayment');

// ─────────────────────────────────────────────
// Build a live credit snapshot for a shopkeeper
// ─────────────────────────────────────────────
const buildCreditRecord = async (shopkeeper) => {
  // Only fetch sales that STILL have outstanding credit
  const openSales = await Sale.find({
    shopkeeper: shopkeeper._id,
    creditAmount: { $gt: 0 },
  }).sort({ createdAt: 1 });

  // All payment receipts ever recorded
  const payments = await CreditPayment.find({
    shopkeeper: shopkeeper._id,
  }).sort({ createdAt: -1 });

  const totalOutstanding = openSales.reduce(
    (sum, s) => sum + (Number(s.creditAmount) || 0),
    0
  );
  const totalPaid = payments.reduce(
    (sum, p) => sum + (Number(p.amount) || 0),
    0
  );
  const totalCreditGiven = totalOutstanding + totalPaid;

  const lastPayment = payments[0] || null;

  let status = 'paid';
  if (totalOutstanding > 0) {
    status = 'pending';
  }

  // Keep shopkeeper.totalCredit in sync
  if (shopkeeper.totalCredit !== totalOutstanding) {
    shopkeeper.totalCredit = totalOutstanding;
    await shopkeeper.save();
  }

  return {
    _id: shopkeeper._id,
    shopkeeperId: shopkeeper._id,
    shopkeeperName: shopkeeper.name,
    shopName: shopkeeper.shopName,
    phone: shopkeeper.phone || '',
    address: shopkeeper.address || '',
    totalCredit: totalOutstanding,
    totalCreditGiven,
    totalPaid,
    lastPayment: lastPayment ? lastPayment.amount : 0,
    lastPaymentDate: lastPayment ? lastPayment.createdAt : null,
    invoices: openSales.map((s) => s.invoiceNo),
    salesCount: openSales.length,
    status,
  };
};

// ─────────────────────────────────────────────
// GET /api/credits
// ─────────────────────────────────────────────
const getCredits = async (req, res) => {
  try {
    const shopkeepers = await Shopkeeper.find({}).sort({ name: 1 });
    const credits = await Promise.all(
      shopkeepers.map(buildCreditRecord)
    );
    res.status(200).json(credits);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ─────────────────────────────────────────────
// GET /api/credits/:id
// ─────────────────────────────────────────────
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

// ─────────────────────────────────────────────
// POST /api/credits/payment
// ─────────────────────────────────────────────
const processPayment = async (req, res) => {
  try {
    const { shopkeeperId, amount } = req.body;
    const payAmount = Number(amount) || 0;

    if (payAmount <= 0) {
      return res
        .status(400)
        .json({ message: 'Payment amount must be greater than 0' });
    }

    const shopkeeper = await Shopkeeper.findById(shopkeeperId);
    if (!shopkeeper) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    const current = await buildCreditRecord(shopkeeper);

    if (payAmount > current.totalCredit) {
      return res
        .status(400)
        .json({ message: 'Payment cannot exceed outstanding credit' });
    }

    // ── Step 1: Record the payment receipt ──
    await CreditPayment.create({
      shopkeeper: shopkeeper._id,
      amount: payAmount,
      createdBy: req.user._id,
    });

    // ── Step 2: Settle open sales FIFO (oldest first) ──
    const openSales = await Sale.find({
      shopkeeper: shopkeeper._id,
      creditAmount: { $gt: 0 },
    }).sort({ createdAt: 1 });

    let remaining = payAmount;

    for (const sale of openSales) {
      if (remaining <= 0) break;

      const saleCredit = Number(sale.creditAmount) || 0;
      if (saleCredit <= 0) continue;

      if (remaining >= saleCredit) {
        // Fully settle this invoice
        sale.creditAmount = 0;
        sale.status = 'paid';
        remaining -= saleCredit;
      } else {
        // Partially settle this invoice
        sale.creditAmount = saleCredit - remaining;
        sale.status = 'partial';
        remaining = 0;
      }

      await sale.save();
    }

    // ── Step 3: Return the fresh credit snapshot ──
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