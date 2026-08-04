const pool = require('./db');

const recreateTable = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS consentgeneraladmission;');
    
    const query = `
      CREATE TABLE consentgeneraladmission (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        ip_no VARCHAR(50),
        patient_name VARCHAR(150),
        age VARCHAR(10),
        sex VARCHAR(20),
        uhid_no VARCHAR(50),
        ward VARCHAR(100),
        bed_no VARCHAR(50),
        medical_insurance VARCHAR(50),
        doa VARCHAR(50),
        occupation VARCHAR(100),
        fathers_name VARCHAR(150),
        husband_name VARCHAR(150),
        mobile_no VARCHAR(50),
        insurance_details TEXT,
        present_address TEXT,
        employee_pensioner VARCHAR(150),
        person_filling_form VARCHAR(150),
        relationship VARCHAR(100),
        brought_by VARCHAR(150),
        accident_poisoning VARCHAR(150),
        mode_accident_poisoning VARCHAR(150),
        date_time_incident VARCHAR(100),
        patient_signature_name VARCHAR(150),
        patient_address TEXT,
        patient_mobile_no VARCHAR(50),
        patient_signature VARCHAR(100),
        witness_name VARCHAR(150),
        witness_relationship VARCHAR(100),
        witness_address TEXT,
        witness_mobile_no VARCHAR(50),
        witness_signature VARCHAR(100),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('consentgeneraladmission table recreated with exact requested columns.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
};

recreateTable();
