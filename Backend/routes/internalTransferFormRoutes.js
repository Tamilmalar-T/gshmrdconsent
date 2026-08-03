const express = require('express');
const router = express.Router();
const internalTransferFormController = require('../controllers/internalTransferFormController');

router.post('/', internalTransferFormController.createRecord);
router.get('/:patientId', internalTransferFormController.getRecords);

module.exports = router;
