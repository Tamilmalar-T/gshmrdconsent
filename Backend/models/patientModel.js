const pool = require('../db');

class PatientModel {
  // Create a new patient
  static async createPatient(patientData) {
    const { name, uhid_no, ip_no, age, sex, doa, ward, bed_no } = patientData;
    
    // First, check if patient exists by ip_no
    if (ip_no) {
      const checkRes = await pool.query('SELECT * FROM patients WHERE ip_no = $1', [ip_no]);
      if (checkRes.rows.length > 0) {
        return checkRes.rows[0]; // return existing
      }
    }

    const query = `
      INSERT INTO patients (name, uhid_no, ip_no, age, sex, doa, ward, bed_no)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING *;
    `;
    const values = [name, uhid_no, ip_no, age, sex, doa, ward, bed_no];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Get all patients
  static async getAllPatients() {
    const query = 'SELECT * FROM patients ORDER BY created_at DESC;';
    const { rows } = await pool.query(query);
    return rows;
  }

  // Get single patient by ID
  static async getPatientById(id) {
    const query = 'SELECT * FROM patients WHERE id = $1;';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
}

module.exports = PatientModel;
