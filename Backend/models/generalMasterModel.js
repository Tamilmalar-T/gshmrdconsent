const pool = require('../db');

class GeneralMasterModel {
  static async getAll() {
    const query = 'SELECT * FROM general_master ORDER BY form_name, field_name, id ASC;';
    const { rows } = await pool.query(query);
    return rows;
  }

  static async create(data) {
    const { form_name, field_name, suggestion_value, status } = data;
    const query = `
      INSERT INTO general_master (form_name, field_name, suggestion_value, status)
      VALUES ($1, $2, $3, $4)
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [form_name, field_name, suggestion_value, status || 'Active']);
    return rows[0];
  }

  static async update(id, data) {
    const { form_name, field_name, suggestion_value, status } = data;
    const query = `
      UPDATE general_master
      SET form_name = $1, field_name = $2, suggestion_value = $3, status = $4
      WHERE id = $5
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [form_name, field_name, suggestion_value, status, id]);
    return rows[0];
  }

  static async delete(id) {
    const query = 'DELETE FROM general_master WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }

  static async getCategories() {
    const query = 'SELECT * FROM general_master_categories ORDER BY name ASC;';
    const { rows } = await pool.query(query);
    return rows;
  }

  static async addCategory(name) {
    const query = `
      INSERT INTO general_master_categories (name)
      VALUES ($1)
      ON CONFLICT (name) DO NOTHING
      RETURNING *;
    `;
    const { rows } = await pool.query(query, [name]);
    return rows[0]; // Might be undefined if conflict
  }

  static async deleteCategory(id) {
    const query = 'DELETE FROM general_master_categories WHERE id = $1 RETURNING *;';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
}

module.exports = GeneralMasterModel;
