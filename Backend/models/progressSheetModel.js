const pool = require('../db');

class ProgressSheetModel {
  static async create(patientId, formData) {
    const { patient, rows: planRows } = formData;
    
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM progresssheet WHERE patient_id = $1', [patientId]);
    
    const signature = (planRows && planRows.length > 0 && planRows[0].signature) ? planRows[0].signature : null;
    
    // Map the rows for the database to use "id no" sequentially instead of "id"
    // Remove null or empty values for a clean JSON footprint
    const mappedRowsForDb = (planRows || []).map((r, index) => {
      const rowObj = { "id no": String(index + 1) };
      if (r.date) rowObj.date = r.date;
      if (r.time) rowObj.time = r.time;
      if (r.notes) rowObj.notes = r.notes;
      if (r.signature) rowObj.signature = r.signature;
      return rowObj;
    });

    const query = `
      INSERT INTO progresssheet (
        patient_id, ip_no, patient_name, age, sex, uhid_no, consultant_name, doa, ward, bed_no, signature, notes
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *;
    `;
    const values = [
      patientId,
      patient.ipNo || null,
      patient.name || null,
      patient.age || null,
      patient.sex || null,
      patient.uhidNo || null,
      patient.consultantName || null,
      patient.doa || null,
      patient.ward || null,
      patient.bed || null,
      signature,
      JSON.stringify(mappedRowsForDb)
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM progresssheet WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1;';
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
      signature: r.signature || ''
    }));
    
    // Reconstruct patient from columns
    const patient = {
      name: dbRow.patient_name || '',
      age: dbRow.age || '',
      sex: dbRow.sex || 'Male',
      uhidNo: dbRow.uhid_no || '',
      ipNo: dbRow.ip_no || '',
      consultantName: dbRow.consultant_name || '',
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

module.exports = ProgressSheetModel;
