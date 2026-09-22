const pool = require('./db');

const initialData = [
  // Nurses Daily Assessment
  { form_name: 'Nurses Daily Assessment', field_name: 'Respiratory Status', suggestion_value: 'Normal', status: 'Active' },
  { form_name: 'Nurses Daily Assessment', field_name: 'Respiratory Status', suggestion_value: 'Abnormal', status: 'Active' },
  { form_name: 'Nurses Daily Assessment', field_name: 'Respiratory Status', suggestion_value: 'Wheezing', status: 'Active' },
  { form_name: 'Nurses Daily Assessment', field_name: 'Respiratory Status', suggestion_value: 'Shortness of breath', status: 'Active' },
  { form_name: 'Nurses Daily Assessment', field_name: 'Any Other Finding', suggestion_value: 'No abnormalities detected', status: 'Active' },
  { form_name: 'Nurses Daily Assessment', field_name: 'Any Other Finding', suggestion_value: 'Patient is stable', status: 'Active' },
  { form_name: 'Nurses Daily Assessment', field_name: 'Any Special Care Given', suggestion_value: 'Provided warm blanket', status: 'Active' },
  { form_name: 'Nurses Daily Assessment', field_name: 'Any Special Care Given', suggestion_value: 'Counseling provided to attenders', status: 'Active' }
];

async function recreateTable() {
  try {
    console.log('Creating assessment_master table...');
    const dropQuery = `DROP TABLE IF EXISTS assessment_master CASCADE;`;
    await pool.query(dropQuery);

    const createQuery = `
      CREATE TABLE assessment_master (
        id SERIAL PRIMARY KEY,
        form_name VARCHAR(100) NOT NULL,
        field_name VARCHAR(100) NOT NULL,
        suggestion_value VARCHAR(255) NOT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createQuery);
    
    console.log('Table created. Seeding initial data...');
    
    for (const item of initialData) {
      const insertQuery = `
        INSERT INTO assessment_master (form_name, field_name, suggestion_value, status)
        VALUES ($1, $2, $3, $4)
      `;
      await pool.query(insertQuery, [item.form_name, item.field_name, item.suggestion_value, item.status]);
    }
    
    console.log('assessment_master table seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error recreating table:', err);
    process.exit(1);
  }
}

recreateTable();
