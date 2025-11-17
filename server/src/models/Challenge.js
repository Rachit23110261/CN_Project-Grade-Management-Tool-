import { pool } from "../config/db.js";

const Challenge = {
  // Create a new challenge
  async create(challengeData) {
    const {
      student, course, grade, description,
      attachmentUrl, attachmentName, status = 'pending'
    } = challengeData;

    const result = await pool.query(
      `INSERT INTO challenges (
        student_id, course_id, grade_id, description,
        attachment_url, attachment_name, status
      ) VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *`,
      [student, course, grade, description, attachmentUrl, attachmentName, status]
    );

    return enhanceChallenge(result.rows[0]);
  },

  // Find challenges with filters
  async find(filter = {}) {
    let query = `
      SELECT ch.*,
             u.id as student_id_val, u.name as student_name, u.email as student_email,
             c.id as course_id_val, c.name as course_name, c.code as course_code,
             c.professor_id, c.policy_midsem, c.policy_endsem, c.policy_quizzes,
             c.policy_project, c.policy_assignment, c.policy_attendance, c.policy_participation,
             c.quiz_count,
             g.id as grade_id_val, g.marks_midsem, g.marks_endsem, g.marks_quizzes,
             g.marks_quiz1, g.marks_quiz2, g.marks_quiz3, g.marks_quiz4, g.marks_quiz5,
             g.marks_quiz6, g.marks_quiz7, g.marks_quiz8, g.marks_quiz9, g.marks_quiz10,
             g.marks_project, g.marks_assignment, g.marks_attendance, g.marks_participation
      FROM challenges ch
      LEFT JOIN users u ON ch.student_id = u.id
      LEFT JOIN courses c ON ch.course_id = c.id
      LEFT JOIN grades g ON ch.grade_id = g.id
      WHERE 1=1
    `;
    const params = [];
    let paramCount = 1;

    if (filter.student) {
      query += ` AND ch.student_id = $${paramCount}`;
      params.push(filter.student);
      paramCount++;
    }

    if (filter.course) {
      query += ` AND ch.course_id = $${paramCount}`;
      params.push(filter.course);
      paramCount++;
    }

    query += ' ORDER BY ch.created_at DESC';

    const result = await pool.query(query, params);
    return result.rows.map(enhanceChallenge);
  },

  // Find challenge by ID
  async findById(id) {
    const result = await pool.query(
      `SELECT ch.*,
              u.id as student_id_val, u.name as student_name, u.email as student_email,
              c.id as course_id_val, c.name as course_name, c.code as course_code,
              c.professor_id, c.policy_midsem, c.policy_endsem, c.policy_quizzes,
              c.policy_project, c.policy_assignment, c.policy_attendance, c.policy_participation,
              c.quiz_count,
              g.id as grade_id_val, g.marks_midsem, g.marks_endsem, g.marks_quizzes,
              g.marks_quiz1, g.marks_quiz2, g.marks_quiz3, g.marks_quiz4, g.marks_quiz5,
              g.marks_quiz6, g.marks_quiz7, g.marks_quiz8, g.marks_quiz9, g.marks_quiz10,
              g.marks_project, g.marks_assignment, g.marks_attendance, g.marks_participation
       FROM challenges ch
       LEFT JOIN users u ON ch.student_id = u.id
       LEFT JOIN courses c ON ch.course_id = c.id
       LEFT JOIN grades g ON ch.grade_id = g.id
       WHERE ch.id = $1`,
      [id]
    );

    return result.rows[0] ? enhanceChallenge(result.rows[0]) : null;
  },

  // Count challenges for a student in a course
  async countDocuments(filter) {
    let query = 'SELECT COUNT(*) FROM challenges WHERE 1=1';
    const params = [];
    let paramCount = 1;

    if (filter.student) {
      query += ` AND student_id = $${paramCount}`;
      params.push(filter.student);
      paramCount++;
    }

    if (filter.course) {
      query += ` AND course_id = $${paramCount}`;
      params.push(filter.course);
      paramCount++;
    }

    const result = await pool.query(query, params);
    return parseInt(result.rows[0].count);
  },

  // Find one and update
  async findByIdAndUpdate(id, update, options = {}) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    for (const [key, value] of Object.entries(update)) {
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${snakeKey} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    if (fields.length === 0) {
      return await Challenge.findById(id);
    }

    values.push(id);
    const query = `UPDATE challenges SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    return result.rows[0] ? enhanceChallenge(result.rows[0]) : null;
  },

  // Get challenges for a professor (across all their courses)
  async findForProfessor(professorId) {
    const result = await pool.query(
      `SELECT ch.*,
              u.id as student_id_val, u.name as student_name, u.email as student_email,
              c.id as course_id_val, c.name as course_name, c.code as course_code,
              c.professor_id, c.policy_midsem, c.policy_endsem, c.policy_quizzes,
              c.policy_project, c.policy_assignment, c.policy_attendance, c.policy_participation,
              c.quiz_count,
              g.id as grade_id_val, g.marks_midsem, g.marks_endsem, g.marks_quizzes,
              g.marks_quiz1, g.marks_quiz2, g.marks_quiz3, g.marks_quiz4, g.marks_quiz5,
              g.marks_quiz6, g.marks_quiz7, g.marks_quiz8, g.marks_quiz9, g.marks_quiz10,
              g.marks_project, g.marks_assignment, g.marks_attendance, g.marks_participation
       FROM challenges ch
       JOIN courses c ON ch.course_id = c.id
       LEFT JOIN users u ON ch.student_id = u.id
       LEFT JOIN grades g ON ch.grade_id = g.id
       WHERE c.professor_id = $1
       ORDER BY ch.created_at DESC`,
      [professorId]
    );

    return result.rows.map(enhanceChallenge);
  }
};

// Helper to enhance challenge objects
export const enhanceChallenge = (row) => {
  if (!row) return null;

  return {
    id: row.id,
    _id: row.id, // MongoDB compatibility
    student: row.student_id ? {
      _id: row.student_id,
      id: row.student_id,
      name: row.student_name,
      email: row.student_email
    } : row.student_id,
    course: row.course_id ? {
      _id: row.course_id,
      id: row.course_id,
      name: row.course_name,
      code: row.course_code,
      professor: row.professor_id,
      policy: {
        midsem: row.policy_midsem || 0,
        endsem: row.policy_endsem || 0,
        quizzes: row.policy_quizzes || 0,
        project: row.policy_project || 0,
        assignment: row.policy_assignment || 0,
        attendance: row.policy_attendance || 0,
        participation: row.policy_participation || 0
      },
      quizCount: row.quiz_count || 0
    } : row.course_id,
    grade: row.grade_id ? {
      _id: row.grade_id,
      id: row.grade_id,
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
        project: parseFloat(row.marks_project) || 0,
        assignment: parseFloat(row.marks_assignment) || 0,
        attendance: parseFloat(row.marks_attendance) || 0,
        participation: parseFloat(row.marks_participation) || 0
      }
    } : row.grade_id,
    description: row.description,
    attachmentUrl: row.attachment_url,
    attachmentName: row.attachment_name,
    status: row.status,
    professorResponse: row.professor_response,
    professorAttachmentUrl: row.professor_attachment_url,
    professorAttachmentName: row.professor_attachment_name,
    respondedAt: row.responded_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
};

export default Challenge;
