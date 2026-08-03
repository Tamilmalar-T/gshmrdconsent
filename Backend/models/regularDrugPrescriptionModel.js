const pool = require('../db');

class RegularDrugPrescriptionModel {
  static async create(patientId, formData) {
    const query = `
      INSERT INTO regulardrugprescription (patient_id, form_data)
      VALUES ($1, $2)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [patientId, formData]);
    return rows[0];
  }

  static async getByPatientId(patientId) {
    const query = 'SELECT * FROM regulardrugprescription WHERE patient_id = $1 ORDER BY created_at DESC;';
    const { rows } = await pool.query(query, [patientId]);
    return rows;
  }
}

module.exports = RegularDrugPrescriptionModel;
