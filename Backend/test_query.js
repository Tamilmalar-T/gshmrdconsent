const pool = require('./db');

async function testQuery() {
  try {
    const { rows } = await pool.query('SELECT * FROM consentgeneraladmission;');
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error('Error:', err);
  } finally {
    pool.end();
  }
}

testQuery();
