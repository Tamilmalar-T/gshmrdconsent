const express = require('express');
const router = express.Router();
const nursesDailyAssessmentController = require('../controllers/nursesDailyAssessmentController');

router.post('/', nursesDailyAssessmentController.createRecord);
router.get('/:patientId', nursesDailyAssessmentController.getRecords);

module.exports = router;
