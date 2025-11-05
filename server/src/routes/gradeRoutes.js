import express from "express";
import { getCourseGrades, updateCourseGrades } from "../controllers/gradeController.js";
import { verifyToken, isProfessor } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/:courseId", verifyToken,  getCourseGrades);
router.post("/:courseId", verifyToken, isProfessor, updateCourseGrades);

export default router;
