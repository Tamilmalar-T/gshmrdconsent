const fs = require('fs');
const path = require('path');

const forms = [
  'vitalsChart',
  'nursesDailyAssessment',
  'nursingInitialAssessment',
  'activityRecordBilling',
  'intakeOutputRecord',
  'diabeticChart',
  'progressSheet',
  'consentGeneralAdmission',
  'nursesCarePlan',
  'labRequisition',
  'bpChart',
  'progressReassessmentRecord',
  'investigationChart',
  'internalTransferForm',
  'regularDrugPrescription'
];

const capitalize = (s) => s.charAt(0).toUpperCase() + s.slice(1);

forms.forEach(form => {
  const Form = capitalize(form);
  const tableName = form.toLowerCase(); // simplified table name logic

  // 1. Model
  const modelContent = `const pool = require('../db');

class ${Form}Model {
  static async create(patientId, formData) {
    const query = \`
      INSERT INTO ${tableName} (patient_id, form_data)
      VALUES ($1, $2)
      RETURNING *;
    \`;
    const { rows } = await pool.query(query, [patientId, formData]);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM ${tableName} WHERE patient_id = $1 ORDER BY created_at DESC;';
    const { rows } = await pool.query(query, [patientId]);
    return rows;
  }
}

module.exports = ${Form}Model;
`;
  fs.writeFileSync(path.join(__dirname, 'models', `${form}Model.js`), modelContent);

  // 2. Controller
  const controllerContent = `const ${Form}Model = require('../models/${form}Model');

exports.createRecord = async (req, res) => {
  try {
    const { patientId, formData } = req.body;
    if (!patientId || !formData) {
      return res.status(400).json({ success: false, message: 'patientId and formData are required' });
    }
    const newRecord = await ${Form}Model.create(patientId, formData);
    res.status(201).json({ success: true, data: newRecord });
  } catch (error) {
    console.error('Error creating ${form}:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getRecords = async (req, res) => {
  try {
    const records = await ${Form}Model.getByPatientId(req.params.patientId);
    res.status(200).json({ success: true, data: records });
  } catch (error) {
    console.error('Error fetching ${form}:', error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
`;
  fs.writeFileSync(path.join(__dirname, 'controllers', `${form}Controller.js`), controllerContent);

  // 3. Route
  const routeContent = `const express = require('express');
const router = express.Router();
const ${form}Controller = require('../controllers/${form}Controller');

router.post('/', ${form}Controller.createRecord);
router.get('/:patientId', ${form}Controller.getRecords);

module.exports = router;
`;
  fs.writeFileSync(path.join(__dirname, 'routes', `${form}Routes.js`), routeContent);
});

console.log('All modules generated successfully!');
