import User from "../models/userModel.js";
import PendingRegistration from "../models/PendingRegistration.js";
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

    const users = await User.find({ role });
    
    // Remove password field from response
    const sanitizedUsers = users.map(user => {
      const { password, temp_password, ...rest } = user;
      return rest;
    });
    
    res.status(200).json(sanitizedUsers);
  } catch (err) {
    console.error("Error in getUsersByRole:", err);
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

        // Validate email format
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          results.failed.push({
            email,
            name,
            reason: "Invalid email format"
          });
          continue;
        }

        // Validate name
        if (name.length < 2 || name.length > 100) {
          results.failed.push({
            email,
            name,
            reason: "Name must be between 2 and 100 characters"
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
        const user = await User.create({ name: name.trim(), email: email.toLowerCase().trim(), password, role });

        // Send welcome email
        try {
          await sendWelcomeEmail(email, email, password, role); // Using email as username
        } catch (emailErr) {
          console.error(`Failed to send welcome email to ${email}:`, emailErr);
          // Continue even if email fails
        }

        results.success.push({
          id: user.id,
          name: user.name,
          email: user.email,
          role: user.role
        });

      } catch (error) {
        console.error(`Error processing user ${userData.email || 'unknown'}:`, error);
        results.failed.push({
          email: userData.email || "unknown",
          name: userData.name || "unknown",
          reason: error.message || "Database error"
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

// Delete a user account (Admin only)
export const deleteUser = async (req, res) => {
  try {
    const { userId } = req.params;
    
    // Prevent admin from deleting themselves
    if (parseInt(userId) === req.user.id) {
      return res.status(400).json({ message: "Cannot delete your own account" });
    }
    
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    
    // Prevent deleting other admins
    if (user.role === 'admin') {
      return res.status(403).json({ message: "Cannot delete admin accounts" });
    }
    
    console.log("🗑️ Deleting user:", { id: userId, email: user.email, role: user.role });
    
    // If professor, implement cascade delete with proper checks
    if (user.role === 'professor') {
      const Course = (await import('../models/Course.js')).default;
      const Grade = (await import('../models/Grade.js')).default;
      
      const courses = await Course.find({ professor: userId });
      
      // Check if any course has enrolled students
      let totalStudents = 0;
      const coursesWithStudents = [];
      
      for (const course of courses) {
        const students = await Course.getStudents(course.id);
        if (students && students.length > 0) {
          totalStudents += students.length;
          coursesWithStudents.push({
            name: course.name,
            studentCount: students.length
          });
        }
      }
      
      // If students are enrolled, don't allow deletion
      if (totalStudents > 0) {
        const courseList = coursesWithStudents
          .map(c => `"${c.name}" (${c.studentCount} students)`)
          .join(', ');
        
        return res.status(400).json({ 
          message: `Cannot delete professor with active students. Professor has ${totalStudents} students enrolled across ${coursesWithStudents.length} course(s): ${courseList}. Remove all students first.`,
          coursesWithStudents
        });
      }
      
      // CASCADE DELETE: Delete all courses and their associated grades
      // This is safe because we verified no students are enrolled
      for (const course of courses) {
        // Delete all grades for this course
        await Grade.deleteMany({ course: course.id });
        
        // Delete the course
        await Course.findByIdAndDelete(course.id);
      }
    }
    
    // If student, CASCADE DELETE: unenroll from all courses and delete grades
    if (user.role === 'student') {
      const Course = (await import('../models/Course.js')).default;
      const Grade = (await import('../models/Grade.js')).default;
      
      const enrolledCourses = await User.getEnrolledCourses(userId);
      
      for (const courseId of enrolledCourses) {
        // Remove student from course
        await Course.removeStudent(courseId, userId);
        
        // Delete all grades for this student in this course
        await Grade.deleteMany({ student: userId, course: courseId });
      }
    }
    
    // Clean up pending registration records for this email
    try {
      const pendingRegistration = await PendingRegistration.findOne({ email: user.email });
      if (pendingRegistration) {
        await PendingRegistration.deleteById(pendingRegistration.id);
        console.log("✅ Cleaned up pending registration for email:", user.email);
      }
    } catch (cleanupError) {
      console.error("⚠️ Failed to cleanup pending registration:", cleanupError.message);
      // Don't fail the deletion if this cleanup fails
    }
    
    // Delete the user
    await User.findByIdAndDelete(userId);
    
    console.log("✅ User deleted successfully");
    
    res.json({ 
      message: `${user.role === 'professor' ? 'Professor' : 'Student'} account and associated data deleted successfully`
    });
  } catch (error) {
    console.error("❌ Failed to delete user:", error);
    res.status(500).json({ message: "Failed to delete user" });
  }
};
