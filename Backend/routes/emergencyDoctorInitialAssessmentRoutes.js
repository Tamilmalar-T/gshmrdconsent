const express = require('express');
const router = express.Router();
const emergencyDoctorInitialAssessmentController = require('../controllers/emergencyDoctorInitialAssessmentController');

router.post('/', emergencyDoctorInitialAssessmentController.createRecord);
router.get('/:patientId', emergencyDoctorInitialAssessmentController.getRecords);

module.exports = router;
