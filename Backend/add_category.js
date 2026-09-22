const pool = require('./db');
(async () => {
  try {
    const res = await pool.query('SELECT * FROM general_master_categories WHERE name = $1', ['Antenatal Case Record']);
    if (res.rows.length === 0) {
      await pool.query('INSERT INTO general_master_categories (name) VALUES ($1)', ['Antenatal Case Record']);
      console.log('Category inserted');
    } else {
      console.log('Category already exists');
    }
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
})();
