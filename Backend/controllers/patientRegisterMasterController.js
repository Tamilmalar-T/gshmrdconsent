const PatientRegisterMasterModel = require('../models/patientRegisterMasterModel');

exports.getAll = async (req, res) => {
  try {
    const data = await PatientRegisterMasterModel.getAll();
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error('Error fetching master data:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.create = async (req, res) => {
  try {
    const newRecord = await PatientRegisterMasterModel.create(req.body);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    console.error('Error creating master record:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.update = async (req, res) => {
  try {
    const updatedRecord = await PatientRegisterMasterModel.update(req.params.id, req.body);
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
    const deletedRecord = await PatientRegisterMasterModel.delete(req.params.id);
    res.status(200).json({ success: true, message: 'Record deleted', data: deletedRecord || null });
  } catch (error) {
    console.error('Error deleting master record:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
