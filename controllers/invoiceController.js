const mongoose = require('mongoose');
const Sale = require('../models/Sale');
const CreditPayment = require('../models/CreditPayment');

const buildInvoiceRecord = async (sale) => {
  let effectivePaidAmount = sale.paidAmount;
  let effectiveCreditAmount = sale.creditAmount;
  let effectiveStatus = sale.status;

  if (sale.shopkeeper && sale.creditAmount > 0) {
    const allSalesWithCredit = await Sale.find({
      shopkeeper: sale.shopkeeper,
      createdAt: { $lte: sale.createdAt },
      creditAmount: { $gt: 0 },
    }).sort({ createdAt: 1 });

    const totalCreditUpToThisSale = allSalesWithCredit.reduce(
      (sum, s) => sum + (Number(s.creditAmount) || 0),
      0
    );

    const payments = await CreditPayment.find({
      shopkeeper: sale.shopkeeper,
      createdAt: { $lte: new Date() },
    });

    const totalPayments = payments.reduce(
      (sum, p) => sum + (Number(p.amount) || 0),
      0
    );

    const paymentsAppliedToPriorSales = allSalesWithCredit
      .filter((s) => String(s._id) !== String(sale._id))
      .reduce((sum, s) => sum + (Number(s.creditAmount) || 0), 0);

    const remainingPaymentsForThisSale = Math.max(
      0,
      totalPayments - paymentsAppliedToPriorSales
    );

    const paidTowardsThisCreditPortion = Math.min(
      sale.creditAmount,
      remainingPaymentsForThisSale
    );

    effectivePaidAmount = sale.paidAmount + paidTowardsThisCreditPortion;
    effectiveCreditAmount = Math.max(0, sale.creditAmount - paidTowardsThisCreditPortion);

    if (effectiveCreditAmount <= 0) {
      effectiveStatus = 'paid';
    } else if (effectivePaidAmount > 0) {
      effectiveStatus = 'partial';
    } else {
      effectiveStatus = 'unpaid';
    }
  }

  return {
    _id: sale._id,
    invoiceNo: sale.invoiceNo,
    saleId: sale._id,
    shopkeeper: sale.shopkeeper,
    shopkeeperName: sale.shopkeeperName,
    shopName: sale.shopName,
    phone: sale.phone,
    address: sale.address,
    items: sale.items,
    itemsCount: sale.itemsCount,
    subtotal: sale.subtotal,
    discount: sale.discount,
    discountPercent: sale.discountPercent,
    totalAmount: sale.totalAmount,
    paidAmount: effectivePaidAmount,
    creditAmount: effectiveCreditAmount,
    paymentMethod: sale.paymentMethod,
    status: effectiveStatus,
    date: sale.createdAt,
    createdAt: sale.createdAt,
    updatedAt: sale.updatedAt,
  };
};

const getInvoices = async (req, res) => {
  try {
    const sales = await Sale.find({}).sort({ createdAt: -1 });
    const invoices = await Promise.all(sales.map(buildInvoiceRecord));
    res.status(200).json(invoices);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getInvoiceById = async (req, res) => {
  try {
    const { id } = req.params;
    let sale;

    if (mongoose.Types.ObjectId.isValid(id)) {
      sale = await Sale.findById(id);
    }

    if (!sale) {
      sale = await Sale.findOne({ invoiceNo: id });
    }

    if (!sale) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    const invoice = await buildInvoiceRecord(sale);
    res.status(200).json(invoice);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getInvoices,
  getInvoiceById,
};