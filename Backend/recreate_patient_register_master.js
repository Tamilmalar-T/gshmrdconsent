const pool = require('./db');

const initialData = [
  // Reg Type
  { category: 'Reg Type', label: 'Normal', status: 'Active' },
  { category: 'Reg Type', label: 'Emergency', status: 'Active' },
  { category: 'Reg Type', label: 'VIP', status: 'Active' },
  // Title
  { category: 'Title', label: 'Mr.', status: 'Active' },
  { category: 'Title', label: 'Mrs.', status: 'Active' },
  { category: 'Title', label: 'Ms.', status: 'Active' },
  { category: 'Title', label: 'Miss', status: 'Active' },
  { category: 'Title', label: 'Dr.', status: 'Active' },
  { category: 'Title', label: 'Master', status: 'Active' },
  { category: 'Title', label: 'Baby', status: 'Active' },
  // Gender
  { category: 'Gender', label: 'Male', status: 'Active' },
  { category: 'Gender', label: 'Female', status: 'Active' },
  { category: 'Gender', label: 'Other', status: 'Active' },
  // Relation Type
  { category: 'Relation Type', label: 'Father', status: 'Active' },
  { category: 'Relation Type', label: 'Mother', status: 'Active' },
  { category: 'Relation Type', label: 'Husband', status: 'Active' },
  { category: 'Relation Type', label: 'Wife', status: 'Active' },
  { category: 'Relation Type', label: 'Son', status: 'Active' },
  { category: 'Relation Type', label: 'Daughter', status: 'Active' },
  { category: 'Relation Type', label: 'Brother', status: 'Active' },
  { category: 'Relation Type', label: 'Sister', status: 'Active' },
  { category: 'Relation Type', label: 'Relative', status: 'Active' },
  { category: 'Relation Type', label: 'Friend', status: 'Active' },
  { category: 'Relation Type', label: 'Other', status: 'Active' },
  // Occupation
  { category: 'Occupation', label: 'Student', status: 'Active' },
  { category: 'Occupation', label: 'Employee', status: 'Active' },
  { category: 'Occupation', label: 'Business', status: 'Active' },
  { category: 'Occupation', label: 'Professional', status: 'Active' },
  { category: 'Occupation', label: 'Housewife', status: 'Active' },
  { category: 'Occupation', label: 'Farmer', status: 'Active' },
  { category: 'Occupation', label: 'Retired', status: 'Active' },
  { category: 'Occupation', label: 'Other', status: 'Active' },
  // Blood Group
  { category: 'Blood Group', label: 'O+', status: 'Active' },
  { category: 'Blood Group', label: 'O-', status: 'Active' },
  { category: 'Blood Group', label: 'A+', status: 'Active' },
  { category: 'Blood Group', label: 'A-', status: 'Active' },
  { category: 'Blood Group', label: 'B+', status: 'Active' },
  { category: 'Blood Group', label: 'B-', status: 'Active' },
  { category: 'Blood Group', label: 'AB+', status: 'Active' },
  { category: 'Blood Group', label: 'AB-', status: 'Active' },
  // Patient Type
  { category: 'Patient Type', label: 'General', status: 'Active' },
  { category: 'Patient Type', label: 'Corporate', status: 'Active' },
  { category: 'Patient Type', label: 'Insurance', status: 'Active' },
  { category: 'Patient Type', label: 'Staff', status: 'Active' },
  { category: 'Patient Type', label: 'Government Scheme', status: 'Active' },
  // ID Type
  { category: 'ID Type', label: 'Aadhar Card', status: 'Active' },
  { category: 'ID Type', label: 'Voter ID', status: 'Active' },
  { category: 'ID Type', label: 'Driving License', status: 'Active' },
  { category: 'ID Type', label: 'Passport', status: 'Active' },
  { category: 'ID Type', label: 'PAN Card', status: 'Active' },
  { category: 'ID Type', label: 'Other', status: 'Active' },
  // Religion
  { category: 'Religion', label: 'Hindu', status: 'Active' },
  { category: 'Religion', label: 'Muslim', status: 'Active' },
  { category: 'Religion', label: 'Christian', status: 'Active' },
  { category: 'Religion', label: 'Sikh', status: 'Active' },
  { category: 'Religion', label: 'Jain', status: 'Active' },
  { category: 'Religion', label: 'Buddhist', status: 'Active' },
  { category: 'Religion', label: 'Other', status: 'Active' },
  // Nationality
  { category: 'Nationality', label: 'Indian', status: 'Active' },
  { category: 'Nationality', label: 'NRI', status: 'Active' },
  { category: 'Nationality', label: 'Foreigner', status: 'Active' },
  // Marital Status
  { category: 'Marital Status', label: 'Single', status: 'Active' },
  { category: 'Marital Status', label: 'Married', status: 'Active' },
  { category: 'Marital Status', label: 'Divorced', status: 'Active' },
  { category: 'Marital Status', label: 'Widowed', status: 'Active' },
];

async function recreateTable() {
  try {
    console.log('Creating patient_register_master table...');
    const dropQuery = `DROP TABLE IF EXISTS patient_register_master CASCADE;`;
    await pool.query(dropQuery);

    const createQuery = `
      CREATE TABLE patient_register_master (
        id SERIAL PRIMARY KEY,
        category VARCHAR(50) NOT NULL,
        label VARCHAR(100) NOT NULL,
        status VARCHAR(20) DEFAULT 'Active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createQuery);
    
    console.log('Table created. Seeding initial data...');
    
    for (const item of initialData) {
      const insertQuery = `
        INSERT INTO patient_register_master (category, label, status)
        VALUES ($1, $2, $3)
      `;
      await pool.query(insertQuery, [item.category, item.label, item.status]);
    }
    
    console.log('patient_register_master table seeded successfully!');
    process.exit(0);
  } catch (err) {
    console.error('Error recreating table:', err);
    process.exit(1);
  }
}

recreateTable();
