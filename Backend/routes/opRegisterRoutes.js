const express = require('express');
const router = express.Router();
const opRegisterController = require('../controllers/opRegisterController');

router.post('/', opRegisterController.createOpPatient);
router.get('/', opRegisterController.getAllOpPatients);
router.get('/:id', opRegisterController.getOpPatientById);
router.put('/:id', opRegisterController.updateOpPatient);
router.delete('/:id', opRegisterController.deleteOpPatient);

module.exports = router;
