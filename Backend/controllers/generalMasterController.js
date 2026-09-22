const GeneralMasterModel = require('../models/generalMasterModel');

exports.getAll = async (req, res) => {
  try {
    const data = await GeneralMasterModel.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.create = async (req, res) => {
  try {
    const newRecord = await GeneralMasterModel.create(req.body);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    console.error('Error creating master record:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.update = async (req, res) => {
  try {
    const updatedRecord = await GeneralMasterModel.update(req.params.id, req.body);
    if (!updatedRecord) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    res.status(200).json({ success: true, data: updatedRecord });
  } catch (error) {
    console.error('Error updating master record:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.delete = async (req, res) => {
  try {
    const deletedRecord = await GeneralMasterModel.delete(req.params.id);
    if (!deletedRecord) {
      return res.status(404).json({ success: false, message: 'Record not found' });
    }
    res.status(200).json({ success: true, message: 'Record deleted' });
  } catch (error) {
    console.error('Error deleting master record:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getCategories = async (req, res) => {
  try {
    const categories = await GeneralMasterModel.getCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.addCategory = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name) return res.status(400).json({ success: false, message: 'Name is required' });
    const category = await GeneralMasterModel.addCategory(name);
    res.status(201).json({ success: true, data: category });
  } catch (error) {
    console.error('Error adding category:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const deleted = await GeneralMasterModel.deleteCategory(req.params.id);
    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }
    res.status(200).json({ success: true, message: 'Category deleted' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
