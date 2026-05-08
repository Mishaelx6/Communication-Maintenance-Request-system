const { pool } = require('../config/database');

class MaintenanceRequest {
  static async create(requestData) {
    const { tenant_id, title, description } = requestData;
    const result = await pool.query(
      'INSERT INTO maintenance_requests (tenant_id, title, description) VALUES ($1, $2, $3) RETURNING id',
      [tenant_id, title, description]
    );
    return result.rows[0].id;
  }

  static async findAll(status = null, assignedTo = null) {
    let query = `
      SELECT mr.*, 
             u.name as tenant_name, u.email as tenant_email,
             assigned.name as assigned_name, assigned.email as assigned_email
      FROM maintenance_requests mr
      JOIN users u ON mr.tenant_id = u.id
      LEFT JOIN users assigned ON mr.assigned_to = assigned.id
    `;
    let params = [];
    let paramIndex = 1;
    
    const conditions = [];
    if (status) {
      conditions.push(`mr.status = $${paramIndex++}`);
      params.push(status);
    }
    if (assignedTo) {
      conditions.push(`mr.assigned_to = $${paramIndex++}`);
      params.push(assignedTo);
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY mr.created_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  }

  static async findByTenantId(tenantId) {
    const result = await pool.query(
      `SELECT mr.*, 
              assigned.name as assigned_name, assigned.email as assigned_email
       FROM maintenance_requests mr
       LEFT JOIN users assigned ON mr.assigned_to = assigned.id
       WHERE mr.tenant_id = $1
       ORDER BY mr.created_at DESC`,
      [tenantId]
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await pool.query(
      `SELECT mr.*, 
              u.name as tenant_name, u.email as tenant_email,
              assigned.name as assigned_name, assigned.email as assigned_email
       FROM maintenance_requests mr
       JOIN users u ON mr.tenant_id = u.id
       LEFT JOIN users assigned ON mr.assigned_to = assigned.id
       WHERE mr.id = $1`,
      [id]
    );
    return result.rows[0];
  }

  static async updateStatus(id, status, assignedTo = null, updatedBy) {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      
      // Get current status for tracking
      const current = await client.query(
        'SELECT status FROM maintenance_requests WHERE id = $1',
        [id]
      );
      
      // Update the request
      const result = await client.query(
        'UPDATE maintenance_requests SET status = $1, assigned_to = $2 WHERE id = $3',
        [status, assignedTo, id]
      );
      
      // Track the status change
      if (result.rowCount > 0) {
        await client.query(
          'INSERT INTO maintenance_updates (request_id, updated_by, old_status, new_status, notes) VALUES ($1, $2, $3, $4, $5)',
          [id, updatedBy, current.rows[0]?.status, status, `Status updated to ${status}`]
        );
      }
      
      await client.query('COMMIT');
      return result.rowCount > 0;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async getUpdates(requestId) {
    const result = await pool.query(
      `SELECT mu.*, u.name as updated_by_name, u.role as updated_by_role
       FROM maintenance_updates mu
       JOIN users u ON mu.updated_by = u.id
       WHERE mu.request_id = $1
       ORDER BY mu.created_at DESC`,
      [requestId]
    );
    return result.rows;
  }

  static async addUpdate(requestId, updatedBy, oldStatus, newStatus, notes = '') {
    const result = await pool.query(
      'INSERT INTO maintenance_updates (request_id, updated_by, old_status, new_status, notes) VALUES ($1, $2, $3, $4, $5) RETURNING id',
      [requestId, updatedBy, oldStatus, newStatus, notes]
    );
    return result.rows[0].id;
  }

  static async delete(id) {
    const result = await pool.query(
      'DELETE FROM maintenance_requests WHERE id = $1',
      [id]
    );
    return result.rowCount > 0;
  }
}

module.exports = MaintenanceRequest;
