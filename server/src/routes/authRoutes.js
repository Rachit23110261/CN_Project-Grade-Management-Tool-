import express from "express";
import { registerUser, loginUser } from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only Admin can register new users
router.post("/register", protect, adminOnly, registerUser);

// Anyone can login
router.post("/login", loginUser);

export default router;
