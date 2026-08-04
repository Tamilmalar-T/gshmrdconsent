const pool = require('./db');

const recreateTable = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS progressreassessmentrecord;');
    
    const query = `
      CREATE TABLE progressreassessmentrecord (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        ip_no VARCHAR(50),
        patient_name VARCHAR(150),
        age VARCHAR(10),
        sex VARCHAR(20),
        uhid_no VARCHAR(50),
        consultant_name VARCHAR(150),
        doa VARCHAR(50),
        ward VARCHAR(100),
        bed_no VARCHAR(50),
        subjective TEXT,
        temp VARCHAR(50),
        bp VARCHAR(50),
        pulse VARCHAR(50),
        rr VARCHAR(50),
        io VARCHAR(50),
        lab_parameters TEXT,
        review_of_systems TEXT,
        assessment TEXT,
        plan_text TEXT,
        plan_diagnosis_check BOOLEAN,
        plan_consultation_check BOOLEAN,
        plan_education_check BOOLEAN,
        advice TEXT,
        doctor_name VARCHAR(150),
        record_date VARCHAR(50),
        record_time VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('progressreassessmentrecord table recreated with all exact flat columns.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
};

recreateTable();
