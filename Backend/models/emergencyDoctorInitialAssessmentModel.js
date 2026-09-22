const pool = require('../db');

class EmergencyDoctorInitialAssessmentModel {
  static async create(patientId, formData) {
    // Delete previous records for this patient if you want to keep only the latest like some other modules
    // Or just insert it as a new record. The generic generator does insert.
    // Given the form is 'Initial Assessment', it might be inserted and updated, but let's stick to the generated pattern which just inserts a new row.
    const query = `
      INSERT INTO emergencydoctorinitialassessment (patient_id, form_data)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [patientId, formData]);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM emergencydoctorinitialassessment WHERE patient_id = $1 ORDER BY created_at DESC;';
    const { rows } = await pool.query(query, [patientId]);
    return rows;
  }
}

module.exports = EmergencyDoctorInitialAssessmentModel;
