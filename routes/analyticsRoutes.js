const express = require('express');
const { getProfitLoss, getPurchaseAnalytics } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profit-loss', protect, getProfitLoss);
router.get('/purchase', protect, getPurchaseAnalytics);

module.exports = router;