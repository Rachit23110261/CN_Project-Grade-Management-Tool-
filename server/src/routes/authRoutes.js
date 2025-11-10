import express from "express";
import { registerUser, loginUser, forgotPassword, changePassword } from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";

const router = express.Router();

// Only Admin can register new users
router.post("/register", protect, adminOnly, registerUser);

// Anyone can login
router.post("/login", loginUser);

// Forgot password - public route
router.post("/forgot-password", forgotPassword);

// Change password - protected route (any authenticated user)
router.put("/change-password", protect, changePassword);

export default router;
