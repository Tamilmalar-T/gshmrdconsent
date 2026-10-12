const pool = require('../db');

class OpRegisterModel {
  /**
   * Helper to normalize OP record fields from raw or nested payload
   */
  static extractFields(data) {
    const reg = data.registration_data || data;
    const patientId = data.patient_id || data.patientId || data.ip_no || reg.patientId || reg.ipNo || '';
    const uhidNo = data.uhid_no || data.uhidNo || reg.uhidNo || patientId || null;
    const title = data.title || reg.title || '';
    const firstName = data.first_name || data.firstName || data.name || reg.firstName || reg.name || 'Patient';
    const gender = data.gender || data.sex || reg.gender || reg.sex || 'Female';
    const dob = data.dob || reg.dob || null;
    const age = data.age || reg.age || '';
    const ageYear = parseInt(data.age_year || data.ageYear || reg.ageYear || '0', 10) || 0;
    const ageMonth = parseInt(data.age_month || data.ageMonth || reg.ageMonth || '0', 10) || 0;
    const ageDay = parseInt(data.age_day || data.ageDay || reg.ageDay || '0', 10) || 0;
    const mobileNo = data.mobile_no || data.mobileNo || reg.mobileNo || '';
    const altContact = data.alternate_contact || data.alternateContact || reg.alternateContact || reg.altContact || '';
    const emailId = data.email_id || data.emailId || reg.emailId || reg.email || '';
    const regType = data.reg_type || data.regType || reg.regType || 'Normal';
    const patientType = data.patient_type || data.patientType || reg.patientType || 'General';
    const presentAddress = data.present_address || data.presentAddress || data.address || reg.presentAddress || reg.address || '';
    const address2 = data.address2 || reg.address2 || '';
    const location = data.location || reg.location || '';
    const pincode = data.pincode || reg.pincode || '';
    const consultantDr = data.consultant_dr || data.consultantDr || data.consultant || reg.consultantDr || reg.consultant || '';
    const maritalStatus = data.marital_status || data.maritalStatus || reg.maritalStatus || '';
    const occupation = data.occupation || reg.occupation || '';
    const bloodGroup = data.blood_group || data.bloodGroup || reg.bloodGroup || '';
    const religion = data.religion || reg.religion || '';
    const nationality = data.nationality || reg.nationality || 'Indian';
    const idType = data.id_type || data.idType || reg.idType || '';
    const idNumber = data.id_number || data.idNumber || reg.idNumber || '';
    const referenceNo = data.reference_no || data.referenceNo || reg.referenceNo || '';
    const patientPhoto = data.patient_photo || data.patientPhoto || reg.patientPhoto || null;
    const idUpload = data.id_upload || data.idUpload || reg.idUpload || null;
    const patientThumbprint = data.patient_thumbprint || data.patientThumbprint || reg.patientThumbprint || null;
    const attenders = Array.isArray(data.attenders) ? data.attenders : (Array.isArray(reg.attenders) ? reg.attenders : []);
    
    // Build clean raw registration data
    const rawRegistrationData = typeof data.registration_data === 'object' && data.registration_data !== null
      ? data.registration_data
      : (typeof data === 'object' ? data : {});

    return {
      patientId: String(patientId).trim().toUpperCase(),
      uhidNo: uhidNo ? String(uhidNo).trim().toUpperCase() : null,
      title,
      firstName,
      gender,
      dob,
      age,
      ageYear,
      ageMonth,
      ageDay,
      mobileNo,
      altContact,
      emailId,
      regType,
      patientType,
      presentAddress,
      address2,
      location,
      pincode,
      consultantDr,
      maritalStatus,
      occupation,
      bloodGroup,
      religion,
      nationality,
      idType,
      idNumber,
      referenceNo,
      patientPhoto,
      idUpload,
      patientThumbprint,
      attenders,
      rawRegistrationData
    };
  }

  /**
   * Create or update OP register record and mirror into patients table
   */
  static async create(data) {
    const f = this.extractFields(data);

    if (!f.patientId) {
      throw new Error('Patient ID (e.g. GSH01OP) is required for OP Register.');
    }

    // Check if record exists in op_register by patient_id
    const existing = await pool.query(
      'SELECT id FROM op_register WHERE UPPER(TRIM(patient_id)) = $1 OR (uhid_no IS NOT NULL AND UPPER(TRIM(uhid_no)) = $1)',
      [f.patientId]
    );

    let opRecord;
    if (existing.rows.length > 0) {
      opRecord = await this.update(f.patientId, data);
    } else {
      const query = `
        INSERT INTO op_register (
          patient_id, uhid_no, title, first_name, gender, dob, age,
          age_year, age_month, age_day, mobile_no, alternate_contact, email_id,
          reg_type, patient_type, present_address, address2, location, pincode,
          consultant_dr, marital_status, occupation, blood_group, religion,
          nationality, id_type, id_number, reference_no, patient_photo,
          id_upload, patient_thumbprint, attenders, raw_registration_data,
          created_at, updated_at
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7,
          $8, $9, $10, $11, $12, $13,
          $14, $15, $16, $17, $18, $19,
          $20, $21, $22, $23, $24,
          $25, $26, $27, $28, $29,
          $30, $31, $32, $33,
          NOW(), NOW()
        )
        RETURNING *;
      `;
      const values = [
        f.patientId, f.uhidNo, f.title, f.firstName, f.gender, f.dob, f.age,
        f.ageYear, f.ageMonth, f.ageDay, f.mobileNo, f.altContact, f.emailId,
        f.regType, f.patientType, f.presentAddress, f.address2, f.location, f.pincode,
        f.consultantDr, f.maritalStatus, f.occupation, f.bloodGroup, f.religion,
        f.nationality, f.idType, f.idNumber, f.referenceNo, f.patientPhoto,
        f.idUpload, f.patientThumbprint, JSON.stringify(f.attenders), JSON.stringify(f.rawRegistrationData)
      ];

      const { rows } = await pool.query(query, values);
      opRecord = rows[0];
    }

    // Mirror to patients table for clinical records, IP Register, and global lookup
    await this.syncToPatientsTable(f);

    return opRecord;
  }

  /**
   * Keep patients table updated with OP details
   */
  static async syncToPatientsTable(f) {
    try {
      const fullName = `${f.title ? f.title + ' ' : ''}${f.firstName || ''}`.trim() || f.firstName;
      const regData = {
        ...f.rawRegistrationData,
        patientId: f.patientId,
        uhidNo: f.uhidNo || f.patientId,
        ipNo: f.patientId,
        title: f.title,
        firstName: f.firstName,
        name: fullName,
        patientName: fullName,
        gender: f.gender,
        sex: f.gender,
        dob: f.dob,
        age: f.age,
        ageYear: f.ageYear,
        ageMonth: f.ageMonth,
        ageDay: f.ageDay,
        mobileNo: f.mobileNo,
        alternateContact: f.altContact,
        altContact: f.altContact,
        emailId: f.emailId,
        regType: f.regType,
        patientType: f.patientType,
        presentAddress: f.presentAddress,
        address: f.presentAddress,
        address2: f.address2,
        location: f.location,
        pincode: f.pincode,
        consultantDr: f.consultantDr,
        consultant: f.consultantDr,
        maritalStatus: f.maritalStatus,
        occupation: f.occupation,
        bloodGroup: f.bloodGroup,
        religion: f.religion,
        nationality: f.nationality,
        idType: f.idType,
        idNumber: f.idNumber,
        referenceNo: f.referenceNo,
        patientPhoto: f.patientPhoto,
        idUpload: f.idUpload,
        patientThumbprint: f.patientThumbprint,
        attenders: f.attenders
      };

      const check = await pool.query(
        'SELECT id FROM patients WHERE UPPER(TRIM(ip_no)) = $1 OR (uhid_no IS NOT NULL AND UPPER(TRIM(uhid_no)) = $1)',
        [f.patientId]
      );

      if (check.rows.length > 0) {
        await pool.query(
          `UPDATE patients 
           SET name = $1, uhid_no = $2, age = $3, sex = $4,
               mobile_no = $5, address = $6, consultant = $7, patient_type = $8,
               registration_data = $9, updated_at = NOW()
           WHERE id = $10`,
          [
            fullName, f.uhidNo || f.patientId, f.age, f.gender,
            f.mobileNo, f.presentAddress, f.consultantDr, f.patientType,
            JSON.stringify(regData), check.rows[0].id
          ]
        );
      } else {
        await pool.query(
          `INSERT INTO patients (
             name, uhid_no, ip_no, age, sex, doa, ward, bed_no,
             mobile_no, address, consultant, patient_type, registration_data, created_at, updated_at
           ) VALUES (
             $1, $2, $3, $4, $5, CURRENT_DATE, NULL, NULL,
             $6, $7, $8, $9, $10, NOW(), NOW()
           )`,
          [
            fullName, f.uhidNo || f.patientId, f.patientId, f.age, f.gender,
            f.mobileNo, f.presentAddress, f.consultantDr, f.patientType, JSON.stringify(regData)
          ]
        );
      }
    } catch (err) {
      console.warn('Sync to patients table warning:', err.message);
    }
  }

  /**
   * Get all registered OP patients
   */
  static async getAll() {
    const query = 'SELECT * FROM op_register ORDER BY created_at DESC;';
    const { rows } = await pool.query(query);
    return rows;
  }

  /**
   * Get single OP patient by patientId, uhid, or id
   */
  static async getById(idOrPatientId) {
    const val = String(idOrPatientId).trim();
    let query;
    let params;

    if (!isNaN(Number(val))) {
      query = 'SELECT * FROM op_register WHERE id = $1 OR UPPER(TRIM(patient_id)) = UPPER(TRIM($2)) OR UPPER(TRIM(uhid_no)) = UPPER(TRIM($2));';
      params = [parseInt(val, 10), val];
    } else {
      query = 'SELECT * FROM op_register WHERE UPPER(TRIM(patient_id)) = UPPER(TRIM($1)) OR UPPER(TRIM(uhid_no)) = UPPER(TRIM($1));';
      params = [val];
    }

    const { rows } = await pool.query(query, params);
    return rows[0] || null;
  }

  /**
   * Update an OP patient by patientId, uhid, or id
   */
  static async update(idOrPatientId, data) {
    const f = this.extractFields(data);
    const target = String(idOrPatientId || f.patientId).trim().toUpperCase();

    const query = `
      UPDATE op_register
      SET uhid_no = COALESCE($1, uhid_no),
          title = $2,
          first_name = $3,
          gender = $4,
          dob = $5,
          age = $6,
          age_year = $7,
          age_month = $8,
          age_day = $9,
          mobile_no = $10,
          alternate_contact = $11,
          email_id = $12,
          reg_type = $13,
          patient_type = $14,
          present_address = $15,
          address2 = $16,
          location = $17,
          pincode = $18,
          consultant_dr = $19,
          marital_status = $20,
          occupation = $21,
          blood_group = $22,
          religion = $23,
          nationality = $24,
          id_type = $25,
          id_number = $26,
          reference_no = $27,
          patient_photo = COALESCE($28, patient_photo),
          id_upload = COALESCE($29, id_upload),
          patient_thumbprint = COALESCE($30, patient_thumbprint),
          attenders = $31,
          raw_registration_data = $32,
          updated_at = NOW()
      WHERE UPPER(TRIM(patient_id)) = $33
         OR (uhid_no IS NOT NULL AND UPPER(TRIM(uhid_no)) = $33)
         OR id::text = $33
      RETURNING *;
    `;

    const values = [
      f.uhidNo, f.title, f.firstName, f.gender, f.dob, f.age,
      f.ageYear, f.ageMonth, f.ageDay, f.mobileNo, f.altContact, f.emailId,
      f.regType, f.patientType, f.presentAddress, f.address2, f.location, f.pincode,
      f.consultantDr, f.maritalStatus, f.occupation, f.bloodGroup, f.religion,
      f.nationality, f.idType, f.idNumber, f.referenceNo, f.patientPhoto,
      f.idUpload, f.patientThumbprint, JSON.stringify(f.attenders),
      JSON.stringify(f.rawRegistrationData), target
    ];

    const { rows } = await pool.query(query, values);
    const updated = rows[0];

    // Keep patients table in sync
    await this.syncToPatientsTable(f);

    return updated;
  }

  /**
   * Delete OP record from op_register and patients table
   */
  static async delete(idOrPatientId) {
    const target = String(idOrPatientId).trim().toUpperCase();

    const { rows } = await pool.query(
      `DELETE FROM op_register
       WHERE UPPER(TRIM(patient_id)) = $1
          OR (uhid_no IS NOT NULL AND UPPER(TRIM(uhid_no)) = $1)
          OR id::text = $1
       RETURNING *;`,
      [target]
    );

    // Also remove from patients table if it's the OP record
    try {
      await pool.query(
        `DELETE FROM patients
         WHERE UPPER(TRIM(ip_no)) = $1
            OR (uhid_no IS NOT NULL AND UPPER(TRIM(uhid_no)) = $1 AND (ward IS NULL OR ward = ''))
            OR id::text = $1;`,
        [target]
      );
    } catch (e) {
      console.warn('Sync delete from patients table warning:', e.message);
    }

    return rows[0] || null;
  }

  /**
   * Backfill existing OP registrations from patients table to op_register
   */
  static async backfillFromPatientsTable() {
    try {
      const res = await pool.query(
        `SELECT * FROM patients WHERE registration_data IS NOT NULL`
      );
      for (const row of res.rows) {
        let reg = row.registration_data;
        if (typeof reg === 'string') {
          try { reg = JSON.parse(reg); } catch (e) { continue; }
        }
        if (!reg) continue;

        const pid = row.ip_no || reg.patientId || reg.ipNo;
        if (!pid) continue;

        // Only insert if not already present in op_register
        const check = await pool.query(
          'SELECT id FROM op_register WHERE UPPER(TRIM(patient_id)) = $1',
          [String(pid).trim().toUpperCase()]
        );

        if (check.rows.length === 0) {
          const payload = {
            ...reg,
            patientId: pid,
            uhidNo: row.uhid_no || reg.uhidNo || pid,
            name: row.name || reg.firstName,
            firstName: reg.firstName || row.name,
            gender: row.sex || reg.gender,
            age: row.age || reg.age,
            registration_data: reg
          };
          await this.create(payload);
        }
      }
    } catch (err) {
      console.warn('Backfill OP Register warning:', err.message);
    }
  }
}

module.exports = OpRegisterModel;
