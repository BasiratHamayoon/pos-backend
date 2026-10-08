const express = require('express');
const { createBrand, getBrands, getBrandById, updateBrand, deleteBrand } = require('../controllers/brandController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').post(protect, createBrand).get(protect, getBrands);
router.route('/:id').get(protect, getBrandById).put(protect, updateBrand).delete(protect, deleteBrand);

module.exports = router;