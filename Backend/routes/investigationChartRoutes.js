const express = require('express');
const router = express.Router();
const investigationChartController = require('../controllers/investigationChartController');

router.post('/', investigationChartController.createRecord);
router.get('/:patientId', investigationChartController.getRecords);

module.exports = router;
