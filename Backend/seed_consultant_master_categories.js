const pool = require('./db');

const newOptions = [
  // Title
  { category: 'Title', label: 'Prof.', status: 'Active' },

  // Qualification
  { category: 'Qualification', label: 'MBBS', status: 'Active' },
  { category: 'Qualification', label: 'MD', status: 'Active' },
  { category: 'Qualification', label: 'MS', status: 'Active' },
  { category: 'Qualification', label: 'DNB', status: 'Active' },
  { category: 'Qualification', label: 'DM', status: 'Active' },
  { category: 'Qualification', label: 'MCh', status: 'Active' },
  { category: 'Qualification', label: 'BDS', status: 'Active' },
  { category: 'Qualification', label: 'MDS', status: 'Active' },
  { category: 'Qualification', label: 'BAMS', status: 'Active' },
  { category: 'Qualification', label: 'BHMS', status: 'Active' },
  { category: 'Qualification', label: 'Fellowship', status: 'Active' },
  { category: 'Qualification', label: 'Diploma', status: 'Active' },
  { category: 'Qualification', label: 'MD, MBBS', status: 'Active' },
  { category: 'Qualification', label: 'MS (Ortho)', status: 'Active' },

  // Designation
  { category: 'Designation', label: 'Senior Consultant', status: 'Active' },
  { category: 'Designation', label: 'Consultant', status: 'Active' },
  { category: 'Designation', label: 'Junior Consultant', status: 'Active' },
  { category: 'Designation', label: 'HOD', status: 'Active' },
  { category: 'Designation', label: 'HOD Orthopedics', status: 'Active' },
  { category: 'Designation', label: 'Chief Surgeon', status: 'Active' },
  { category: 'Designation', label: 'Associate Consultant', status: 'Active' },
  { category: 'Designation', label: 'Visiting Specialist', status: 'Active' },
  { category: 'Designation', label: 'Resident Doctor', status: 'Active' },
  { category: 'Designation', label: 'Duty Doctor', status: 'Active' },
  { category: 'Designation', label: 'Professor', status: 'Active' },
  { category: 'Designation', label: 'Assistant Professor', status: 'Active' },

  // Department
  { category: 'Department', label: 'General Medicine', status: 'Active' },
  { category: 'Department', label: 'Cardiology', status: 'Active' },
  { category: 'Department', label: 'Orthopedics', status: 'Active' },
  { category: 'Department', label: 'Pediatrics', status: 'Active' },
  { category: 'Department', label: 'Obstetrics & Gynecology', status: 'Active' },
  { category: 'Department', label: 'General Surgery', status: 'Active' },
  { category: 'Department', label: 'Neurology', status: 'Active' },
  { category: 'Department', label: 'Laboratory', status: 'Active' },
  { category: 'Department', label: 'Radiology', status: 'Active' },
  { category: 'Department', label: 'Emergency Medicine', status: 'Active' },
  { category: 'Department', label: 'ENT', status: 'Active' },
  { category: 'Department', label: 'Dermatology', status: 'Active' },
  { category: 'Department', label: 'Ophthalmology', status: 'Active' },
  { category: 'Department', label: 'Self', status: 'Active' }
];

async function seed() {
  try {
    for (const item of newOptions) {
      const check = await pool.query(
        'SELECT id FROM patient_register_master WHERE category = $1 AND label = $2',
        [item.category, item.label]
      );
      if (check.rows.length === 0) {
        await pool.query(
          'INSERT INTO patient_register_master (category, label, status) VALUES ($1, $2, $3)',
          [item.category, item.label, item.status]
        );
        console.log(`Inserted: [${item.category}] ${item.label}`);
      } else {
        console.log(`Already exists: [${item.category}] ${item.label}`);
      }
    }
    console.log('Seeding completed successfully!');
  } catch (err) {
    console.error('Error seeding data:', err);
  } finally {
    await pool.end();
  }
}

seed();
