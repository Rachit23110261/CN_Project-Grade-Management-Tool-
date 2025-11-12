import express from "express";
import { getCourseGrades, updateCourseGrades, getStudentGrades, uploadGradesFromCSV, getGradeById } from "../controllers/gradeController.js";
import { verifyToken, isProfessor, isStudent } from "../middleware/authMiddleware.js";

const router = express.Router();

// Get a single grade by ID (for challenge page) - must come before /:courseId
router.get("/grade/:gradeId", verifyToken, getGradeById);

// Student route - get their own grades for a course
router.get("/student/:courseId", verifyToken, isStudent, getStudentGrades);

// Professor routes - get all students' grades and update them
router.get("/:courseId", verifyToken, isProfessor, getCourseGrades);
router.post("/:courseId", verifyToken, isProfessor, updateCourseGrades);
router.post("/:courseId/upload-csv", verifyToken, isProfessor, uploadGradesFromCSV);

export default router;
