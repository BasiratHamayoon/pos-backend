const express = require('express');
const {
  createVariantTemplate,
  getVariantTemplates,
  getVariantTemplateById,
  updateVariantTemplate,
  deleteVariantTemplate,
} = require('../controllers/variantTemplateController');
const { protect } = require('../middlewares/authMiddleware');

const router = express.Router();

router.route('/').post(protect, createVariantTemplate).get(protect, getVariantTemplates);
router.route('/:id')
  .get(protect, getVariantTemplateById)
  .put(protect, updateVariantTemplate)
  .delete(protect, deleteVariantTemplate);

module.exports = router;