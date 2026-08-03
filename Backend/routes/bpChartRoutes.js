const express = require('express');
const router = express.Router();
const bpChartController = require('../controllers/bpChartController');

router.post('/', bpChartController.createRecord);
router.get('/:patientId', bpChartController.getRecords);

module.exports = router;
