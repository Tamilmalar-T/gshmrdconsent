const pool = require('./db');

async function migrate() {
  const alterStatements = [
    `ALTER TABLE form_header_master ADD COLUMN IF NOT EXISTS hospital_code VARCHAR(50) DEFAULT ''`,
    `ALTER TABLE form_header_master ADD COLUMN IF NOT EXISTS branch_code VARCHAR(50) DEFAULT ''`,
    `ALTER TABLE form_header_master ADD COLUMN IF NOT EXISTS branch_name VARCHAR(200) DEFAULT ''`,
    `ALTER TABLE form_header_master ADD COLUMN IF NOT EXISTS branch_address VARCHAR(300) DEFAULT ''`,
    `ALTER TABLE form_header_master ADD COLUMN IF NOT EXISTS area_name VARCHAR(150) DEFAULT ''`,
    `ALTER TABLE form_header_master ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(50) DEFAULT ''`,
    `ALTER TABLE form_header_master ADD COLUMN IF NOT EXISTS whatsapp_enabled BOOLEAN DEFAULT TRUE`,
    `ALTER TABLE form_header_master ADD COLUMN IF NOT EXISTS field_fonts JSONB`,
  ];

  try {
    for (const stmt of alterStatements) {
      await pool.query(stmt);
      console.log('OK:', stmt.substring(0, 70));
    }
    console.log('\nMigration complete — all new columns added to form_header_master.');
    process.exit(0);
  } catch (err) {
    console.error('Migration error:', err.message);
    process.exit(1);
  }
}

migrate();
