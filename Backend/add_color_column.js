const pool = require('./db');

async function updateMasterTable() {
  try {
    const alterQuery = `
      ALTER TABLE patient_register_master 
      ADD COLUMN IF NOT EXISTS color VARCHAR(20);
    `;
    await pool.query(alterQuery);
    console.log('Successfully added color column to patient_register_master.');
    process.exit(0);
  } catch (err) {
    console.error('Error:', err);
    process.exit(1);
  }
}

updateMasterTable();
