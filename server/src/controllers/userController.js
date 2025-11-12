import User from "../models/userModel.js";
import { sendWelcomeEmail } from "../services/emailService.js";
import crypto from "crypto";

// Generate random password
const generateRandomPassword = () => {
  return crypto.randomBytes(8).toString("hex"); // 16 character password
};

export const getUsersByRole = async (req, res) => {
  try {
    const { role } = req.params;
    const validRoles = ["student", "professor"];

    if (!validRoles.includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const users = await User.find({ role }).select("-password");
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// @desc Bulk register users from CSV (Admin only)
export const bulkRegisterUsers = async (req, res) => {
  try {
    const { users, role } = req.body;
    
    if (!users || !Array.isArray(users) || users.length === 0) {
      return res.status(400).json({ message: "No users data provided" });
    }

    if (!role || !["student", "professor"].includes(role)) {
      return res.status(400).json({ message: "Invalid or missing role" });
    }

    const results = {
      success: [],
      failed: [],
      total: users.length
    };

    for (const userData of users) {
      try {
        const { name, email } = userData;

        if (!name || !email) {
          results.failed.push({
            email: email || "unknown",
            name: name || "unknown",
            reason: "Missing name or email"
          });
          continue;
        }

        // Check if user already exists
        const userExists = await User.findOne({ email });
        if (userExists) {
          results.failed.push({
            email,
            name,
            reason: "User already exists"
          });
          continue;
        }

        // Generate random password
        const password = generateRandomPassword();

        // Create user
        const user = await User.create({ name, email, password, role });

        // Send welcome email
        try {
          await sendWelcomeEmail(email, email, password, role);
          console.log(`Welcome email sent to ${email}`);
        } catch (emailError) {
          console.error(`Failed to send welcome email to ${email}:`, emailError);
          // Continue even if email fails
        }

        results.success.push({
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role
        });

      } catch (error) {
        results.failed.push({
          email: userData.email || "unknown",
          name: userData.name || "unknown",
          reason: error.message
        });
      }
    }

    res.status(201).json({
      message: `Bulk registration completed. ${results.success.length} users created, ${results.failed.length} failed.`,
      results
    });

  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
