const { pool } = require('../config/database');

class Message {
  static async create(messageData) {
    const { sender_id, receiver_id, subject, content } = messageData;
    const result = await pool.query(
      'INSERT INTO messages (sender_id, receiver_id, subject, content) VALUES ($1, $2, $3, $4) RETURNING id',
      [sender_id, receiver_id, subject, content]
    );
    return result.rows[0].id;
  }

  static async findByUserId(userId, role = 'all') {
    let query, params;
    
    if (role === 'sent') {
      query = `
        SELECT m.*, u.name as sender_name, u.email as sender_email
        FROM messages m
        JOIN users u ON m.receiver_id = u.id
        WHERE m.sender_id = $1
        ORDER BY m.created_at DESC
      `;
      params = [userId];
    } else if (role === 'received') {
      query = `
        SELECT m.*, u.name as sender_name, u.email as sender_email
        FROM messages m
        JOIN users u ON m.sender_id = u.id
        WHERE m.receiver_id = $1
        ORDER BY m.created_at DESC
      `;
      params = [userId];
    } else {
      query = `
        SELECT m.*, 
               sender.name as sender_name, sender.email as sender_email,
               receiver.name as receiver_name, receiver.email as receiver_email
        FROM messages m
        JOIN users sender ON m.sender_id = sender.id
        JOIN users receiver ON m.receiver_id = receiver.id
        WHERE m.sender_id = $1 OR m.receiver_id = $2
        ORDER BY m.created_at DESC
      `;
      params = [userId, userId];
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT m.*, 
              sender.name as sender_name, sender.email as sender_email,
              receiver.name as receiver_name, receiver.email as receiver_email
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       JOIN users receiver ON m.receiver_id = receiver.id
       WHERE m.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async findConversation(userId1, userId2) {
    const result = await pool.query(
      `SELECT m.*, 
              sender.name as sender_name, sender.email as sender_email,
              receiver.name as receiver_name, receiver.email as receiver_email
       FROM messages m
       JOIN users sender ON m.sender_id = sender.id
       JOIN users receiver ON m.receiver_id = receiver.id
       WHERE (m.sender_id = $1 AND m.receiver_id = $2) 
          OR (m.sender_id = $3 AND m.receiver_id = $4)
       ORDER BY m.created_at ASC`,
      [userId1, userId2, userId2, userId1]
    );
    return result.rows;
  }

  static async markAsRead(id) {
    const result = await pool.query(
      'UPDATE messages SET read_at = CURRENT_TIMESTAMP WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM messages WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}

module.exports = Message;
