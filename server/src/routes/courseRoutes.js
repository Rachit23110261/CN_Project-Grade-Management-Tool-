import express from "express";
import { verifyToken, isProfessor, isStudent } from "../middleware/authMiddleware.js";
import { createCourse, getAllCourses, joinCourse , getMyCourses} from "../controllers/courseController.js";

const router = express.Router();

router.post("/create", verifyToken, isProfessor, createCourse);
router.get("/my-courses", verifyToken, isProfessor, getMyCourses);
router.get("/", verifyToken, getAllCourses);
router.post("/:id/join", verifyToken, isStudent, joinCourse);

export default router;
