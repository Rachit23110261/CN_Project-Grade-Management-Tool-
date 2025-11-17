import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

// PendingRegistration model for managing registration requests
const PendingRegistration = {
  // Create a new registration request
  async create({ name, email, password, role = 'student' }) {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO pending_registrations (name, email, password, role, status) 
       VALUES ($1, $2, $3, $4, 'pending') 
       RETURNING id, name, email, role, status, requested_at`,
      [name, email, hashedPassword, role]
    );
    return result.rows[0];
  },

  // Find pending registration by email
  async findOne(filter) {
    if (filter.email) {
      const result = await pool.query(
        'SELECT * FROM pending_registrations WHERE LOWER(email) = LOWER($1)',
        [filter.email]
      );
      return result.rows[0] || null;
    }
    return null;
  },

  // Find pending registration by ID
  async findById(id) {
    const result = await pool.query(
      'SELECT * FROM pending_registrations WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  // Find all pending registrations with optional filter
  async find(filter = {}) {
    let query = `
      SELECT pr.*, u.name as reviewed_by_name 
      FROM pending_registrations pr
      LEFT JOIN users u ON pr.reviewed_by = u.id
    `;
    const params = [];
    const conditions = [];
    let paramCount = 1;
    
    if (filter.status) {
      conditions.push(`pr.status = $${paramCount}`);
      params.push(filter.status);
      paramCount++;
    }
    
    if (filter.role) {
      conditions.push(`pr.role = $${paramCount}`);
      params.push(filter.role);
      paramCount++;
    }
    
    if (conditions.length > 0) {
      query += ' WHERE ' + conditions.join(' AND ');
    }
    
    query += ' ORDER BY pr.requested_at DESC';
    
    const result = await pool.query(query, params);
    return result.rows;
  },

  // Update registration status (approve/reject)
  async updateStatus(id, status, reviewedBy, rejectionReason = null) {
    const result = await pool.query(
      `UPDATE pending_registrations 
       SET status = $1, reviewed_by = $2, reviewed_at = NOW(), rejection_reason = $3
       WHERE id = $4
       RETURNING *`,
      [status, reviewedBy, rejectionReason, id]
    );
    return result.rows[0];
  },

  // Delete a pending registration
  async deleteById(id) {
    const result = await pool.query(
      'DELETE FROM pending_registrations WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  },

  // Get count by status
  async countByStatus(status) {
    const result = await pool.query(
      'SELECT COUNT(*) FROM pending_registrations WHERE status = $1',
      [status]
    );
    return parseInt(result.rows[0].count);
  }
};

export default PendingRegistration;
