const express = require('express');
const router = express.Router();
const controller = require('../controllers/formHeaderMasterController');

router.get('/', controller.getHeader);
router.post('/', controller.saveHeader);
router.put('/', controller.saveHeader);

module.exports = router;
