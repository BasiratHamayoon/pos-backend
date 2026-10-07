const express = require('express');
const { getCredits, getCreditById, processPayment } = require('../controllers/creditController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getCredits);
router.get('/:id', protect, getCreditById);
router.post('/payment', protect, processPayment);

module.exports = router;