const pool = require('./db');

async function run() {
  const { rows: tables } = await pool.query("SELECT table_name FROM information_schema.tables WHERE table_schema='public'");
  
  for (let table of tables) {
    const { rows } = await pool.query(`SELECT COUNT(*) FROM ${table.table_name}`);
    console.log(`${table.table_name}: ${rows[0].count} records`);
    
    // If it's a form table, let's grab one record to show what it looks like
    if (table.table_name !== 'patients') {
       const sample = await pool.query(`SELECT form_data FROM ${table.table_name} LIMIT 1`);
       if (sample.rows.length > 0) {
           console.log(`  Sample data keys: ${Object.keys(sample.rows[0].form_data).join(', ')}`);
       }
    }
  }
  pool.end();
}

run();
