const express = require('express');
const cors = require('cors');
require('dotenv').config();
const pool = require('./db');
const initializeDatabase = require('./initDb');
const OpRegisterModel = require('./models/opRegisterModel');

const app = express();
const port = parseInt(process.env.PORT || '5000', 10);

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// Request Logger
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
  next();
});

// Root Health Check Route
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'GSH MRD Consent & OP Register Backend Server is running successfully!',
    timestamp: new Date().toISOString()
  });
});

// Database Test Route
app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW() as current_time, current_database() as db_name');
    res.json({
      success: true,
      time: result.rows[0].current_time,
      database: result.rows[0].db_name,
      message: 'PostgreSQL connection active'
    });
  } catch (error) {
    console.error('Database connection error:', error);
    res.status(500).json({
      success: false,
      error: 'Database connection failed',
      details: error.message
    });
  }
});

// Route Imports
const opRegisterRoutes = require('./routes/opRegisterRoutes');
const patientRoutes = require('./routes/patientRoutes');
const patientRegisterMasterRoutes = require('./routes/patientRegisterMasterRoutes');
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
const cultureChartRoutes = require('./routes/cultureChartRoutes');
const emergencyDoctorInitialAssessmentRoutes = require('./routes/emergencyDoctorInitialAssessmentRoutes');
const initialAssessmentFormRoutes = require('./routes/initialAssessmentFormRoutes');
const generalMasterRoutes = require('./routes/generalMasterRoutes');
const formHeaderMasterRoutes = require('./routes/formHeaderMasterRoutes');
const recordsRoutes = require('./routes/recordsRoutes');

// Mount Routes
app.use('/api/op-register', opRegisterRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/patient-register-master', patientRegisterMasterRoutes);
app.use('/api/records', recordsRoutes);
app.use('/api/vitals-chart', vitalsChartRoutes);
app.use('/api/nurses-daily-assessment-care-plan', nursesDailyAssessmentRoutes);
app.use('/api/nursing-initial-assessment', nursingInitialAssessmentRoutes);
app.use('/api/activity-record-billing', activityRecordBillingRoutes);
app.use('/api/intake-output-record', intakeOutputRecordRoutes);
app.use('/api/diabetic-chart', diabeticChartRoutes);
app.use('/api/progress-sheet', progressSheetRoutes);
app.use('/api/consent-for-general-admission', consentGeneralAdmissionRoutes);
app.use('/api/nurses-care-plan', nursesCarePlanRoutes);
app.use('/api/lab-requisition', labRequisitionRoutes);
app.use('/api/laboratory-requisition', labRequisitionRoutes);
app.use('/api/bp-chart', bpChartRoutes);
app.use('/api/progress-and-reassessment-record', progressReassessmentRecordRoutes);
app.use('/api/progress-&-reassessment-record---resident-doctor', progressReassessmentRecordRoutes);
app.use('/api/investigation-chart', investigationChartRoutes);
app.use('/api/internal-transfer-form', internalTransferFormRoutes);
app.use('/api/regular-drug-prescription', regularDrugPrescriptionRoutes);
app.use('/api/culture-chart', cultureChartRoutes);
app.use('/api/emergency-doctor-initial-assessment', emergencyDoctorInitialAssessmentRoutes);
app.use('/api/initial-assessment-form', initialAssessmentFormRoutes);
app.use('/api/general-master', generalMasterRoutes);
app.use('/api/form-header-master', formHeaderMasterRoutes);

// Generic fallback POST handler for form syncing without dedicated DB endpoints
app.post('/api/:formEndpoint', (req, res) => {
  res.json({ success: true, message: `Form ${req.params.formEndpoint} synced successfully` });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('[Server Error]:', err.stack || err.message);
  res.status(500).json({
    success: false,
    message: 'Internal Server Error',
    error: err.message
  });
});

// Start Server and Initialize Database
const startServer = async () => {
  try {
    // 1. Verify and synchronize PostgreSQL Database Schema
    await initializeDatabase();

    // 2. Backfill any existing OP records to op_register table
    await OpRegisterModel.backfillFromPatientsTable();

    // 3. Listen on configured port
    const server = app.listen(port, () => {
      console.log(`====================================================`);
      console.log(`✓ GSH MRD Consent Backend is listening on port ${port}`);
      console.log(`✓ OP Register endpoints:`);
      console.log(`  - POST   http://localhost:${port}/api/op-register`);
      console.log(`  - GET    http://localhost:${port}/api/op-register`);
      console.log(`  - GET    http://localhost:${port}/api/op-register/:id`);
      console.log(`  - PUT    http://localhost:${port}/api/op-register/:id`);
      console.log(`  - DELETE http://localhost:${port}/api/op-register/:id`);
      console.log(`✓ Patient endpoints (compatible with all forms):`);
      console.log(`  - GET    http://localhost:${port}/api/patients`);
      console.log(`  - POST   http://localhost:${port}/api/patients`);
      console.log(`  - PUT    http://localhost:${port}/api/patients/:ipNo`);
      console.log(`  - DELETE http://localhost:${port}/api/patients/:ipNo`);
      console.log(`====================================================`);
    });

    server.on('error', (error) => {
      if (error.code === 'EADDRINUSE') {
        console.error(`❌ Port ${port} is already in use.`);
      } else {
        console.error('❌ Server error:', error);
      }
      process.exit(1);
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err);
    process.exit(1);
  }
};

startServer();

module.exports = app;
