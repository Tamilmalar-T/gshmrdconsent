const pool = require('../db');

class NursesCarePlanModel {
  static async create(patientId, formData) {
    const { patient, rows: planRows } = formData;
    
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM nursescareplan WHERE patient_id = $1', [patientId]);
    
    // Extract a signature from the notes if one exists, as a convenience for the top-level signature column
    const signature = (planRows && planRows.length > 0 && planRows[0].sign) ? planRows[0].sign : null;
    
    // Map the rows for the database to use "id no" sequentially instead of "id"
    // Remove null or empty values for a clean JSON footprint
    const mappedRowsForDb = (planRows || []).map((r, index) => {
      const rowObj = { "id no": String(index + 1) };
      if (r.date) rowObj.date = r.date;
      if (r.time) rowObj.time = r.time;
      if (r.notes) rowObj.notes = r.notes;
      if (r.sign) rowObj.sign = r.sign;
      return rowObj;
    });

    const query = `
      INSERT INTO nursescareplan (
        patient_id, ip_no, patient_name, age, sex, uhid_no, doa, ward, bed_no, signature, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
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
      patient.bed || null,
      signature,
      JSON.stringify(mappedRowsForDb) // Store the mapped array
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM nursescareplan WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1;';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) return [];

    const dbRow = rows[0];
    const rawNotes = typeof dbRow.notes === 'string' ? JSON.parse(dbRow.notes) : (dbRow.notes || []);
    
    // Map it back so the frontend React component still gets a standard 'id'
    const planRows = rawNotes.map((r, index) => ({
      id: r["id no"] || r.id || (Date.now() + index),
      date: r.date || '',
      time: r.time || '',
      notes: r.notes || '',
      sign: r.sign || ''
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
      bed: dbRow.bed_no || ''
    };

    return [{
      id: dbRow.id,
      patient_id: patientId,
      form_data: {
        patient,
        rows: planRows
      },
      created_at: dbRow.created_at
    }];
  }
}

module.exports = NursesCarePlanModel;
