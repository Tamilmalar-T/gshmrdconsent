const ProgressSheetModel = require('../models/progressSheetModel');

exports.createRecord = async (req, res) => {
  try {
    const { patientId, formData } = req.body;
    if (!patientId || !formData) {
      return res.status(400).json({ success: false, message: 'patientId and formData are required' });
    }
    const newRecord = await ProgressSheetModel.create(patientId, formData);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    console.error('Error creating progressSheet:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const records = await ProgressSheetModel.getByPatientId(req.params.patientId);
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching progressSheet:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
