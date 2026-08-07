const express = require('express');
const router = express.Router();
const recordsController = require('../controllers/recordsController');

router.get('/all', recordsController.getAllCompletedRecords);

module.exports = router;
