const PatientModel = require('../models/patientModel');

// @desc    Create new patient
// @route   POST /api/patients
exports.createPatient = async (req, res) => {
  try {
    console.log('Received createPatient payload:', req.body);
    const newPatient = await PatientModel.createPatient(req.body);
    res.status(201).json({ success: true, data: newPatient });
  } catch (error) {
    console.error('Error creating patient:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get all patients
// @route   GET /api/patients
exports.getPatients = async (req, res) => {
  try {
    const patients = await PatientModel.getAllPatients();
    res.status(200).json({ success: true, data: patients });
  } catch (error) {
    console.error('Error fetching patients:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Get single patient
// @route   GET /api/patients/:id
exports.getPatientById = async (req, res) => {
  try {
    const patient = await PatientModel.getPatientById(req.params.id);
    if (!patient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, data: patient });
  } catch (error) {
    console.error('Error fetching patient:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Update a patient
// @route   PUT /api/patients/:ipNo
exports.updatePatient = async (req, res) => {
  try {
    const updatedPatient = await PatientModel.updatePatient(req.params.ipNo, req.body);
    if (!updatedPatient) {
      return res.status(404).json({ success: false, message: 'Patient not found' });
    }
    res.status(200).json({ success: true, data: updatedPatient });
  } catch (error) {
    console.error('Error updating patient:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};

// @desc    Delete a patient
// @route   DELETE /api/patients/:ipNo
exports.deletePatient = async (req, res) => {
  try {
    const deletedPatient = await PatientModel.deletePatient(req.params.ipNo);
    res.status(200).json({ 
      success: true, 
      message: 'Patient deleted successfully', 
      deletedRecord: deletedPatient || null 
    });
  } catch (error) {
    console.error('Error deleting patient:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
