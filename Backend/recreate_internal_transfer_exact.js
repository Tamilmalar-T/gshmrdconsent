const pool = require('./db');

const recreateTable = async () => {
  try {
    await pool.query('DROP TABLE IF EXISTS internaltransferform;');
    
    const query = `
      CREATE TABLE internaltransferform (
        id SERIAL PRIMARY KEY,
        patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
        patient_name VARCHAR(150),
        age VARCHAR(20),
        sex VARCHAR(20),
        uhid_no VARCHAR(50),
        ip_no VARCHAR(50) UNIQUE,
        ward VARCHAR(100),
        bed_no VARCHAR(50),
        consultant VARCHAR(150),
        admission_datetime VARCHAR(100),
        transfer_datetime VARCHAR(100),
        from_ward VARCHAR(100),
        to_ward VARCHAR(100),
        nurse_accompanied VARCHAR(150),
        reason_transfer TEXT,
        condition_diagnosis TEXT,
        operation_performed TEXT,
        blood_transfused TEXT,
        handing_over JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(query);
    console.log('internaltransferform table recreated with exact columns.');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
};

recreateTable();
