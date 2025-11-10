import express from "express";
import {
  createChallenge,
  getStudentChallenges,
  getProfessorChallenges,
  getCourseChallenges,
  respondToChallenge,
  getChallengeById,
} from "../controllers/challengeController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Student routes
router.post("/", protect, createChallenge);
router.get("/student", protect, getStudentChallenges);

// Professor routes
router.get("/professor", protect, getProfessorChallenges);
router.get("/course/:courseId", protect, getCourseChallenges);
router.put("/:id/respond", protect, respondToChallenge);

// Common routes
router.get("/:id", protect, getChallengeById);

export default router;
