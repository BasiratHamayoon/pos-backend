const mongoose = require('mongoose');
const VariantTemplate = require('../models/VariantTemplate');
const Unit = require('../models/Unit');

const createVariantTemplate = async (req, res) => {
  try {
    const { label, unitValue, unitId, description, status } = req.body;

    if (!label || !unitId) {
      return res.status(400).json({ message: 'Label and unitId are required' });
    }

    if (!mongoose.Types.ObjectId.isValid(unitId)) {
      return res.status(400).json({ message: 'Invalid Unit ID format' });
    }

    const unit = await Unit.findById(unitId);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    const exists = await VariantTemplate.findOne({ label });
    if (exists) return res.status(400).json({ message: 'Variant label already exists' });

    const variantTemplate = await VariantTemplate.create({
      label,
      unitValue: Number(unitValue) || 1,
      unit: unit._id,
      unitName: unit.name,
      unitSymbol: unit.symbol,
      description,
      status,
    });

    res.status(201).json(variantTemplate);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVariantTemplates = async (req, res) => {
  try {
    const variants = await VariantTemplate.find({}).sort({ createdAt: -1 });
    res.status(200).json(variants);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getVariantTemplateById = async (req, res) => {
  try {
    const variant = await VariantTemplate.findById(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant template not found' });
    res.status(200).json(variant);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateVariantTemplate = async (req, res) => {
  try {
    const { label, unitValue, unitId, description, status } = req.body;
    const variantTemplate = await VariantTemplate.findById(req.params.id);
    if (!variantTemplate) return res.status(404).json({ message: 'Variant template not found' });

    if (label && label !== variantTemplate.label) {
      const exists = await VariantTemplate.findOne({ label });
      if (exists) return res.status(400).json({ message: 'Variant label already exists' });
    }

    if (unitId && String(unitId) !== String(variantTemplate.unit)) {
      if (!mongoose.Types.ObjectId.isValid(unitId)) {
        return res.status(400).json({ message: 'Invalid Unit ID format' });
      }
      const unit = await Unit.findById(unitId);
      if (!unit) return res.status(404).json({ message: 'Unit not found' });
      variantTemplate.unit = unit._id;
      variantTemplate.unitName = unit.name;
      variantTemplate.unitSymbol = unit.symbol;
    }

    variantTemplate.label = label || variantTemplate.label;
    if (unitValue !== undefined) variantTemplate.unitValue = Number(unitValue);
    variantTemplate.description = description !== undefined ? description : variantTemplate.description;
    variantTemplate.status = status || variantTemplate.status;

    const updated = await variantTemplate.save();
    res.status(200).json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteVariantTemplate = async (req, res) => {
  try {
    const variant = await VariantTemplate.findByIdAndDelete(req.params.id);
    if (!variant) return res.status(404).json({ message: 'Variant template not found' });
    res.status(200).json({ message: 'Variant template removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  createVariantTemplate,
  getVariantTemplates,
  getVariantTemplateById,
  updateVariantTemplate,
  deleteVariantTemplate,
};