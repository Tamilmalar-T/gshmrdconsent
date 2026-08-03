const pool = require('./db');

const createTables = async () => {
  console.log('Connecting to database to create tables...');
  
  try {
    // 1. Create Patients Table
    const createPatientsTableQuery = `
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        uhid_no VARCHAR(50) UNIQUE,
        ip_no VARCHAR(50) UNIQUE,
        age VARCHAR(10),
        sex VARCHAR(10),
        doa DATE,
        ward VARCHAR(50),
        bed_no VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createPatientsTableQuery);
    console.log('Patients table created.');

    // 2. Create tables for JSONB complex forms
    const forms = [
      'vitalschart',
      'nursesdailyassessment',
      'nursinginitialassessment',
      'activityrecordbilling',
      'intakeoutputrecord',
      'diabeticchart',
      'progresssheet',
      'consentgeneraladmission',
      'nursescareplan',
      'labrequisition',
      'bpchart',
      'progressreassessmentrecord',
      'investigationchart',
      'internaltransferform',
      'regulardrugprescription'
    ];

    for (const form of forms) {
      const query = `
        CREATE TABLE IF NOT EXISTS ${form} (
          id SERIAL PRIMARY KEY,
          patient_id INT REFERENCES patients(id) ON DELETE CASCADE,
          form_data JSONB NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
      `;
      await pool.query(query);
      console.log(`Table ${form} created.`);
    }

    console.log('All tables created successfully!');
    
  } catch (err) {
    console.error('Error creating tables:', err);
  } finally {
    pool.end();
  }
};

createTables();
