const pool = require('../db');

const snakeToCamel = (obj) => {
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(snakeToCamel);
  return Object.keys(obj).reduce((acc, key) => {
    const camelKey = key.replace(/_([a-z])/g, (g) => g[1].toUpperCase());
    acc[camelKey] = obj[key];
    return acc;
  }, {});
};

const models = {
  vitalschart: require('../models/vitalsChartModel'),
  nursesdailyassessment: require('../models/nursesDailyAssessmentModel'),
  nursinginitialassessment: require('../models/nursingInitialAssessmentModel'),
  activityrecordbilling: require('../models/activityRecordBillingModel'),
  intakeoutputrecord: require('../models/intakeOutputRecordModel'),
  diabeticchart: require('../models/diabeticChartModel'),
  progresssheet: require('../models/progressSheetModel'),
  consentgeneraladmission: require('../models/consentGeneralAdmissionModel'),
  nursescareplan: require('../models/nursesCarePlanModel'),
  labrequisition: require('../models/labRequisitionModel'),
  bpchart: require('../models/bpChartModel'),
  progressreassessmentrecord: require('../models/progressReassessmentRecordModel'),
  investigationchart: require('../models/investigationChartModel'),
  internaltransferform: require('../models/internalTransferFormModel'),
  regulardrugprescription: require('../models/regularDrugPrescriptionModel')
};

exports.getAllCompletedRecords = async (req, res) => {
  try {
    const { rows: patients } = await pool.query('SELECT id, ip_no, name FROM patients');
    
    const tables = [
      { name: 'vitalschart', formType: 'Vitals Chart' },
      { name: 'nursesdailyassessment', formType: 'Nurses Daily Assessment Care Plan' },
      { name: 'nursinginitialassessment', formType: 'Nursing Initial Assessment' },
      { name: 'activityrecordbilling', formType: 'Activity Record Billing' },
      { name: 'intakeoutputrecord', formType: 'Intake Output Record' },
      { name: 'diabeticchart', formType: 'Diabetic Chart' },
      { name: 'progresssheet', formType: 'Progress Sheet' },
      { name: 'consentgeneraladmission', formType: 'Consent for General Admission' },
      { name: 'nursescareplan', formType: 'Nurses Care Plan' },
      { name: 'labrequisition', formType: 'Laboratory Requisition' },
      { name: 'bpchart', formType: 'BP Chart' },
      { name: 'progressreassessmentrecord', formType: 'Progress & Reassessment Record - Resident Doctor' },
      { name: 'investigationchart', formType: 'Investigation Chart' },
      { name: 'internaltransferform', formType: 'Internal Transfer Form' },
      { name: 'regulardrugprescription', formType: 'Regular Drug Prescription' }
    ];

    let allRecords = [];

    for (let patient of patients) {
      for (let table of tables) {
        const model = models[table.name];
        if (model && model.getByPatientId) {
          try {
            const records = await model.getByPatientId(patient.id);
            if (records && records.length > 0) {
              records.forEach(r => {
                let data = r.form_data || {};
                allRecords.push({
                  id: `${table.name}_${r.id}`,
                  dbId: r.id,
                  formType: table.formType,
                  patientIpNo: patient.ip_no || data.ipNo || 'Unknown IP',
                  patientName: patient.name || data.patientName || data.name || 'Unknown Patient',
                  createdBy: data.createdBy || 'Sadhana Admin',
                  isDraft: false,
                  savedAt: new Date(r.created_at || Date.now()).toLocaleString(),
                  data: data
                });
              });
            }
          } catch (err) {
            console.error(`Error querying table ${table.name} for patient ${patient.id}:`, err.message);
          }
        }
      }
    }

    allRecords.sort((a, b) => new Date(b.savedAt) - new Date(a.savedAt));

    res.status(200).json({ success: true, data: allRecords });
  } catch (error) {
    console.error('Error fetching all records:', error);
    res.status(500).json({ success: false, message: 'Server Error', error: error.message });
  }
};
