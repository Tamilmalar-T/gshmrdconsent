const pool = require('../db');

const INVESTIGATION_PARAMETERS = [
  "Blood Group/Rh Type", "Hemoglobin", "T. WBC", "Neutrophils", "Lymphocytes", 
  "Monocytes", "Esinophil", "ESR", "RBC", "Platelet Count", "PCV", "MCV", 
  "MCH", "MCHC", "Blood Urea", "Serum Creatnine", "Sodium", "Potassium", 
  "Chlorides", "PPBS / RBS", "FBS", "HbA1C", "MBG", "PT", "PTT", "INR", 
  "BT / CT", "HIV", "HBSAg", "HCV / TPHA", "CRP", "LFT T. Bilirubin", 
  "D. Bilirubin", "I Bilirubin", "SGOT", "SGPT", "Alkaline Phspt", "T. Protein", 
  "Albumin", "Globulin", "A/G Ratio", "Uric Acid", "Calcium", "Phosphorus", 
  "MP", "Dengue Profile - NS1", "IgG", "IgM", "Widal - O", "H", "AH", "BH", 
  "Thyroid : TSH", "T3", "T4", "Lipid Profile", "Total cholesterol", "Triglycirdes", 
  "HDL", "LDL", "VLDL", "Total Cholesterol / HDL", "LDL/HDL", "Pseudocholenestarase", 
  "CPK", "CPKMB", "Troponine - I", "Urine", "S. Amylase", "S. Lipase"
];

async function migrate() {
  try {
    console.log('Starting migration...');

    // 1. Rename table if assessment_master exists
    const checkTable = await pool.query(`
      SELECT to_regclass('public.assessment_master') as table_exists;
    `);
    
    if (checkTable.rows[0].table_exists) {
      console.log('Renaming assessment_master to general_master...');
      await pool.query(`ALTER TABLE assessment_master RENAME TO general_master;`);
    } else {
      console.log('assessment_master does not exist. Skipping rename.');
    }

    // 2. Create general_master_categories table
    console.log('Creating general_master_categories table...');
    await pool.query(`
      CREATE TABLE IF NOT EXISTS general_master_categories (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) UNIQUE NOT NULL
      );
    `);

    // 3. Seed existing categories from general_master to general_master_categories
    console.log('Seeding existing categories...');
    const checkGenTable = await pool.query(`
      SELECT to_regclass('public.general_master') as table_exists;
    `);
    
    let existingForms = [];
    if (checkGenTable.rows[0].table_exists) {
      const existingCategoriesResult = await pool.query(`
        SELECT DISTINCT form_name FROM general_master WHERE form_name IS NOT NULL;
      `);
      existingForms = existingCategoriesResult.rows.map(r => r.form_name);
    }
    
    const formNamesToSeed = new Set([
      'Nurses Daily Assessment',
      'Nursing Initial Assessment',
      'Initial Assessment Form',
      'Initial Assessment By Doctor - OP',
      'Emergency Doctor Initial Assessment',
      'Antenatal Case Record',
      'Progress & Reassessment Record - Resident Doctor',
      'Progress Sheet',
      'Nurse Care Plan',
      'Investigations',
      ...existingForms
    ]);

    for (const formName of formNamesToSeed) {
      await pool.query(`
        INSERT INTO general_master_categories (name)
        VALUES ($1)
        ON CONFLICT (name) DO NOTHING;
      `, [formName]);
    }
    
    // 4. Seed Investigations into general_master
    if (checkGenTable.rows[0].table_exists) {
      console.log('Seeding Investigations into general_master...');
      for (const param of INVESTIGATION_PARAMETERS) {
        await pool.query(`
          INSERT INTO general_master (form_name, field_name, suggestion_value, status)
          SELECT 'Investigations', CAST($1 AS VARCHAR), '-', 'Active'
          WHERE NOT EXISTS (
            SELECT 1 FROM general_master WHERE form_name = 'Investigations' AND field_name = CAST($1 AS VARCHAR)
          );
        `, [param]);
      }
    }

    console.log('Migration completed successfully!');
  } catch (error) {
    console.error('Migration failed:', error);
  } finally {
    pool.end();
  }
}

migrate();
