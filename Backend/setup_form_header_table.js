const pool = require('./db');

async function setupTable() {
  try {
    const createQuery = `
      CREATE TABLE IF NOT EXISTS form_header_master (
        id SERIAL PRIMARY KEY,
        hospital_name VARCHAR(150) NOT NULL,
        sub_title VARCHAR(200),
        tagline VARCHAR(200),
        address_line1 VARCHAR(250),
        address_line2 VARCHAR(250),
        phone VARCHAR(100),
        email VARCHAR(100),
        website VARCHAR(100),
        logo_text VARCHAR(20) DEFAULT 'GS',
        logo_url TEXT,
        reg_no VARCHAR(100),
        header_style VARCHAR(50) DEFAULT 'Center',
        status VARCHAR(20) DEFAULT 'Active',
        is_default BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await pool.query(createQuery);
    console.log('Successfully created form_header_master table.');

    const check = await pool.query('SELECT COUNT(*) FROM form_header_master');
    if (parseInt(check.rows[0].count, 10) === 0) {
      await pool.query(`
        INSERT INTO form_header_master (
          hospital_name, sub_title, tagline, address_line1, address_line2, phone, email, website, logo_text, header_style, status
        )
        VALUES (
          'GURUSHREE', 'HI-TECH MULTI SPECIALITY HOSPITAL', 'A touch can instill faith',
          '#155/A, 3rd Stage, 4th Block, West of Chord Road', 'Rajajinagar, Bengaluru - 560010',
          '080-2315 2222 / 2315 3333', 'info@gurushreehospital.com', 'www.gurushreehospital.com',
          'GS', 'Center', 'Active'
        );
      `);
      console.log('Seeded default form header master data.');
    }
    process.exit(0);
  } catch (err) {
    console.error('Setup error:', err.message);
    process.exit(0);
  }
}

setupTable();
