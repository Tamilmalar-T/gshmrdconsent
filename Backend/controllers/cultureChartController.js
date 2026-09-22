const CultureChartModel = require('../models/cultureChartModel');

const saveRecord = async (req, res) => {
  const { patientId, formData } = req.body;
  try {
    const newRecord = await CultureChartModel.create(patientId, formData);
    res.status(201).json(newRecord);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to save Culture Chart record' });
  }
};

const getRecords = async (req, res) => {
  const { patientId } = req.params;
  try {
    const records = await CultureChartModel.getByPatientId(patientId);
    res.status(200).json(records);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to retrieve Culture Chart records' });
  }
};

module.exports = { saveRecord, getRecords };
