const express = require('express');
const { createShopkeeper, getShopkeepers, getShopkeeperById, updateShopkeeper, deleteShopkeeper } = require('../controllers/shopkeeperController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').post(protect, createShopkeeper).get(protect, getShopkeepers);
router.route('/:id').get(protect, getShopkeeperById).put(protect, updateShopkeeper).delete(protect, deleteShopkeeper);

module.exports = router;