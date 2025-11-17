// CONTROLLER UPDATE REFERENCE
// Quick patterns for updating controllers to use PostgreSQL models

// ============================================================================
// 1. COURSE CONTROLLER UPDATES
// ============================================================================

// File: src/controllers/courseController.js

// --- getAllCourses ---
export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find(); // Already populated
    
    // Get enrolled course IDs
    const enrolledIds = await User.getEnrolledCourses(req.user.id);
    
    // Get enrolled courses
    const enrolledCourses = await Promise.all(
      enrolledIds.map(id => Course.findById(id))
    );

    res.json({
      enrolledCourses: enrolledCourses.filter(c => c !== null),
      allCourses: courses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- getMyCourses ---
export const getMyCourses = async (req, res) => {
  try {
    let courses = await Course.find({ professor: req.user.id });
    
    // Populate students for each course
    courses = await Promise.all(
      courses.map(async (course) => {
        return await Course.populate(course, ['students', 'professor']);
      })
    );
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- joinCourse ---
export const joinCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if already enrolled
    const enrolledIds = await User.getEnrolledCourses(req.user.id);
    if (enrolledIds.includes(course.id)) {
      return res.status(400).json({ message: "Already joined" });
    }

    // Enroll user in course
    await User.enrollCourse(req.user.id, course.id);
    await Course.addStudent(course.id, req.user.id);

    res.json({ message: "Course joined successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// --- getCourseById ---
export const getCourseById = async (req, res) => {
  try {
    let course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Populate professor and students
    course = await Course.populate(course, ['professor', 'students']);
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ============================================================================
// 2. GRADE CONTROLLER UPDATES
// ============================================================================

// File: src/controllers/gradeController.js

// --- getCourseGrades ---
export const getCourseGrades = async (req, res) => {
  const { courseId } = req.params;

  try {
    let course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Populate students
    course = await Course.populate(course, ['students']);

    // Fetch grades for enrolled students
    const grades = await Grade.find({ course: courseId });

    // Merge students with grades
    const studentGrades = course.students.map(student => {
      const g = grades.find(grade => grade.student.id == student.id);
      return {
        _id: student.id,
        name: student.name,
        marks: g ? g.marks : {
          midsem: 0, endsem: 0, quizzes: 0,
          quiz1: 0, quiz2: 0, quiz3: 0, quiz4: 0, quiz5: 0,
          quiz6: 0, quiz7: 0, quiz8: 0, quiz9: 0, quiz10: 0,
          assignment1: 0, assignment2: 0, assignment3: 0,
          assignment4: 0, assignment5: 0,
          project: 0, assignment: 0, attendance: 0, participation: 0
        }
      };
    });

    res.json({ course, studentGrades });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- getStudentGrades ---
export const getStudentGrades = async (req, res) => {
  const studentId = req.user.id; // Note: user.id not user._id
  const { courseId } = req.params;

  try {
    const grade = await Grade.findOne({ student: studentId, course: courseId });
    const course = await Course.findById(courseId);

    if (!course) return res.status(404).json({ message: "Course not found" });

    let letterGrade = null;
    if (course.letterGradesPublished && grade) {
      // Calculate letter grade (same logic as before)
      // ... calculation code ...
    }
    
    res.json({
      course: {
        name: course.name,
        code: course.code,
        policy: course.policy,
        quizCount: course.quizCount || 0,
        assignmentCount: course.assignmentCount || 0,
        maxMarks: course.maxMarks || {},
        letterGradesPublished: course.letterGradesPublished || false,
      },
      studentGrades: grade ? [{
        _id: grade.id,
        name: req.user.name,
        marks: grade.marks
      }] : [],
      marks: grade ? grade.marks : null,
      letterGrade: letterGrade,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- getCourseStatistics ---
// Update any references to _id to use id instead
// Change: grade.student._id to grade.student.id
// Change: course.professor.toString() to course.professor (already an integer)

// ============================================================================
// 3. CHALLENGE CONTROLLER UPDATES
// ============================================================================

// File: src/controllers/challengeController.js

// Add imports at top:
import Challenge from "../models/Challenge.js";

// --- createChallenge (check 5-challenge limit) ---
export const createChallenge = async (req, res) => {
  try {
    const { courseId, gradeId, description, attachmentUrl, attachmentName } = req.body;
    
    // Check challenge count (MAX 5 per course)
    const challengeCount = await Challenge.countDocuments({
      student: req.user.id,
      course: courseId
    });

    if (challengeCount >= 5) {
      return res.status(400).json({
        message: "Maximum 5 challenges allowed per course"
      });
    }

    const challenge = await Challenge.create({
      student: req.user.id,
      course: courseId,
      grade: gradeId,
      description,
      attachmentUrl,
      attachmentName
    });

    // Send email notification to professor
    // ... email code ...

    res.status(201).json(challenge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- getProfessorChallenges ---
export const getProfessorChallenges = async (req, res) => {
  try {
    // Use custom method to get challenges for all professor's courses
    const challenges = await Challenge.findForProfessor(req.user.id);
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- getStudentChallenges ---
export const getStudentChallenges = async (req, res) => {
  try {
    const challenges = await Challenge.find({ student: req.user.id });
    res.json(challenges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- getChallengeCount ---
export const getChallengeCount = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const count = await Challenge.countDocuments({
      student: req.user.id,
      course: courseId
    });

    res.json({ 
      count, 
      remaining: 5 - count,
      maxChallenges: 5 
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// --- respondToChallenge ---
export const respondToChallenge = async (req, res) => {
  try {
    const { id } = req.params;
    const { response, attachmentUrl, attachmentName } = req.body;

    const challenge = await Challenge.findByIdAndUpdate(
      id,
      {
        professorResponse: response,
        professorAttachmentUrl: attachmentUrl,
        professorAttachmentName: attachmentName,
        status: "reviewed",
        respondedAt: new Date()
      },
      { new: true }
    );

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Send email notification to student
    // ... email code ...

    res.json(challenge);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// ============================================================================
// 4. USER CONTROLLER UPDATES
// ============================================================================

// File: src/controllers/userController.js

// --- getUsersByRole ---
export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ["student", "professor"];

    if (!validRoles.includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const users = await User.find({ role });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// bulkRegisterUsers - no changes needed, already uses User.create()

// ============================================================================
// 5. AUTH MIDDLEWARE UPDATES
// ============================================================================

// File: src/middleware/authMiddleware.js

import jwt from "jsonwebtoken";
import User, { enhanceUser } from "../models/userModel.js";

export const verifyToken = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    
    if (!token) {
      return res.status(401).json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Fetch user from database
    const userRow = await User.findById(decoded.id);
    
    if (!userRow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Enhance user with methods and attach to request
    req.user = enhanceUser(userRow);
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ 
        message: `Role ${req.user.role} is not authorized to access this route` 
      });
    }
    next();
  };
};

// ============================================================================
// 6. COMMON PATTERNS SUMMARY
// ============================================================================

/*
MONGODB → POSTGRESQL CHEAT SHEET:

1. IDs:
   - user._id → user.id
   - course._id → course.id
   - Always use .id with SQL models

2. Populate:
   - MongoDB: .populate("field", "select fields")
   - SQL: Use Course.populate(course, ['field1', 'field2'])
   - Or already populated in find() queries

3. Array operations:
   - MongoDB: array.push(), array.includes()
   - SQL: Use helper methods (User.enrollCourse, Course.addStudent)
   - Or direct queries to junction tables

4. Upsert:
   - MongoDB: { upsert: true }
   - SQL: Already handled in Grade.findOneAndUpdate()

5. Counting:
   - MongoDB: Model.countDocuments(filter)
   - SQL: Challenge.countDocuments(filter) - same API!

6. toString() comparisons:
   - MongoDB: id.toString() === other.toString()
   - SQL: id == other (integers, no need for toString)

7. Timestamps:
   - MongoDB: { timestamps: true } auto-creates
   - SQL: Triggers auto-update updated_at

8. Methods on instances:
   - MongoDB: Defined in schema.methods
   - SQL: Added via enhanceUser() / enhanceCourse() helpers
*/
