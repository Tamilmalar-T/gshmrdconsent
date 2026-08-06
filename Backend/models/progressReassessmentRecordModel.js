const pool = require('../db');

class ProgressReassessmentRecordModel {
  static async create(patientId, formData) {
    const { patient, soap, rows: planRows } = formData;
    
    // Delete previous records for this patient to prevent duplication
    await pool.query('DELETE FROM progressreassessmentrecord WHERE patient_id = $1', [patientId]);
    
    let signature = null;
    let notesData = null;
    let docDate = null;
    let docTime = null;

    if (soap) {
      // It's the SOAP format
      signature = soap.doctorName || null;
      docDate = soap.docDate || null;
      docTime = soap.docTime || null;
      notesData = JSON.stringify(soap);
    } else {
      // It's the tabular format
      signature = (planRows && planRows.length > 0 && planRows[0].signature) ? planRows[0].signature : null;
      docDate = (planRows && planRows.length > 0) ? planRows[0].date : null;
      docTime = (planRows && planRows.length > 0) ? planRows[0].time : null;
      
      const mappedRowsForDb = (planRows || []).map((r, index) => {
        const rowObj = { "id no": String(index + 1) };
        if (r.date) rowObj.date = r.date;
        if (r.time) rowObj.time = r.time;
        if (r.notes) rowObj.notes = r.notes;
        if (r.signature) rowObj.signature = r.signature;
        return rowObj;
      });
      notesData = JSON.stringify(mappedRowsForDb);
    }

    const query = `
      INSERT INTO progressreassessmentrecord (
        patient_id, ip_no, patient_name, age, sex, uhid_no, consultant_name, doa, ward, bed_no, signature, notes, doc_date, doc_time
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
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
      notesData,
      docDate,
      docTime
    ];
    
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM progressreassessmentrecord WHERE patient_id = $1 ORDER BY created_at DESC LIMIT 1;';
    const { rows } = await pool.query(query, [patientId]);
    
    if (rows.length === 0) return [];

    const dbRow = rows[0];
    const rawNotes = typeof dbRow.notes === 'string' ? JSON.parse(dbRow.notes) : (dbRow.notes || []);
    
    let planRows = undefined;
    let soap = undefined;

    if (Array.isArray(rawNotes)) {
      planRows = rawNotes.map((r, index) => ({
        id: r["id no"] || r.id || (Date.now() + index),
        date: r.date || '',
        time: r.time || '',
        notes: r.notes || '',
        signature: r.signature || ''
      }));
    } else {
      soap = rawNotes;
    }
    
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

    const formData = { patient };
    if (soap) formData.soap = soap;
    if (planRows) formData.rows = planRows;

    return [{
      id: dbRow.id,
      patient_id: patientId,
      form_data: formData,
      created_at: dbRow.created_at
    }];
  }
}

module.exports = ProgressReassessmentRecordModel;
