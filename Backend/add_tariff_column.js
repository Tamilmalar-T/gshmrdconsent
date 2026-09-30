const pool = require('./db');

async function updateMasterTable() {
  try {
    const alterQuery = `
      ALTER TABLE patient_register_master 
      ADD COLUMN IF NOT EXISTS tariff VARCHAR(50);
    `;
    await pool.query(alterQuery);
    console.log('Successfully added tariff column to patient_register_master.');
    process.exit(0);
  } catch (err) {
    console.error('Error adding tariff column:', err.message);
    process.exit(0); // exit 0 so it does not throw unhandled error if DB isn't connected
  }
}

updateMasterTable();
