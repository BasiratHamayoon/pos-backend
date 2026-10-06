const express = require('express');
const { createSale, getSales, getSaleById } = require('../controllers/saleController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').post(protect, createSale).get(protect, getSales);
router.route('/:id').get(protect, getSaleById);

module.exports = router;