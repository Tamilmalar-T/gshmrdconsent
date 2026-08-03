const express = require('express');
const router = express.Router();
const vitalsChartController = require('../controllers/vitalsChartController');

router.post('/', vitalsChartController.createRecord);
router.get('/:patientId', vitalsChartController.getRecords);

module.exports = router;
