const express = require('express');
const router = express.Router();
const activityRecordBillingController = require('../controllers/activityRecordBillingController');

router.post('/', activityRecordBillingController.createRecord);
router.get('/:patientId', activityRecordBillingController.getRecords);

module.exports = router;
