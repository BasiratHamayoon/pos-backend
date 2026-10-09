const express = require('express');
const { createPurchase, getPurchases, getPurchaseById } = require('../controllers/purchaseController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();
router.route('/').post(protect, createPurchase).get(protect, getPurchases);
router.route('/:id').get(protect, getPurchaseById);
module.exports = router;