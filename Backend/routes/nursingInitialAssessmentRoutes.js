const express = require('express');
const router = express.Router();
const nursingInitialAssessmentController = require('../controllers/nursingInitialAssessmentController');

router.post('/', nursingInitialAssessmentController.createRecord);
router.get('/:patientId', nursingInitialAssessmentController.getRecords);

module.exports = router;
