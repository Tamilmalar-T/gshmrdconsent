const pool = require('../db');

class PatientModel {
  // Create a new patient
  static async createPatient(patientData) {
    let { name, uhid_no, ip_no, age, sex, doa, ward, bed_no, registration_data } = patientData;
    
    // For OP registration, if uhid_no is not provided, use ip_no (e.g. GSH01OP)
    if (!uhid_no && ip_no) {
      uhid_no = ip_no;
    }

    const reg = typeof registration_data === 'object' && registration_data !== null
      ? registration_data
      : (typeof registration_data === 'string' ? JSON.parse(registration_data || '{}') : {});

    const mobileNo = reg.mobileNo || patientData.mobile_no || null;
    const address = reg.presentAddress || reg.address || patientData.address || null;
    const consultant = reg.consultantDr || reg.consultant || patientData.consultant || null;
    const patientType = reg.patientType || reg.regType || patientData.patient_type || 'Normal';

    // First, check if patient exists by ip_no or uhid_no
    if (ip_no) {
      const checkRes = await pool.query(
        'SELECT * FROM patients WHERE UPPER(TRIM(ip_no)) = UPPER(TRIM($1)) OR (uhid_no IS NOT NULL AND UPPER(TRIM(uhid_no)) = UPPER(TRIM($1)))',
        [ip_no]
      );
      if (checkRes.rows.length > 0) {
        // If it exists, update it instead of crashing
        return await this.updatePatient(ip_no, patientData);
      }
    }

    const validDoa = doa && String(doa).trim() !== '' ? doa : new Date().toISOString().split('T')[0];
    const query = `
      INSERT INTO patients (
        name, uhid_no, ip_no, age, sex, doa, ward, bed_no,
        mobile_no, address, consultant, patient_type, registration_data,
        created_at, updated_at
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, NOW(), NOW())
      RETURNING *;
    `;
    const values = [
      name, uhid_no, ip_no, age, sex, validDoa, ward, bed_no,
      mobileNo, address, consultant, patientType, registration_data
    ];
    const { rows } = await pool.query(query, values);
    const createdPatient = rows[0];

    // Synchronize to dedicated op_register table if this has OP registration data
    try {
      if (registration_data || (ip_no && String(ip_no).includes('OP'))) {
        const OpRegisterModel = require('./opRegisterModel');
        await OpRegisterModel.create({
          ...reg,
          patientId: ip_no || reg.patientId,
          uhidNo: uhid_no || reg.uhidNo || ip_no,
          firstName: reg.firstName || name,
          name: name,
          gender: sex || reg.gender,
          age: age || reg.age,
          registration_data: reg
        });
      }
    } catch (opErr) {
      console.warn('Sync to op_register table warning:', opErr.message);
    }

    return createdPatient;
  }

  // Get all patients
  static async getAllPatients() {
    const query = 'SELECT * FROM patients ORDER BY created_at DESC;';
    const { rows } = await pool.query(query);
    return rows;
  }

  // Get single patient by ID
  static async getPatientById(id) {
    const query = 'SELECT * FROM patients WHERE id = $1 OR UPPER(TRIM(ip_no)) = UPPER(TRIM($2)) OR UPPER(TRIM(uhid_no)) = UPPER(TRIM($2));';
    const { rows } = await pool.query(query, [!isNaN(Number(id)) ? parseInt(id, 10) : -1, String(id).trim()]);
    return rows[0];
  }

  // Update a patient by IP No, UHID, or ID
  static async updatePatient(ipNo, patientData) {
    let { name, uhid_no, age, sex, doa, ward, bed_no, registration_data } = patientData;
    const validDoa = doa && String(doa).trim() !== '' ? doa : null;

    if (!uhid_no && ipNo) {
      uhid_no = ipNo;
    }

    const reg = typeof registration_data === 'object' && registration_data !== null
      ? registration_data
      : (typeof registration_data === 'string' ? JSON.parse(registration_data || '{}') : {});

    const mobileNo = reg.mobileNo || patientData.mobile_no || null;
    const address = reg.presentAddress || reg.address || patientData.address || null;
    const consultant = reg.consultantDr || reg.consultant || patientData.consultant || null;
    const patientType = reg.patientType || reg.regType || patientData.patient_type || 'Normal';
    
    const query = `
      UPDATE patients 
      SET name = $1, uhid_no = COALESCE($2, uhid_no), age = $3, sex = $4, doa = COALESCE($5, doa),
          ward = COALESCE($6, ward), bed_no = COALESCE($7, bed_no),
          mobile_no = COALESCE($8, mobile_no), address = COALESCE($9, address),
          consultant = COALESCE($10, consultant), patient_type = COALESCE($11, patient_type),
          registration_data = COALESCE($12, registration_data), updated_at = NOW()
      WHERE UPPER(TRIM(ip_no)) = UPPER(TRIM($13))
         OR UPPER(TRIM(uhid_no)) = UPPER(TRIM($13))
         OR id::text = $13
      RETURNING *;
    `;
    const values = [
      name, uhid_no, age, sex, validDoa, ward, bed_no,
      mobileNo, address, consultant, patientType, registration_data, String(ipNo).trim()
    ];
    const { rows } = await pool.query(query, values);
    const updatedPatient = rows[0];

    // Synchronize update to dedicated op_register table
    try {
      if (registration_data || (ipNo && String(ipNo).includes('OP'))) {
        const OpRegisterModel = require('./opRegisterModel');
        await OpRegisterModel.update(ipNo, {
          ...reg,
          patientId: ipNo || reg.patientId,
          uhidNo: uhid_no || reg.uhidNo || ipNo,
          firstName: reg.firstName || name,
          gender: sex || reg.gender,
          age: age || reg.age,
          registration_data: reg
        });
      }
    } catch (opErr) {
      console.warn('Sync to op_register table warning on update:', opErr.message);
    }

    return updatedPatient;
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
    const { rows } = await pool.query(query, [String(ipNo).trim()]);
    const deleted = rows[0];

    // Delete from op_register as well
    try {
      const OpRegisterModel = require('./opRegisterModel');
      await OpRegisterModel.delete(ipNo);
    } catch (e) {}

    return deleted;
  }
}

module.exports = PatientModel;
