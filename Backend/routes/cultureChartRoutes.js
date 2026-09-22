const express = require('express');
const router = express.Router();
const { saveRecord, getRecords } = require('../controllers/cultureChartController');

router.post('/', saveRecord);
router.get('/:patientId', getRecords);

module.exports = router;
