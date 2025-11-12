import jwt from "jsonwebtoken";
import User from "../models/userModel.js";
import { sendPasswordResetEmail, sendWelcomeEmail } from "../services/emailService.js";
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
    
    // Send welcome email with credentials
    try {
      await sendWelcomeEmail(email, email, password, role);
      console.log(`Welcome email sent to ${email}`);
    } catch (emailError) {
      console.error("Failed to send welcome email:", emailError);
      // Don't fail registration if email fails
    }
    
    res.status(201).json({
      message: "User registered successfully and welcome email sent",
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
    
    let isMatch = false;
    let usedTempPassword = false;
    
    // First, try to match with main password
    isMatch = await user.matchPassword(password);
    
    // If main password doesn't match, try temporary password
    if (!isMatch) {
      isMatch = await user.matchTempPassword(password);
      if (isMatch) {
        usedTempPassword = true;
        
        // Don't clear temp password yet - keep it for 1 hour so user can use it in change password
        // It will expire automatically based on tempPasswordExpires
        console.log(`✅ User ${user.email} logged in with temporary password (still valid until expiry)`);
      }
    }
    
    if (!isMatch) return res.status(401).json({ message: "Invalid credentials" });

    const token = generateToken(user);
    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role },
      usedTempPassword, // Flag to notify frontend
      message: usedTempPassword ? "Logged in with temporary password. Please change your password immediately." : undefined
    });
  } catch (err) {
    next(err);
  }
};

// @desc Forgot password - send temporary password via email
export const forgotPassword = async (req, res, next) => {
  try {
    const { email } = req.body;

    // Find user by email (case-insensitive)
    const user = await User.findOne({ email: { $regex: new RegExp(`^${email}$`, 'i') } });
    if (!user) {
      return res.status(404).json({ message: "No account found with this email address" });
    }

    // Generate temporary password
    const tempPassword = generateRandomPassword();

    // Set temporary password (expires in 1 hour) - does NOT override main password
    user.tempPassword = tempPassword; // Will be hashed by pre-save hook
    user.tempPasswordExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now
    await user.save();

    // Development mode: Log password to console
    if (process.env.NODE_ENV === "development") {
      console.log("\n========================================");
      console.log("🔐 TEMPORARY PASSWORD GENERATED");
      console.log("========================================");
      console.log(`Email: ${user.email}`);
      console.log(`Temporary Password: ${tempPassword}`);
      console.log(`Expires: ${user.tempPasswordExpires}`);
      console.log("========================================\n");
    }

    // Try to send email, but don't fail if email service is not configured
    try {
      await sendPasswordResetEmail(user.email, tempPassword);
      res.json({
        message: "A temporary password has been sent to your email address. It will expire in 1 hour.",
      });
    } catch (emailError) {
      console.error("Email sending failed:", emailError.message);
      // In development, still succeed even if email fails (password is already saved)
      if (process.env.NODE_ENV === "development") {
        res.json({
          message: "Temporary password generated (valid for 1 hour). Check server console for the password.",
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

    // Verify current password - check both main password and temp password
    let isMatch = await user.matchPassword(currentPassword);
    let usedTempPassword = false;
    
    // If main password doesn't match, try temporary password (if valid)
    if (!isMatch) {
      isMatch = await user.matchTempPassword(currentPassword);
      if (isMatch) {
        usedTempPassword = true;
        console.log(`✅ User ${user.email} changing password using temporary password`);
      }
    }
    
    if (!isMatch) {
      return res.status(401).json({ message: "Current password is incorrect" });
    }

    // Update password and clear temporary password
    user.password = newPassword; // Will be hashed by pre-save hook
    user.tempPassword = null; // Clear temp password after successful password change
    user.tempPasswordExpires = null;
    await user.save();

    res.json({
      message: "Password changed successfully",
      usedTempPassword, // Let frontend know if temp password was used
    });
  } catch (err) {
    console.error("Change password error:", err);
    next(err);
  }
};
