const express = require('express');
const { getInvoices, getInvoiceById } = require('../controllers/invoiceController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.get('/', protect, getInvoices);
router.get('/:id', protect, getInvoiceById);

module.exports = router;