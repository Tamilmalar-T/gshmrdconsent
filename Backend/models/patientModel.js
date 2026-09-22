const pool = require('../db');

class PatientModel {
  // Create a new patient
  static async createPatient(patientData) {
    const { name, uhid_no, ip_no, age, sex, doa, ward, bed_no, registration_data } = patientData;
    
    // First, check if patient exists by ip_no
    if (ip_no) {
      const checkRes = await pool.query('SELECT * FROM patients WHERE ip_no = $1', [ip_no]);
      if (checkRes.rows.length > 0) {
        // If it exists, update it instead of crashing
        return await this.updatePatient(ip_no, patientData);
      }
    }

    const validDoa = doa && doa.trim() !== '' ? doa : null;
    const query = `
      INSERT INTO patients (name, uhid_no, ip_no, age, sex, doa, ward, bed_no, registration_data)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *;
    `;
    const values = [name, uhid_no, ip_no, age, sex, validDoa, ward, bed_no, registration_data];
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

  // Update a patient by IP No
  static async updatePatient(ipNo, patientData) {
    const { name, uhid_no, age, sex, doa, ward, bed_no, registration_data } = patientData;
    const validDoa = doa && doa.trim() !== '' ? doa : null;
    
    const query = `
      UPDATE patients 
      SET name = $1, uhid_no = $2, age = $3, sex = $4, doa = $5, ward = $6, bed_no = $7, registration_data = $8
      WHERE ip_no = $9
      RETURNING *;
    `;
    const values = [name, uhid_no, age, sex, validDoa, ward, bed_no, registration_data, ipNo];
    const { rows } = await pool.query(query, values);
    return rows[0];
  }

  // Delete a patient by IP No, UHID No, or ID
  static async deletePatient(ipNo) {
    const query = `
      DELETE FROM patients 
      WHERE UPPER(TRIM(ip_no)) = UPPER(TRIM($1)) 
         OR UPPER(TRIM(uhid_no)) = UPPER(TRIM($1))
         OR id::text = $1 
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [ipNo]);
    return rows[0];
  }
}

module.exports = PatientModel;
