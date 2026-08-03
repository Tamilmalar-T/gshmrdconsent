const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Basic Route
app.get('/', (req, res) => {
  res.json({ message: 'Backend Server is Running successfully!' });
});

// Route Files
const patientRoutes = require('./routes/patientRoutes');
const vitalsChartRoutes = require('./routes/vitalsChartRoutes');
const nursesDailyAssessmentRoutes = require('./routes/nursesDailyAssessmentRoutes');
const nursingInitialAssessmentRoutes = require('./routes/nursingInitialAssessmentRoutes');
const activityRecordBillingRoutes = require('./routes/activityRecordBillingRoutes');
const intakeOutputRecordRoutes = require('./routes/intakeOutputRecordRoutes');
const diabeticChartRoutes = require('./routes/diabeticChartRoutes');
const progressSheetRoutes = require('./routes/progressSheetRoutes');
const consentGeneralAdmissionRoutes = require('./routes/consentGeneralAdmissionRoutes');
const nursesCarePlanRoutes = require('./routes/nursesCarePlanRoutes');
const labRequisitionRoutes = require('./routes/labRequisitionRoutes');
const bpChartRoutes = require('./routes/bpChartRoutes');
const progressReassessmentRecordRoutes = require('./routes/progressReassessmentRecordRoutes');
const investigationChartRoutes = require('./routes/investigationChartRoutes');
const internalTransferFormRoutes = require('./routes/internalTransferFormRoutes');
const regularDrugPrescriptionRoutes = require('./routes/regularDrugPrescriptionRoutes');

// Mount Routes
app.use('/api/patients', patientRoutes);
app.use('/api/vitals-chart', vitalsChartRoutes);
app.use('/api/nurses-daily-assessment', nursesDailyAssessmentRoutes);
app.use('/api/nursing-initial-assessment', nursingInitialAssessmentRoutes);
app.use('/api/activity-record-billing', activityRecordBillingRoutes);
app.use('/api/intake-output-record', intakeOutputRecordRoutes);
app.use('/api/diabetic-chart', diabeticChartRoutes);
app.use('/api/progress-sheet', progressSheetRoutes);
app.use('/api/consent-general-admission', consentGeneralAdmissionRoutes);
app.use('/api/nurses-care-plan', nursesCarePlanRoutes);
app.use('/api/lab-requisition', labRequisitionRoutes);
app.use('/api/bp-chart', bpChartRoutes);
app.use('/api/progress-reassessment-record', progressReassessmentRecordRoutes);
app.use('/api/investigation-chart', investigationChartRoutes);
app.use('/api/internal-transfer-form', internalTransferFormRoutes);
app.use('/api/regular-drug-prescription', regularDrugPrescriptionRoutes);

// Example DB Route: Test connection
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ success: true, time: result.rows[0].now });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({ success: false, error: 'Database connection failed' });
  }
});

// Start Server
app.listen(port, () => {
  console.log(`Server is listening on port ${port}`);
});
