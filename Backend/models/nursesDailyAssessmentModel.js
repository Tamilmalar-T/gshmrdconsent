const pool = require('../db');

// Helper to convert frontend tick strings to clean boolean/null for the database
const convertToDbBools = (params) => {
  if (!params) return params;
  const newParams = {};
  for (const [key, shifts] of Object.entries(params)) {
    newParams[key] = {};
    for (const [shift, value] of Object.entries(shifts)) {
      if (value === "✓") {
        newParams[key][shift] = true;
      } else if (value === "✗") {
        newParams[key][shift] = false;
      } else if (value === "" || value === null || value === undefined) {
        newParams[key][shift] = null;
      } else {
        newParams[key][shift] = value;
      }
    }
  }
  return newParams;
};

// Helper to convert database boolean/null back to frontend tick strings
const restoreFromDbBools = (params) => {
  if (!params) return params;
  const newParams = {};
  for (const [key, shifts] of Object.entries(params)) {
    newParams[key] = {};
    for (const [shift, value] of Object.entries(shifts)) {
      if (value === true) {
        newParams[key][shift] = "✓";
      } else if (value === false) {
        newParams[key][shift] = "✗";
      } else if (value === null) {
        newParams[key][shift] = "";
      } else {
        newParams[key][shift] = value;
      }
    }
  }
  return newParams;
};

class NursesDailyAssessmentModel {
  static async create(patientId, formData) {
    const { patient, leftParams, rightParams, painRows, activePainScore, dateLeft, dateRight } = formData;
    
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM nursesdailyassessment WHERE patient_id = $1', [patientId]);
    
    // Clean painRows JSON
    const mappedPainRows = (painRows || []).map((r, index) => {
      const rowObj = { "id no": String(index + 1) };
      if (r.date) rowObj.date = r.date;
      if (r.time) rowObj.time = r.time;
      if (r.location) rowObj.location = r.location;
      if (r.type) rowObj.type = r.type;
      if (r.scale) rowObj.scale = r.scale;
      if (r.action) rowObj.action = r.action;
      if (r.actionTime) rowObj.actionTime = r.actionTime;
      if (r.reevalScale) rowObj.reevalScale = r.reevalScale;
      if (r.reevalTime) rowObj.reevalTime = r.reevalTime;
      if (r.staffSign) rowObj.staffSign = r.staffSign;
      return rowObj;
    });

    const cleanFormData = {
      leftParams: convertToDbBools(leftParams),
      rightParams: convertToDbBools(rightParams),
      painRows: mappedPainRows,
      activePainScore,
      dateLeft,
      dateRight
    };

    const query = `
      INSERT INTO nursesdailyassessment (
        patient_id, ip_no, patient_name, age, sex, uhid_no, doa, ward, bed_no, form_data
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    
    const values = [
      patientId,
      patient?.ipNo || null,
      patient?.name || null,
      patient?.age || null,
      patient?.sex || null,
      patient?.uhidNo || null,
      patient?.doa || null,
      patient?.ward || null,
      patient?.bedNo || null,
      JSON.stringify(cleanFormData)
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM nursesdailyassessment WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1;';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) return [];

    const dbRow = rows[0];
    const rawFormData = typeof dbRow.form_data === 'string' ? JSON.parse(dbRow.form_data) : (dbRow.form_data || {});
    
    // Restore painRows 'id'
    const restoredPainRows = (rawFormData.painRows || []).map((r, index) => ({
      id: r["id no"] || r.id || (Date.now() + index),
      date: r.date || '',
      time: r.time || '',
      location: r.location || '',
      type: r.type || '',
      scale: r.scale || '0',
      action: r.action || '',
      actionTime: r.actionTime || '',
      reevalScale: r.reevalScale || '0',
      reevalTime: r.reevalTime || '',
      staffSign: r.staffSign || ''
    }));

    // Reconstruct patient from columns
    const patient = {
      name: dbRow.patient_name || '',
      age: dbRow.age || '',
      sex: dbRow.sex || 'Male',
      uhidNo: dbRow.uhid_no || '',
      ipNo: dbRow.ip_no || '',
      doa: dbRow.doa || '',
      ward: dbRow.ward || '',
      bedNo: dbRow.bed_no || ''
    };

    return [{
      id: dbRow.id,
      patient_id: patientId,
      form_data: {
        patient,
        leftParams: restoreFromDbBools(rawFormData.leftParams || {}),
        rightParams: restoreFromDbBools(rawFormData.rightParams || {}),
        painRows: restoredPainRows,
        activePainScore: rawFormData.activePainScore || 3,
        dateLeft: rawFormData.dateLeft || '',
        dateRight: rawFormData.dateRight || ''
      },
      created_at: dbRow.created_at
    }];
  }
}

module.exports = NursesDailyAssessmentModel;
