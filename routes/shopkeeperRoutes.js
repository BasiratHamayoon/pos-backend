const express = require('express');
const router = express.Router();
const {
  getShopkeepers,
  getShopkeeperById,
  getShopkeeperHistory,
  createShopkeeper,
  updateShopkeeper,
  deleteShopkeeper,
} = require('../controllers/shopkeeperController');
const { protect } = require('../middlewares/authMiddleware');

router.route('/').get(protect, getShopkeepers).post(protect, createShopkeeper);
router.route('/:id/history').get(protect, getShopkeeperHistory);
router
  .route('/:id')
  .get(protect, getShopkeeperById)
  .put(protect, updateShopkeeper)
  .delete(protect, deleteShopkeeper);

module.exports = router;