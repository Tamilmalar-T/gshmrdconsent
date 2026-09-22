const pool = require('../db');

class PatientRegisterMasterModel {
  static async getAll() {
    const query = 'SELECT * FROM patient_register_master ORDER BY category, id ASC;';
    const { rows } = await pool.query(query);
    return rows;
  }

  static async create(data) {
    const { category, label, status, color } = data;
    const query = `
      INSERT INTO patient_register_master (category, label, status, color)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [category, label, status || 'Active', color || null]);
    return rows[0];
  }

  static async update(id, data) {
    const { category, label, status, color } = data;
    const query = `
      UPDATE patient_register_master
      SET category = $1, label = $2, status = $3, color = $4
      WHERE id = $5
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [category, label, status, color || null, id]);
    return rows[0];
  }

  static async delete(id) {
    let query;
    let values;
    if (isNaN(Number(id))) {
      query = 'DELETE FROM patient_register_master WHERE label = $1 RETURNING *;';
      values = [id];
    } else {
      query = 'DELETE FROM patient_register_master WHERE id = $1 RETURNING *;';
      values = [parseInt(id, 10)];
    }
    const { rows } = await pool.query(query, values);
    return rows[0];
  }
}

module.exports = PatientRegisterMasterModel;
