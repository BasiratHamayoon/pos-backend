const Sale = require('../models/Sale');
const Purchase = require('../models/Purchase');

const getProfitLoss = async (req, res) => {
  try {
    const sales = await Sale.find({}).sort({ createdAt: 1 });

    let totalRevenue = 0;
    let totalCost = 0;
    let totalDiscount = 0;

    const monthlyMap = {};
    const categoryMap = {};

    sales.forEach((sale) => {
      const date = new Date(sale.date || sale.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });

      if (!monthlyMap[monthYear]) {
        monthlyMap[monthYear] = {
          month: monthName,
          year: date.getFullYear(),
          revenue: 0,
          cost: 0,
          profit: 0,
          expenses: 0,
          netProfit: 0,
          sortKey: monthYear,
        };
      }

      totalRevenue += sale.totalAmount;
      totalDiscount += sale.discount || 0;
      monthlyMap[monthYear].revenue += sale.totalAmount;

      let saleCost = 0;
      sale.items.forEach((item) => {
        const itemCost = (item.costPrice || 0) * item.qty;
        const itemRev = item.total;
        const itemProfit = itemRev - itemCost;
        saleCost += itemCost;

        const catName = item.categoryName || 'Uncategorized';
        if (!categoryMap[catName]) {
          categoryMap[catName] = { name: catName, revenue: 0, cost: 0, profit: 0, qty: 0 };
        }
        categoryMap[catName].revenue += itemRev;
        categoryMap[catName].cost += itemCost;
        categoryMap[catName].profit += itemProfit;
        categoryMap[catName].qty += item.qty;
      });

      totalCost += saleCost;
      monthlyMap[monthYear].cost += saleCost;

      const saleProfit = sale.totalAmount - saleCost;
      monthlyMap[monthYear].profit += saleProfit;

      const estimatedExpenses = sale.totalAmount * 0.05;
      monthlyMap[monthYear].expenses += estimatedExpenses;
      monthlyMap[monthYear].netProfit = monthlyMap[monthYear].profit - estimatedExpenses;
    });

    const monthlyData = Object.values(monthlyMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    const categoryProfitData = Object.values(categoryMap)
      .map((cat) => ({
        ...cat,
        margin: cat.revenue > 0 ? Number(((cat.profit / cat.revenue) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.revenue - a.revenue);

    const totalExpenses = monthlyData.reduce((sum, m) => sum + m.expenses, 0);
    const totalNetProfit = monthlyData.reduce((sum, m) => sum + m.netProfit, 0);

    res.status(200).json({
      totalRevenue,
      totalCost,
      totalExpenses,
      totalNetProfit,
      monthlyData,
      categoryProfitData,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getPurchaseAnalytics = async (req, res) => {
  try {
    const purchases = await Purchase.find({}).sort({ createdAt: 1 });

    let totalSpent = 0;
    let totalPaid = 0;
    let totalDue = 0;
    let totalItems = 0;

    const monthlyMap = {};
    const supplierMap = {};

    purchases.forEach((p) => {
      const date = new Date(p.createdAt);
      const monthYear = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const monthName = date.toLocaleString('default', { month: 'short' });

      if (!monthlyMap[monthYear]) {
        monthlyMap[monthYear] = {
          month: monthName,
          year: date.getFullYear(),
          spent: 0,
          paid: 0,
          due: 0,
          orders: 0,
          sortKey: monthYear,
        };
      }

      monthlyMap[monthYear].spent += p.totalAmount || 0;
      monthlyMap[monthYear].paid += p.paidAmount || 0;
      monthlyMap[monthYear].due += p.dueAmount || 0;
      monthlyMap[monthYear].orders += 1;

      totalSpent += p.totalAmount || 0;
      totalPaid += p.paidAmount || 0;
      totalDue += p.dueAmount || 0;
      totalItems += p.itemsCount || 0;

      const supKey = String(p.supplier);
      if (!supplierMap[supKey]) {
        supplierMap[supKey] = { name: p.companyName, spent: 0, orders: 0 };
      }
      supplierMap[supKey].spent += p.totalAmount || 0;
      supplierMap[supKey].orders += 1;
    });

    const monthlyData = Object.values(monthlyMap).sort((a, b) => a.sortKey.localeCompare(b.sortKey));
    const topSuppliers = Object.values(supplierMap).sort((a, b) => b.spent - a.spent).slice(0, 5);

    res.status(200).json({
      totalSpent,
      totalPaid,
      totalDue,
      totalItems,
      totalOrders: purchases.length,
      monthlyData,
      topSuppliers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getProfitLoss, getPurchaseAnalytics };