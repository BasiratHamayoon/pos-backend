const express = require('express');
const { getProfitLoss } = require('../controllers/analyticsController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/profit-loss', protect, getProfitLoss);

module.exports = router;