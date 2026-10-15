const express = require('express');
const {
  createUnit,
  getUnits,
  getUnitById,
  updateUnit,
  deleteUnit,
} = require('../controllers/unitController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').post(protect, createUnit).get(protect, getUnits);
router.route('/:id').get(protect, getUnitById).put(protect, updateUnit).delete(protect, deleteUnit);

module.exports = router;