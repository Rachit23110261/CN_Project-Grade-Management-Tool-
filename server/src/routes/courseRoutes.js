import express from "express";
import { verifyToken, isProfessor, isStudent } from "../middleware/authMiddleware.js";
import { createCourse, getAllCourses, joinCourse, getMyCourses, getCourseById, updateCourse } from "../controllers/courseController.js";

const router = express.Router();

router.post("/create", verifyToken, isProfessor, createCourse);
router.get("/my-courses", verifyToken, isProfessor, getMyCourses);
router.get("/:courseId", verifyToken, getCourseById);
router.put("/:courseId", verifyToken, isProfessor, updateCourse);
router.get("/", verifyToken, getAllCourses);
router.post("/:id/join", verifyToken, isStudent, joinCourse);

export default router;
