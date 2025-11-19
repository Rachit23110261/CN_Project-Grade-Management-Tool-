import express from "express";
import { getCourseGrades, updateCourseGrades, getStudentGrades, uploadGradesFromCSV, getGradeById, getCourseStatistics, getGradeDistribution } from "../controllers/gradeController.js";
import { verifyToken, isProfessor, isStudent } from "../middleware/authMiddleware.js";
import { validateGrades, validateCourseId } from "../middleware/validationMiddleware.js";
import { gradeUpdateLimiter } from "../middleware/rateLimiter.js";

const router = express.Router();

// Get a single grade by ID (for challenge page) - must come before /:courseId
router.get("/grade/:gradeId", verifyToken, getGradeById);

// Get statistics for a course - must come before generic /:courseId
router.get("/:courseId/statistics", verifyToken, isProfessor, validateCourseId, getCourseStatistics);

// Get grade distribution for histogram display - must come before generic /:courseId
router.get("/:courseId/distribution", verifyToken, isProfessor, validateCourseId, getGradeDistribution);

// Student route - get their own grades for a course
router.get("/student/:courseId", verifyToken, isStudent, validateCourseId, getStudentGrades);

// Professor routes - get all students' grades and update them
router.get("/:courseId", verifyToken, isProfessor, validateCourseId, getCourseGrades);
router.post("/:courseId", verifyToken, isProfessor, gradeUpdateLimiter, validateCourseId, validateGrades, updateCourseGrades);
router.post("/:courseId/upload-csv", verifyToken, isProfessor, gradeUpdateLimiter, validateCourseId, uploadGradesFromCSV);

export default router;
