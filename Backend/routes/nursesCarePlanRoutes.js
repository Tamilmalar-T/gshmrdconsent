const express = require('express');
const router = express.Router();
const nursesCarePlanController = require('../controllers/nursesCarePlanController');

router.post('/', nursesCarePlanController.createRecord);
router.get('/:patientId', nursesCarePlanController.getRecords);

module.exports = router;
