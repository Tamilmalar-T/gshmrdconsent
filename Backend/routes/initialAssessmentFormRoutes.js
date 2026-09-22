const express = require('express');
const router = express.Router();
const initialAssessmentFormController = require('../controllers/initialAssessmentFormController');

router.post('/', initialAssessmentFormController.createRecord);
router.get('/:patientId', initialAssessmentFormController.getRecords);

module.exports = router;
