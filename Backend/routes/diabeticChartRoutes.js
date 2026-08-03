const express = require('express');
const router = express.Router();
const diabeticChartController = require('../controllers/diabeticChartController');

router.post('/', diabeticChartController.createRecord);
router.get('/:patientId', diabeticChartController.getRecords);

module.exports = router;
