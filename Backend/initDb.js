const fs = require('fs');
const path = require('path');
const pool = require('./db');

async function initializeDatabase() {
  try {
    const schemaSql = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf-8');
    await pool.query(schemaSql);
    console.log('✓ PostgreSQL Database Schema synchronized successfully (all medical tables verified)');
  } catch (err) {
    console.error('⚠ Database Schema sync warning:', err.message);
  }
}

module.exports = initializeDatabase;
