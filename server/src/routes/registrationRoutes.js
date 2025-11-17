import express from "express";
import {
  submitRegistrationRequest,
  getPendingRegistrations,
  getRegistrationStats,
  approveRegistration,
  rejectRegistration,
  deleteRegistration
} from "../controllers/registrationController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Public route - submit registration request
router.post("/request", submitRegistrationRequest);

// Admin routes - require authentication and admin role
router.get("/pending", protect, adminOnly, getPendingRegistrations);
router.get("/stats", protect, adminOnly, getRegistrationStats);
router.put("/approve/:id", protect, adminOnly, approveRegistration);
router.put("/reject/:id", protect, adminOnly, rejectRegistration);
router.delete("/:id", protect, adminOnly, deleteRegistration);

export default router;
