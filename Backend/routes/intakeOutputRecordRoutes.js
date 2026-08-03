const express = require('express');
const router = express.Router();
const intakeOutputRecordController = require('../controllers/intakeOutputRecordController');

router.post('/', intakeOutputRecordController.createRecord);
router.get('/:patientId', intakeOutputRecordController.getRecords);

module.exports = router;
