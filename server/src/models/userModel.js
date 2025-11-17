import { pool } from "../config/db.js";
import bcrypt from "bcrypt";

// User model with SQL queries
const User = {
  // Create a new user
  async create({ name, email, password, role = 'student', isPasswordHashed = false }) {
    const hashedPassword = isPasswordHashed ? password : await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (name, email, password, role) 
       VALUES ($1, $2, $3, $4) 
       RETURNING id, name, email, role, created_at, updated_at`,
      [name, email, hashedPassword, role]
    );
    return result.rows[0];
  },

  // Find user by email
  async findOne(filter) {
    if (filter.email) {
      const emailPattern = typeof filter.email === 'object' && filter.email.$regex 
        ? filter.email.$regex.source.replace(/[\^$]/g, '')
        : filter.email;
      
      const result = await pool.query(
        'SELECT * FROM users WHERE LOWER(email) = LOWER($1)',
        [emailPattern]
      );
      return result.rows[0] || null;
    }
    return null;
  },

  // Find user by ID
  async findById(id) {
    const result = await pool.query(
      'SELECT id, name, email, role, temp_password, temp_password_expires, created_at, updated_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0] || null;
  },

  // Find all users with optional filter
  async find(filter = {}) {
    let query = 'SELECT id, name, email, role, created_at, updated_at FROM users';
    const params = [];
    
    if (filter.role) {
      query += ' WHERE role = $1';
      params.push(filter.role);
    }
    
    const result = await pool.query(query, params);
    return result.rows;
  },

  // Update user
  async findByIdAndUpdate(id, updates) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Hash password if being updated
    if (updates.password) {
      updates.password = await bcrypt.hash(updates.password, 10);
    }
    if (updates.tempPassword) {
      updates.tempPassword = await bcrypt.hash(updates.tempPassword, 10);
    }

    // Build dynamic UPDATE query
    for (const [key, value] of Object.entries(updates)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${snakeKey} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    if (fields.length === 0) {
      return await User.findById(id);
    }

    values.push(id);
    const query = `UPDATE users SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);
    return result.rows[0] || null;
  },

  // Save method (for updating existing user)
  async save(user) {
    const {
      id, name, email, password, role, temp_password, 
      temp_password_expires
    } = user;

    // Hash passwords if modified
    const hashedPassword = password ? await bcrypt.hash(password, 10) : undefined;
    const hashedTempPassword = temp_password ? await bcrypt.hash(temp_password, 10) : undefined;

    const result = await pool.query(
      `UPDATE users 
       SET name = COALESCE($2, name),
           email = COALESCE($3, email),
           password = COALESCE($4, password),
           role = COALESCE($5, role),
           temp_password = $6,
           temp_password_expires = $7
       WHERE id = $1
       RETURNING *`,
      [
        id, name, email, hashedPassword, role, 
        hashedTempPassword, temp_password_expires
      ]
    );
    return result.rows[0];
  },

  // Get enrolled courses for a user
  async getEnrolledCourses(userId) {
    const result = await pool.query(
      `SELECT c.* 
       FROM courses c
       JOIN course_students cs ON c.id = cs.course_id
       WHERE cs.student_id = $1`,
      [userId]
    );
    return result.rows.map(row => row.id);
  },

  // Enroll user in a course
  async enrollCourse(userId, courseId) {
    await pool.query(
      `INSERT INTO course_students (student_id, course_id) 
       VALUES ($1, $2) 
       ON CONFLICT (course_id, student_id) DO NOTHING`,
      [userId, courseId]
    );
  },

  // Password comparison methods (added to user object after fetch)
  matchPassword: async function(enteredPassword, hashedPassword) {
    return await bcrypt.compare(enteredPassword, hashedPassword);
  },

  matchTempPassword: async function(enteredPassword, hashedTempPassword, expiresAt) {
    if (!hashedTempPassword || !expiresAt) {
      return false;
    }
    
    if (new Date() > new Date(expiresAt)) {
      return false;
    }
    
    return await bcrypt.compare(enteredPassword, hashedTempPassword);
  }
};

// Helper to add methods to user objects
export const enhanceUser = (user) => {
  if (!user) return null;
  
  return {
    ...user,
    _id: user.id, // Compatibility with MongoDB code
    enrolledCourses: [], // Will be populated if needed
    async matchPassword(enteredPassword) {
      return await bcrypt.compare(enteredPassword, this.password);
    },
    async matchTempPassword(enteredPassword) {
      if (!this.temp_password || !this.temp_password_expires) {
        return false;
      }
      if (new Date() > new Date(this.temp_password_expires)) {
        return false;
      }
      return await bcrypt.compare(enteredPassword, this.temp_password);
    },
    async save() {
      // Hash passwords if modified
      if (this.password && !this.password.startsWith('$2')) {
        this.password = await bcrypt.hash(this.password, 10);
      }
      if (this.temp_password && !this.temp_password.startsWith('$2')) {
        this.temp_password = await bcrypt.hash(this.temp_password, 10);
      }

      const result = await pool.query(
        `UPDATE users 
         SET name = $2, email = $3, password = $4, role = $5,
             temp_password = $6, temp_password_expires = $7
         WHERE id = $1
         RETURNING *`,
        [
          this.id, this.name, this.email, this.password, this.role,
          this.temp_password, this.temp_password_expires
        ]
      );
      return enhanceUser(result.rows[0]);
    }
  };
};

// Delete user by ID
User.findByIdAndDelete = async function(id) {
  const result = await pool.query(
    'DELETE FROM users WHERE id = $1 RETURNING *',
    [id]
  );
  return result.rows[0] || null;
};

// Unenroll user from a course
User.unenrollCourse = async function(userId, courseId) {
  await pool.query(
    'DELETE FROM course_students WHERE student_id = $1 AND course_id = $2',
    [userId, courseId]
  );
};

export default User;
