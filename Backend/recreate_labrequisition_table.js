const pool = require('./db');

const recreateTable = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS labrequisition;');
    
    const query = `
      CREATE TABLE labrequisition (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        ip_no VARCHAR(50),
        patient_name VARCHAR(150),
        age VARCHAR(10),
        sex VARCHAR(20),
        uhid_no VARCHAR(50),
        date VARCHAR(50),
        ward VARCHAR(100),
        bed_no VARCHAR(50),
        time_of_collection VARCHAR(50),
        collected_by VARCHAR(150),
        referring_doctor VARCHAR(150),
        priority VARCHAR(50),
        clinical_diagnosis TEXT,
        anticoagulant_therapy TEXT,
        time_received VARCHAR(50),
        received_by VARCHAR(150),
        lab_no VARCHAR(50),
        others TEXT,
        notes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('labrequisition table recreated with patient info, form data, and JSONB notes.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
};

recreateTable();
