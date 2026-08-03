const express = require('express');
const router = express.Router();
const regularDrugPrescriptionController = require('../controllers/regularDrugPrescriptionController');

router.post('/', regularDrugPrescriptionController.createRecord);
router.get('/:patientId', regularDrugPrescriptionController.getRecords);

module.exports = router;
