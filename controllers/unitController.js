const Unit = require('../models/Unit');

const createUnit = async (req, res) => {
  try {
    const { name, symbol, description, status } = req.body;

    if (!name || !symbol) {
      return res.status(400).json({ message: 'Unit name and symbol are required' });
    }

    const unitExists = await Unit.findOne({ name: name.toLowerCase() });
    if (unitExists) return res.status(400).json({ message: 'Unit already exists' });

    const unit = await Unit.create({
      name: name.toLowerCase(),
      symbol,
      description,
      status,
    });
    res.status(201).json(unit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnits = async (req, res) => {
  try {
    const units = await Unit.find({}).sort({ createdAt: -1 });
    res.status(200).json(units);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUnitById = async (req, res) => {
  try {
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.status(200).json(unit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateUnit = async (req, res) => {
  try {
    const { name, symbol, description, status } = req.body;
    const unit = await Unit.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });

    if (name && name.toLowerCase() !== unit.name) {
      const unitExists = await Unit.findOne({ name: name.toLowerCase() });
      if (unitExists) return res.status(400).json({ message: 'Unit name already exists' });
    }

    unit.name = name ? name.toLowerCase() : unit.name;
    unit.symbol = symbol || unit.symbol;
    unit.description = description !== undefined ? description : unit.description;
    unit.status = status || unit.status;

    const updatedUnit = await unit.save();
    res.status(200).json(updatedUnit);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteUnit = async (req, res) => {
  try {
    const unit = await Unit.findByIdAndDelete(req.params.id);
    if (!unit) return res.status(404).json({ message: 'Unit not found' });
    res.status(200).json({ message: 'Unit removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createUnit, getUnits, getUnitById, updateUnit, deleteUnit };