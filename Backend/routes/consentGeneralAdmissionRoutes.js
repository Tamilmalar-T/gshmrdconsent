const express = require('express');
const router = express.Router();
const consentGeneralAdmissionController = require('../controllers/consentGeneralAdmissionController');

router.post('/', consentGeneralAdmissionController.createRecord);
router.get('/:patientId', consentGeneralAdmissionController.getRecords);

module.exports = router;
