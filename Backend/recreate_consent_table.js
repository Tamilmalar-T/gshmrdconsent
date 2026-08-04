const pool = require('./db');

const recreateTable = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS consentgeneraladmission;');
    
    const query = `
      CREATE TABLE consentgeneraladmission (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        patient_name VARCHAR(150),
        age VARCHAR(10),
        sex VARCHAR(20),
        uhid_no VARCHAR(50),
        ip_no VARCHAR(50),
        ip_op_no VARCHAR(50),
        bed_no VARCHAR(50),
        medical_insurance VARCHAR(50),
        doa VARCHAR(50),
        occupation VARCHAR(100),
        father_name VARCHAR(150),
        husband_name VARCHAR(150),
        address TEXT,
        phone_no VARCHAR(50),
        mobile_no VARCHAR(50),
        informant_name VARCHAR(150),
        relationship VARCHAR(100),
        informant_address TEXT,
        consent_accepted BOOLEAN,
        patient_sign_date VARCHAR(50),
        witness_sign_date VARCHAR(50),
        patient_sign_time VARCHAR(50),
        witness_sign_time VARCHAR(50),
        ward VARCHAR(100),
        insurance_details TEXT,
        present_address_line1 TEXT,
        present_address_line2 TEXT,
        employee_pensioner VARCHAR(150),
        person_filling_form VARCHAR(150),
        brought_by VARCHAR(150),
        accident_poisoning VARCHAR(150),
        mode_accident_poisoning VARCHAR(150),
        date_time_incident VARCHAR(100),
        witness_name VARCHAR(150),
        witness_relationship VARCHAR(100),
        witness_address TEXT,
        witness_mobile VARCHAR(50),
        patient_address TEXT,
        patient_mobile VARCHAR(50),
        office_uhid VARCHAR(50),
        office_ip_no VARCHAR(50),
        date_of_admission VARCHAR(50),
        time_of_admission VARCHAR(50),
        office_ward VARCHAR(100),
        office_bed VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('consentgeneraladmission table recreated with flat columns.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
};

recreateTable();
