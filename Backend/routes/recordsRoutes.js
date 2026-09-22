const express = require('express');
const router = express.Router();
const recordsController = require('../controllers/recordsController');

router.get('/all', recordsController.getAllCompletedRecords);
router.delete('/:id', recordsController.deleteRecord);

module.exports = router;
