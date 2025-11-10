import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { sendPasswordResetEmail } from "../services/emailService.js";
import crypto from "crypto";

// Generate JWT Token
const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
};

// Generate random password
const generateRandomPassword = () => {
  return crypto.randomBytes(8).toString("hex"); // 16 character password
};

// @desc Register user (Admin can create any role)
export const registerUser = async (req, res, next) => {
  try {
    const { name, email, password, role } = req.body;

    const userExists = await User.findOne({ email });
    if (userExists) return res.status(400).json({ message: "User already exists" });

    const user = await User.create({ name, email, password, role });
    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Login user
export const loginUser = async (req, res, next) => {
  try {
    const { email, password } = req.body;
    console.log(req.body)
    const user = await User.findOne({ email });
    console.log(user)
    if (!user) return res.status(401).json({ message: "Invalid credentials" });
    console.log()
    const isMatch = await user.matchPassword(password);
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
    });
  } catch (err) {
    next(err);
  }
};

// @desc Forgot password - send temporary password via email
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    // Generate temporary password
    const tempPassword = generateRandomPassword();

    // Update user's password
    user.password = tempPassword; // Will be hashed by pre-save hook
    await user.save();

    // Development mode: Log password to console
    if (process.env.NODE_ENV === "development") {
      console.log("\n========================================");
      console.log("🔐 TEMPORARY PASSWORD GENERATED");
      console.log("========================================");
      console.log(`Email: ${user.email}`);
      console.log(`Temporary Password: ${tempPassword}`);
      console.log("========================================\n");
    }

    // Try to send email, but don't fail if email service is not configured
    try {
      await sendPasswordResetEmail(user.email, tempPassword);
      res.json({
        message: "A temporary password has been sent to your email address",
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      // In development, still succeed even if email fails (password is already saved)
      if (process.env.NODE_ENV === "development") {
        res.json({
          message: "Temporary password generated. Check server console for the password.",
        });
      } else {
        throw new Error("Failed to send email");
      }
    }
  } catch (err) {
    console.error("Forgot password error:", err);
    if (err.message === "Failed to send email") {
      return res.status(500).json({ 
        message: "Failed to send email. Please contact administrator." 
      });
    }
    next(err);
  }
};

// @desc Change password (for logged-in users)
// @route PUT /api/auth/change-password
// @access Private
export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ 
        message: "Please provide both current and new password" 
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ 
        message: "New password must be at least 6 characters long" 
      });
    }

    // Find user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Verify current password
    const isMatch = await user.matchPassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password
    user.password = newPassword; // Will be hashed by pre-save hook
    await user.save();

    res.json({
      message: "Password changed successfully",
    });
  } catch (err) {
    console.error("Change password error:", err);
    next(err);
  }
};
