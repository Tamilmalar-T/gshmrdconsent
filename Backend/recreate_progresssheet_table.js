const pool = require('./db');

const recreateTable = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS progresssheet;');
    
    const query = `
      CREATE TABLE progresssheet (
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
        signature VARCHAR(150),
        notes JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('progresssheet table recreated with patient info columns and JSONB notes.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
};

recreateTable();
