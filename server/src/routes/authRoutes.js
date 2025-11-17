import express from "express";
import { registerUser, loginUser, forgotPassword, changePassword } from "../controllers/authController.js";
import { protect, adminOnly } from "../middleware/authMiddleware.js";
import { 
  validateUserRegistration, 
  validateLogin, 
  validateEmail, 
  validatePasswordChange 
} from "../middleware/validationMiddleware.js";
import { 
  authLimiter, 
  passwordResetLimiter, 
  registrationLimiter 
} from "../middleware/rateLimiter.js";

const router = express.Router();

// Only Admin can register new users
router.post("/register", protect, adminOnly, registrationLimiter, validateUserRegistration, registerUser);

// Anyone can login - with rate limiting
router.post("/login", authLimiter, validateLogin, loginUser);

// Forgot password - public route with rate limiting
router.post("/forgot-password", passwordResetLimiter, validateEmail, forgotPassword);

// Change password - protected route (any authenticated user)
router.put("/change-password", protect, validatePasswordChange, changePassword);

export default router;
