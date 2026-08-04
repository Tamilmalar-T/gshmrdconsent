const pool = require('./db');

const recreateTable = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS nursesdailyassessment;');
    
    const query = `
      CREATE TABLE nursesdailyassessment (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        ip_no VARCHAR(50),
        patient_name VARCHAR(150),
        age VARCHAR(10),
        sex VARCHAR(20),
        uhid_no VARCHAR(50),
        doa VARCHAR(50),
        ward VARCHAR(100),
        bed_no VARCHAR(50),
        form_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('nursesdailyassessment table recreated with flat columns and form_data.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
};

recreateTable();
