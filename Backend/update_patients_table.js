const pool = require('./db');

async function updatePatientsTable() {
  try {
    console.log('Connecting to database to update patients table...');
    
    // Add registration_data column to patients table if it doesn't exist
    const alterQuery = `
      ALTER TABLE patients 
      ADD COLUMN IF NOT EXISTS registration_data JSONB;
    `;
    
    await pool.query(alterQuery);
    console.log('Successfully updated patients table with registration_data JSONB column.');
    
    process.exit(0);
  } catch (err) {
    console.error('Error updating patients table:', err);
    process.exit(1);
  }
}

updatePatientsTable();
