const express = require('express');
const router = express.Router();
const progressSheetController = require('../controllers/progressSheetController');

router.post('/', progressSheetController.createRecord);
router.get('/:patientId', progressSheetController.getRecords);

module.exports = router;
