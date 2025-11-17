import { pool } from "../config/db.js";

const Grade = {
  // Find grades with optional filters and population
  async find(filter = {}) {
    let query = `
      SELECT g.*,
             u.id as student_id_val, u.name as student_name, u.email as student_email,
             c.id as course_id_val, c.name as course_name, c.code as course_code
      FROM grades g
      LEFT JOIN users u ON g.student_id = u.id
      LEFT JOIN courses c ON g.course_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filter.course) {
      query += ` AND g.course_id = $${paramCount}`;
      params.push(filter.course);
      paramCount++;
    }

    if (filter.student) {
      query += ` AND g.student_id = $${paramCount}`;
      params.push(filter.student);
      paramCount++;
    }

    const result = await pool.query(query, params);
    return result.rows.map(enhanceGrade);
  },

  // Find one grade
  async findOne(filter) {
    let query = `
      SELECT g.*,
             u.id as student_id_val, u.name as student_name, u.email as student_email,
             c.id as course_id_val, c.name as course_name, c.code as course_code
      FROM grades g
      LEFT JOIN users u ON g.student_id = u.id
      LEFT JOIN courses c ON g.course_id = c.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filter.course) {
      query += ` AND g.course_id = $${paramCount}`;
      params.push(filter.course);
      paramCount++;
    }

    if (filter.student) {
      query += ` AND g.student_id = $${paramCount}`;
      params.push(filter.student);
      paramCount++;
    }

    query += ' LIMIT 1';
    const result = await pool.query(query, params);
    return result.rows[0] ? enhanceGrade(result.rows[0]) : null;
  },

  // Find grade by ID
  async findById(id) {
    const result = await pool.query(
      `SELECT g.*,
              u.id as student_id_val, u.name as student_name, u.email as student_email,
              c.id as course_id_val, c.name as course_name, c.code as course_code
       FROM grades g
       LEFT JOIN users u ON g.student_id = u.id
       LEFT JOIN courses c ON g.course_id = c.id
       WHERE g.id = $1`,
      [id]
    );
    return result.rows[0] ? enhanceGrade(result.rows[0]) : null;
  },

  // Find one and update (upsert support)
  async findOneAndUpdate(filter, update, options = {}) {
    const { course, student } = filter;
    const { marks } = update;

    if (options.upsert) {
      // Try to update first, if no rows affected, insert
      const updateResult = await pool.query(
        `UPDATE grades 
         SET marks_midsem = $3, marks_endsem = $4, marks_quizzes = $5,
             marks_quiz1 = $6, marks_quiz2 = $7, marks_quiz3 = $8, marks_quiz4 = $9,
             marks_quiz5 = $10, marks_quiz6 = $11, marks_quiz7 = $12, marks_quiz8 = $13,
             marks_quiz9 = $14, marks_quiz10 = $15, marks_assignment1 = $16,
             marks_assignment2 = $17, marks_assignment3 = $18, marks_assignment4 = $19,
             marks_assignment5 = $20, marks_project = $21, marks_assignment = $22,
             marks_attendance = $23, marks_participation = $24
         WHERE course_id = $1 AND student_id = $2
         RETURNING *`,
        [
          course, student,
          marks.midsem || 0, marks.endsem || 0, marks.quizzes || 0,
          marks.quiz1 || 0, marks.quiz2 || 0, marks.quiz3 || 0, marks.quiz4 || 0,
          marks.quiz5 || 0, marks.quiz6 || 0, marks.quiz7 || 0, marks.quiz8 || 0,
          marks.quiz9 || 0, marks.quiz10 || 0, marks.assignment1 || 0,
          marks.assignment2 || 0, marks.assignment3 || 0, marks.assignment4 || 0,
          marks.assignment5 || 0, marks.project || 0, marks.assignment || 0,
          marks.attendance || 0, marks.participation || 0
        ]
      );

      if (updateResult.rows.length > 0) {
        return enhanceGrade(updateResult.rows[0]);
      }

      // Insert if not found
      const insertResult = await pool.query(
        `INSERT INTO grades (
          course_id, student_id,
          marks_midsem, marks_endsem, marks_quizzes, marks_quiz1, marks_quiz2,
          marks_quiz3, marks_quiz4, marks_quiz5, marks_quiz6, marks_quiz7,
          marks_quiz8, marks_quiz9, marks_quiz10, marks_assignment1, marks_assignment2,
          marks_assignment3, marks_assignment4, marks_assignment5, marks_project,
          marks_assignment, marks_attendance, marks_participation
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15,
          $16, $17, $18, $19, $20, $21, $22, $23, $24
        ) RETURNING *`,
        [
          course, student,
          marks.midsem || 0, marks.endsem || 0, marks.quizzes || 0,
          marks.quiz1 || 0, marks.quiz2 || 0, marks.quiz3 || 0, marks.quiz4 || 0,
          marks.quiz5 || 0, marks.quiz6 || 0, marks.quiz7 || 0, marks.quiz8 || 0,
          marks.quiz9 || 0, marks.quiz10 || 0, marks.assignment1 || 0,
          marks.assignment2 || 0, marks.assignment3 || 0, marks.assignment4 || 0,
          marks.assignment5 || 0, marks.project || 0, marks.assignment || 0,
          marks.attendance || 0, marks.participation || 0
        ]
      );

      return enhanceGrade(insertResult.rows[0]);
    }

    // Regular update without upsert
    const result = await pool.query(
      `UPDATE grades 
       SET marks_midsem = $3, marks_endsem = $4, marks_quizzes = $5,
           marks_quiz1 = $6, marks_quiz2 = $7, marks_quiz3 = $8, marks_quiz4 = $9,
           marks_quiz5 = $10, marks_quiz6 = $11, marks_quiz7 = $12, marks_quiz8 = $13,
           marks_quiz9 = $14, marks_quiz10 = $15, marks_assignment1 = $16,
           marks_assignment2 = $17, marks_assignment3 = $18, marks_assignment4 = $19,
           marks_assignment5 = $20, marks_project = $21, marks_assignment = $22,
           marks_attendance = $23, marks_participation = $24
       WHERE course_id = $1 AND student_id = $2
       RETURNING *`,
      [
        course, student,
        marks.midsem || 0, marks.endsem || 0, marks.quizzes || 0,
        marks.quiz1 || 0, marks.quiz2 || 0, marks.quiz3 || 0, marks.quiz4 || 0,
        marks.quiz5 || 0, marks.quiz6 || 0, marks.quiz7 || 0, marks.quiz8 || 0,
        marks.quiz9 || 0, marks.quiz10 || 0, marks.assignment1 || 0,
        marks.assignment2 || 0, marks.assignment3 || 0, marks.assignment4 || 0,
        marks.assignment5 || 0, marks.project || 0, marks.assignment || 0,
        marks.attendance || 0, marks.participation || 0
      ]
    );

    return result.rows[0] ? enhanceGrade(result.rows[0]) : null;
  },

  // Populate course and student
  async populate(grade, fields) {
    if (!grade) return null;

    // Already populated in queries above
    return grade;
  }
};

// Helper to enhance grade objects
export const enhanceGrade = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id, // MongoDB compatibility
    course: row.course_id,
    student: row.student_id ? {
      _id: row.student_id,
      id: row.student_id,
      name: row.student_name,
      email: row.student_email
    } : row.student_id,
    marks: {
      midsem: parseFloat(row.marks_midsem) || 0,
      endsem: parseFloat(row.marks_endsem) || 0,
      quizzes: parseFloat(row.marks_quizzes) || 0,
      quiz1: parseFloat(row.marks_quiz1) || 0,
      quiz2: parseFloat(row.marks_quiz2) || 0,
      quiz3: parseFloat(row.marks_quiz3) || 0,
      quiz4: parseFloat(row.marks_quiz4) || 0,
      quiz5: parseFloat(row.marks_quiz5) || 0,
      quiz6: parseFloat(row.marks_quiz6) || 0,
      quiz7: parseFloat(row.marks_quiz7) || 0,
      quiz8: parseFloat(row.marks_quiz8) || 0,
      quiz9: parseFloat(row.marks_quiz9) || 0,
      quiz10: parseFloat(row.marks_quiz10) || 0,
      assignment1: parseFloat(row.marks_assignment1) || 0,
      assignment2: parseFloat(row.marks_assignment2) || 0,
      assignment3: parseFloat(row.marks_assignment3) || 0,
      assignment4: parseFloat(row.marks_assignment4) || 0,
      assignment5: parseFloat(row.marks_assignment5) || 0,
      project: parseFloat(row.marks_project) || 0,
      assignment: parseFloat(row.marks_assignment) || 0,
      attendance: parseFloat(row.marks_attendance) || 0,
      participation: parseFloat(row.marks_participation) || 0
    },
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export default Grade;
