const pool = require('../db');

class CultureChartModel {
  static async create(patientId, formData) {
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM culturechart WHERE patient_id = $1', [patientId]);
    
    const patient = formData.patient || {};
    
    const query = `
      INSERT INTO culturechart (
        patient_id, ip_no, patient_name, age, sex, uhid_no, doa, ward, bed_no, form_data
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      RETURNING *;
    `;
    const values = [
      patientId,
      patient.ipNo || null,
      patient.name || null,
      patient.age || null,
      patient.sex || null,
      patient.uhidNo || null,
      patient.doa || null,
      patient.ward || null,
      patient.bedNo || null,
      JSON.stringify(formData)
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM culturechart WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1;';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) return [];
    
    const dbRow = rows[0];
    
    return [{
      id: dbRow.id,
      patient_id: patientId,
      form_data: dbRow.form_data,
      created_at: dbRow.created_at
    }];
  }
}

module.exports = CultureChartModel;
