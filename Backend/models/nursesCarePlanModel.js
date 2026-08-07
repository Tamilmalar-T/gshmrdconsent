const pool = require('../db');

class NursesCarePlanModel {
  static async create(patientId, formData) {
    const { patient, rows: planRows } = formData;
    
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM nursescareplan WHERE patient_id = $1', [patientId]);
    
    const query = `
      INSERT INTO nursescareplan (patient_id, patient_name, notes, sign, date, time)
      VALUES ($1, $2, $3, $4, $5, $6)
    `;

    // Insert each row individually to match the new explicit column schema
    if (planRows && planRows.length > 0) {
      for (const r of planRows) {
        await pool.query(query, [
          patientId,
          patient?.name || null,
          r.notes || '',
          r.sign || '',
          r.date || '',
          r.time || ''
        ]);
      }
    }

    return { success: true };
  }

  static async getByPatientId(patientId) {
    // Fetch all rows for this patient
    const query = 'SELECT * FROM nursescareplan WHERE patient_id = $1 ORDER BY id ASC;';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) return [];

    // Map the explicit database rows back into the frontend's array structure
    const planRows = rows.map((r, index) => ({
      id: r.id || (Date.now() + index),
      date: r.date || '',
      time: r.time || '',
      notes: r.notes || '',
      sign: r.sign || ''
    }));

    // The patient metadata comes from the frontend via editData anyway, 
    // but we return the basic name we stored
    const patient = {
      name: rows[0].patient_name || ''
    };

    return [{
      id: rows[0].id,
      patient_id: patientId,
      form_data: {
        patient,
        rows: planRows
      },
      created_at: rows[0].created_at
    }];
  }
}

module.exports = NursesCarePlanModel;
