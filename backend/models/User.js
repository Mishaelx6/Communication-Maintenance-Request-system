const { pool } = require('../config/database');

class User {
  static async create(userData) {
    const { name, email, password_hash, role, phone } = userData;
    const result = await pool.query(
      'INSERT INTO users (name, email, password_hash, role, phone) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [name, email, password_hash, role, phone]
    );
    return result.rows[0].id;
  }

  static async findByEmail(email) {
    const result = await pool.query(
      'SELECT * FROM users WHERE email = $1',
      [email]
    );
    return result.rows[0];
  }

  static async findById(id) {
    const result = await pool.query(
      'SELECT id, name, email, role, phone, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findAll(role = null) {
    let query = 'SELECT id, name, email, role, phone, created_at FROM users';
    let params = [];
    
    if (role) {
      query += ' WHERE role = $1';
      params = [role];
    }
    
    query += ' ORDER BY created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async update(id, userData) {
    const { name, email, phone } = userData;
    const result = await pool.query(
      'UPDATE users SET name = $1, email = $2, phone = $3 WHERE id = $4',
      [name, email, phone, id]
    );
    return result.rowCount > 0;
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM users WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}

module.exports = User;
