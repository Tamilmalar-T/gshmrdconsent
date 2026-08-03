const express = require('express');
const router = express.Router();
const progressReassessmentRecordController = require('../controllers/progressReassessmentRecordController');

router.post('/', progressReassessmentRecordController.createRecord);
router.get('/:patientId', progressReassessmentRecordController.getRecords);

module.exports = router;
