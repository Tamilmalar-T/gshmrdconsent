const pool = require('./db');

const recreateTable = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS nursescareplan;');
    
    const query = `
      CREATE TABLE nursescareplan (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        patient_name VARCHAR(150),
        notes TEXT,
        sign VARCHAR(100),
        date VARCHAR(50),
        time VARCHAR(50),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('nursescareplan table recreated with requested columns.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
};

recreateTable();
