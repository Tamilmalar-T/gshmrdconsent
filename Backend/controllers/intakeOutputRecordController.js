const IntakeOutputRecordModel = require('../models/intakeOutputRecordModel');

exports.createRecord = async (req, res) => {
  try {
    const { patientId, formData } = req.body;
    if (!patientId || !formData) {
      return res.status(400).json({ success: false, message: 'patientId and formData are required' });
    }
    const newRecord = await IntakeOutputRecordModel.create(patientId, formData);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    console.error('Error creating intakeOutputRecord:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const records = await IntakeOutputRecordModel.getByPatientId(req.params.patientId);
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching intakeOutputRecord:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
