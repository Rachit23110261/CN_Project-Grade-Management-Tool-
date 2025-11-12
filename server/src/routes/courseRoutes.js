import express from "express";
import { verifyToken, isProfessor, isStudent } from "../middleware/authMiddleware.js";
import { createCourse, getAllCourses, joinCourse, getMyCourses, getCourseById, updateCourse, updateQuizCount, updateMaxMarks } from "../controllers/courseController.js";

const router = express.Router();

router.post("/create", verifyToken, isProfessor, createCourse);
router.get("/my-courses", verifyToken, isProfessor, getMyCourses);
router.get("/:courseId", verifyToken, getCourseById);
router.put("/:courseId", verifyToken, isProfessor, updateCourse);
router.put("/:courseId/quiz-count", verifyToken, isProfessor, updateQuizCount);
router.put("/:courseId/max-marks", verifyToken, isProfessor, updateMaxMarks);
router.get("/", verifyToken, getAllCourses);
router.post("/:id/join", verifyToken, isStudent, joinCourse);

export default router;
