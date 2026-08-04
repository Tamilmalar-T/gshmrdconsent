const pool = require('./db');

const recreateTable = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS vitalschart;');
    
    const query = `
      CREATE TABLE vitalschart (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        patient_name VARCHAR(150),
        age VARCHAR(10),
        sex VARCHAR(20),
        uhid_no VARCHAR(50),
        ip_no VARCHAR(50),
        doa VARCHAR(50),
        ward VARCHAR(100),
        bed_no VARCHAR(50),
        
        vitals_records JSONB,
        
        form_data JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('vitalschart table recreated with single row per IP pattern.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
};

recreateTable();
