import express from "express";
import { verifyToken, isProfessor, isStudent } from "../middleware/authMiddleware.js";
import { createCourse, getAllCourses, joinCourse, getMyCourses, getCourseById, updateCourse, updateQuizCount, updateAssignmentCount, updateMaxMarks, toggleLetterGradePublishing, removeStudentFromCourse, leaveCourse, updateGradingScale } from "../controllers/courseController.js";
import { 
  validateCourse, 
  validateCourseId, 
  validateStudentId, 
  validateQuizCount, 
  validateAssignmentCount, 
  validateMaxMarks,
  validateGradingScale 
} from "../middleware/validationMiddleware.js";

const router = express.Router();

router.post("/create", verifyToken, isProfessor, validateCourse, createCourse);
router.get("/my-courses", verifyToken, isProfessor, getMyCourses);
router.get("/:courseId", verifyToken, validateCourseId, getCourseById);
router.put("/:courseId", verifyToken, isProfessor, validateCourseId, validateCourse, updateCourse);
router.put("/:courseId/quiz-count", verifyToken, isProfessor, validateCourseId, validateQuizCount, updateQuizCount);
router.put("/:courseId/assignment-count", verifyToken, isProfessor, validateCourseId, validateAssignmentCount, updateAssignmentCount);
router.put("/:courseId/max-marks", verifyToken, isProfessor, validateCourseId, validateMaxMarks, updateMaxMarks);
router.put("/:courseId/grading-scale", verifyToken, isProfessor, validateCourseId, validateGradingScale, updateGradingScale);
router.put("/:courseId/toggle-letter-grades", verifyToken, isProfessor, validateCourseId, toggleLetterGradePublishing);
router.delete("/:courseId/students/:studentId", verifyToken, isProfessor, validateCourseId, validateStudentId, removeStudentFromCourse);
router.delete("/:courseId/leave", verifyToken, validateCourseId, leaveCourse);
router.get("/", verifyToken, getAllCourses);
router.post("/:id/join", verifyToken, isStudent, joinCourse);

export default router;
