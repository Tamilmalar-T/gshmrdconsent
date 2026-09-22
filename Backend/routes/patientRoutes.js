const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');

// Routes mapping to controller functions
router.post('/', patientController.createPatient);
router.get('/', patientController.getPatients);
router.get('/:id', patientController.getPatientById);
router.put('/:ipNo', patientController.updatePatient);
router.delete('/:ipNo', patientController.deletePatient);
module.exports = router;
