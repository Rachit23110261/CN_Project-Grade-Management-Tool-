import { pool } from "../config/db.js";

const Course = {
  // Create a new course
  async create(courseData) {
    const {
      name, code, description, professor,
      policy = {}, maxMarks = {}, quizCount = 0, assignmentCount = 0,
      gradingScheme = 'relative'
    } = courseData;

    const result = await pool.query(
      `INSERT INTO courses (
        name, code, description, professor_id,
        policy_midsem, policy_endsem, policy_quizzes, policy_project,
        policy_assignment, policy_attendance, policy_participation,
        quiz_count, assignment_count, grading_scheme
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14)
      RETURNING *`,
      [
        name, code, description, professor,
        policy.midsem || 0, policy.endsem || 0, policy.quizzes || 0,
        policy.project || 0, policy.assignment || 0, policy.attendance || 0,
        policy.participation || 0, quizCount, assignmentCount,
        gradingScheme || 'relative'
      ]
    );

    return enhanceCourse(result.rows[0]);
  },

  // Find all courses with optional population
  async find(filter = {}) {
    let query = `
      SELECT c.*, 
             u.id as prof_id, u.name as prof_name, u.email as prof_email
      FROM courses c
      LEFT JOIN users u ON c.professor_id = u.id
    `;
    const params = [];

    if (filter.professor) {
      query += ' WHERE c.professor_id = $1';
      params.push(filter.professor);
    }

    const result = await pool.query(query, params);
    return result.rows.map(enhanceCourse);
  },

  // Find course by ID
  async findById(id) {
    const result = await pool.query(
      `SELECT c.*,
              u.id as prof_id, u.name as prof_name, u.email as prof_email
       FROM courses c
       LEFT JOIN users u ON c.professor_id = u.id
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) return null;
    return enhanceCourse(result.rows[0]);
  },

  // Populate professor and students
  async populate(course, fields) {
    if (!course) return null;

    const enhanced = { ...course };

    if (fields.includes('professor')) {
      const profResult = await pool.query(
        'SELECT id, name, email FROM users WHERE id = $1',
        [course.professor_id]
      );
      enhanced.professor = profResult.rows[0];
    }

    if (fields.includes('students')) {
      const studentsResult = await pool.query(
        `SELECT u.id, u.name, u.email
         FROM users u
         JOIN course_students cs ON u.id = cs.student_id
         WHERE cs.course_id = $1`,
        [course.id]
      );
      enhanced.students = studentsResult.rows;
    }

    return enhanced;
  },

  // Update course
  async findByIdAndUpdate(id, updates, options = {}) {
    const fields = [];
    const values = [];
    let paramCount = 1;

    // Handle policy updates
    if (updates.policy) {
      for (const [key, value] of Object.entries(updates.policy)) {
        fields.push(`policy_${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
      delete updates.policy;
    }

    // Handle maxMarks updates
    if (updates.maxMarks) {
      for (const [key, value] of Object.entries(updates.maxMarks)) {
        fields.push(`max_marks_${key} = $${paramCount}`);
        values.push(value);
        paramCount++;
      }
      delete updates.maxMarks;
    }

    // Handle other fields
    for (const [key, value] of Object.entries(updates)) {
      if (key === '$push' || key === '$pull') continue; // Skip MongoDB operators
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      fields.push(`${snakeKey} = $${paramCount}`);
      values.push(value);
      paramCount++;
    }

    if (fields.length === 0) {
      return await Course.findById(id);
    }

    values.push(id);
    const query = `UPDATE courses SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`;
    const result = await pool.query(query, values);

    if (options.new && result.rows[0]) {
      return enhanceCourse(result.rows[0]);
    }
    return result.rows[0] ? enhanceCourse(result.rows[0]) : null;
  },

  // Add student to course
  async addStudent(courseId, studentId) {
    await pool.query(
      `INSERT INTO course_students (course_id, student_id)
       VALUES ($1, $2)
       ON CONFLICT (course_id, student_id) DO NOTHING`,
      [courseId, studentId]
    );
  },

  // Save method for course instance
  async save(course) {
    const result = await pool.query(
      `UPDATE courses 
       SET name = $2, description = $3,
           policy_midsem = $4, policy_endsem = $5, policy_quizzes = $6,
           policy_project = $7, policy_assignment = $8, policy_attendance = $9,
           policy_participation = $10, quiz_count = $11, assignment_count = $12,
           letter_grades_published = $13
       WHERE id = $1
       RETURNING *`,
      [
        course.id, course.name, course.description,
        course.policy_midsem, course.policy_endsem, course.policy_quizzes,
        course.policy_project, course.policy_assignment, course.policy_attendance,
        course.policy_participation, course.quiz_count, course.assignment_count,
        course.letter_grades_published
      ]
    );
    return enhanceCourse(result.rows[0]);
  }
};

// Helper to enhance course objects with MongoDB-like structure
export const enhanceCourse = (row) => {
  if (!row) return null;

  const course = {
    id: row.id,
    _id: row.id, // MongoDB compatibility
    name: row.name,
    code: row.code,
    description: row.description,
    professor: row.professor_id,
    professorId: row.professor_id, // For authorization checks
    professor_id: row.professor_id, // Database field name
    policy: {
      midsem: row.policy_midsem || 0,
      endsem: row.policy_endsem || 0,
      quizzes: row.policy_quizzes || 0,
      project: row.policy_project || 0,
      assignment: row.policy_assignment || 0,
      attendance: row.policy_attendance || 0,
      participation: row.policy_participation || 0
    },
    maxMarks: {
      midsem: row.max_marks_midsem || 100,
      endsem: row.max_marks_endsem || 100,
      quiz1: row.max_marks_quiz1 || 100,
      quiz2: row.max_marks_quiz2 || 100,
      quiz3: row.max_marks_quiz3 || 100,
      quiz4: row.max_marks_quiz4 || 100,
      quiz5: row.max_marks_quiz5 || 100,
      quiz6: row.max_marks_quiz6 || 100,
      quiz7: row.max_marks_quiz7 || 100,
      quiz8: row.max_marks_quiz8 || 100,
      quiz9: row.max_marks_quiz9 || 100,
      quiz10: row.max_marks_quiz10 || 100,
      assignment1: row.max_marks_assignment1 || 100,
      assignment2: row.max_marks_assignment2 || 100,
      assignment3: row.max_marks_assignment3 || 100,
      assignment4: row.max_marks_assignment4 || 100,
      assignment5: row.max_marks_assignment5 || 100,
      project: row.max_marks_project || 100,
      assignment: row.max_marks_assignment || 100,
      attendance: row.max_marks_attendance || 100,
      participation: row.max_marks_participation || 100
    },
    quizCount: row.quiz_count || 0,
    assignmentCount: row.assignment_count || 0,
    letterGradesPublished: row.letter_grades_published || false,
    gradingScheme: row.grading_scheme || 'relative',
    gradingScale: row.grading_scale || {
      "A+": { min: 95, max: 100 },
      "A": { min: 90, max: 94.99 },
      "A-": { min: 85, max: 89.99 },
      "B+": { min: 80, max: 84.99 },
      "B": { min: 75, max: 79.99 },
      "B-": { min: 70, max: 74.99 },
      "C+": { min: 65, max: 69.99 },
      "C": { min: 60, max: 64.99 },
      "C-": { min: 55, max: 59.99 },
      "D": { min: 50, max: 54.99 },
      "F": { min: 0, max: 49.99 }
    },
    students: row.students || [],
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };

  // Add professor info if available
  if (row.prof_id) {
    course.professor = {
      _id: row.prof_id,
      id: row.prof_id,
      name: row.prof_name,
      email: row.prof_email
    };
  }

  // Add save method
  course.save = async function() {
    return await Course.save(this);
  };

  // Add markModified (no-op for SQL)
  course.markModified = function() {};

  return course;
};

// Get all students enrolled in a course
Course.getStudents = async function(courseId) {
  const result = await pool.query(
    `SELECT u.id, u.name, u.email 
     FROM users u
     INNER JOIN course_students cs ON u.id = cs.student_id
     WHERE cs.course_id = $1`,
    [courseId]
  );
  return result.rows;
};

// Remove a student from a course
Course.removeStudent = async function(courseId, studentId) {
  await pool.query(
    'DELETE FROM course_students WHERE course_id = $1 AND student_id = $2',
    [courseId, studentId]
  );
};

// Delete a course by ID
Course.findByIdAndDelete = async function(courseId) {
  // First delete all enrollments
  await pool.query('DELETE FROM course_students WHERE course_id = $1', [courseId]);
  
  // Then delete the course
  const result = await pool.query(
    'DELETE FROM courses WHERE id = $1 RETURNING *',
    [courseId]
  );
  return result.rows[0] || null;
};

// Update grading scale for a course
Course.updateGradingScale = async function(courseId, gradingScale) {
  const result = await pool.query(
    'UPDATE courses SET grading_scale = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2 RETURNING *',
    [JSON.stringify(gradingScale), courseId]
  );
  
  if (result.rows.length === 0) return null;
  return enhanceCourse(result.rows[0]);
};

export default Course;
