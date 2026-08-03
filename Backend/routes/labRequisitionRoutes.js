const express = require('express');
const router = express.Router();
const labRequisitionController = require('../controllers/labRequisitionController');

router.post('/', labRequisitionController.createRecord);
router.get('/:patientId', labRequisitionController.getRecords);

module.exports = router;
