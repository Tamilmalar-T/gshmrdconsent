const OpRegisterModel = require('../models/opRegisterModel');

// @desc    Register new OP Patient
// @route   POST /api/op-register
exports.createOpPatient = async (req, res) => {
  try {
    const record = await OpRegisterModel.create(req.body);
    res.status(201).json({
      success: true,
      message: 'OP Patient registered successfully in PostgreSQL',
      data: record
    });
  } catch (error) {
    console.error('Error creating OP Patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save OP registration',
      error: error.message
    });
  }
};

// @desc    Get all OP Registered Patients
// @route   GET /api/op-register
exports.getAllOpPatients = async (req, res) => {
  try {
    const records = await OpRegisterModel.getAll();
    res.status(200).json({
      success: true,
      count: records.length,
      data: records
    });
  } catch (error) {
    console.error('Error fetching OP Patients:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve OP patients',
      error: error.message
    });
  }
};

// @desc    Get single OP Patient by ID / Patient ID / UHID
// @route   GET /api/op-register/:id
exports.getOpPatientById = async (req, res) => {
  try {
    const record = await OpRegisterModel.getById(req.params.id);
    if (!record) {
      return res.status(404).json({
        success: false,
        message: 'OP Patient not found'
      });
    }
    res.status(200).json({
      success: true,
      data: record
    });
  } catch (error) {
    console.error('Error fetching OP Patient by ID:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch OP patient record',
      error: error.message
    });
  }
};

// @desc    Update OP Patient
// @route   PUT /api/op-register/:id
exports.updateOpPatient = async (req, res) => {
  try {
    const updated = await OpRegisterModel.update(req.params.id, req.body);
    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'OP Patient not found for update'
      });
    }
    res.status(200).json({
      success: true,
      message: 'OP Patient updated successfully in PostgreSQL',
      data: updated
    });
  } catch (error) {
    console.error('Error updating OP Patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update OP patient',
      error: error.message
    });
  }
};

// @desc    Delete OP Patient
// @route   DELETE /api/op-register/:id
exports.deleteOpPatient = async (req, res) => {
  try {
    const deleted = await OpRegisterModel.delete(req.params.id);
    res.status(200).json({
      success: true,
      message: 'OP Patient deleted successfully',
      data: deleted || null
    });
  } catch (error) {
    console.error('Error deleting OP Patient:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete OP patient',
      error: error.message
    });
  }
};
