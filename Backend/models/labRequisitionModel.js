const pool = require('../db');

class LabRequisitionModel {
  static async create(patientId, formData) {
    const { meta, selectedTests } = formData;
    
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM labrequisition WHERE patient_id = $1', [patientId]);
    
    // Convert the { 'TestA': true, 'TestB': false } object into a clean array: ["TestA"]
    const selectedTestsArray = Object.keys(selectedTests || {}).filter(key => selectedTests[key] === true);

    const query = `
      INSERT INTO labrequisition (
        patient_id, ip_no, patient_name, age, sex, uhid_no, date, ward, bed_no,
        time_of_collection, collected_by, referring_doctor, priority,
        clinical_diagnosis, anticoagulant_therapy, time_received, received_by,
        lab_no, others, selected_tests
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20)
      RETURNING *;
    `;
    
    const values = [
      patientId,
      meta.ipNo || null,
      meta.name || null,
      meta.age || null,
      meta.sex || null,
      meta.uhidNo || null,
      meta.date || null,
      meta.ward || null,
      meta.bed || null,
      meta.timeOfCollection || null,
      meta.collectedBy || null,
      meta.referringDoctor || null,
      meta.priority || null,
      meta.clinicalDiagnosis || null,
      meta.anticoagulantTherapy || null,
      meta.timeReceived || null,
      meta.receivedBy || null,
      meta.labNo || null,
      meta.others || null,
      JSON.stringify(selectedTestsArray) // Save exactly like the screenshot: ["Test 1", "Test 2"]
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM labrequisition WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1;';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) return [];

    const dbRow = rows[0];
    const savedTestsArray = typeof dbRow.selected_tests === 'string' ? JSON.parse(dbRow.selected_tests) : (dbRow.selected_tests || []);
    
    // Convert the ["TestA"] array back into the object format { 'TestA': true } for the React frontend
    const selectedTestsObj = {};
    if (Array.isArray(savedTestsArray)) {
      savedTestsArray.forEach(testName => {
        selectedTestsObj[testName] = true;
      });
    }

    // Reconstruct meta from columns
    const meta = {
      name: dbRow.patient_name || '',
      age: dbRow.age || '',
      sex: dbRow.sex || 'Male',
      uhidNo: dbRow.uhid_no || '',
      ipNo: dbRow.ip_no || '',
      date: dbRow.date || '',
      ward: dbRow.ward || '',
      bed: dbRow.bed_no || '',
      timeOfCollection: dbRow.time_of_collection || '',
      collectedBy: dbRow.collected_by || '',
      referringDoctor: dbRow.referring_doctor || '',
      priority: dbRow.priority || 'Routine',
      clinicalDiagnosis: dbRow.clinical_diagnosis || '',
      anticoagulantTherapy: dbRow.anticoagulant_therapy || '',
      timeReceived: dbRow.time_received || '',
      receivedBy: dbRow.received_by || '',
      labNo: dbRow.lab_no || '',
      others: dbRow.others || ''
    };

    return [{
      id: dbRow.id,
      patient_id: patientId,
      form_data: {
        meta,
        selectedTests: selectedTestsObj
      },
      created_at: dbRow.created_at
    }];
  }
}

module.exports = LabRequisitionModel;
