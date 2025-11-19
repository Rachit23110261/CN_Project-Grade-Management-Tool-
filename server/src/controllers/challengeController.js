import Challenge from "../models/Challenge.js";
import Grade from "../models/Grade.js";
import Course from "../models/Course.js";
import User from "../models/userModel.js";
import { sendChallengeNotification, sendChallengeResponseNotification } from "../services/emailService.js";

// @desc Create a new grade challenge
// @route POST /api/challenges
// @access Private (Student only)
export const createChallenge = async (req, res, next) => {
  try {
    const { courseId, gradeId, description, attachmentUrl, attachmentName } = req.body;
    const studentId = req.user.id;

    console.log("🔍 Creating challenge with data:", {
      courseId, gradeId, description, studentId,
      hasAttachment: !!attachmentUrl
    });

    // Verify the grade exists and belongs to this student
    const grade = await Grade.findOne({ id: gradeId, student: studentId });
    if (!grade) {
      console.log("❌ Grade not found for student:", studentId, "grade:", gradeId);
      return res.status(404).json({ message: "Grade not found or does not belong to you" });
    }

    console.log("✅ Grade found:", grade.id);

    // Check how many challenges already exist for this course by this student
    const challengeCount = await Challenge.countDocuments({
      course: courseId,
      student: studentId,
    });

    console.log("📊 Current challenge count:", challengeCount);

    // Limit to 5 challenges per course
    if (challengeCount >= 5) {
      return res.status(400).json({ 
        message: "You have reached the maximum limit of 5 challenges for this course" 
      });
    }

    // Create challenge
    const challenge = await Challenge.create({
      student: studentId,
      course: courseId,
      grade: gradeId,
      description,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
    });

    console.log("✅ Challenge created:", challenge.id);

    // Get course and professor info for email notification
    const course = await Course.findById(courseId);
    const student = await User.findById(studentId);

    console.log("📧 Sending notification:", {
      professorEmail: course?.professor?.email,
      studentName: student?.name,
      courseName: course?.name
    });

    // Send notification to professor
    if (course?.professor?.email) {
      try {
        await sendChallengeNotification(
          course.professor.email,
          student.name,
          course.name
        );
        console.log("✅ Email notification sent to professor");
      } catch (emailError) {
        console.log("⚠️ Email notification failed:", emailError.message);
        // Don't fail the challenge creation if email fails
      }
    } else {
      console.log("⚠️ No professor email found for notification");
    }

    res.status(201).json({
      message: `Challenge submitted successfully (${challengeCount + 1}/5 challenges used)`,
      challenge,
      challengeCount: challengeCount + 1,
      maxChallenges: 5,
    });
  } catch (err) {
    console.error("❌ Challenge creation failed:", err);
    next(err);
  }
};

// @desc Get all challenges for a student
// @route GET /api/challenges/student
// @access Private (Student only)
export const getStudentChallenges = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const challenges = await Challenge.find({ student: studentId });

    res.json(challenges);
  } catch (err) {
    next(err);
  }
};

// @desc Get all challenges for a professor's courses
// @route GET /api/challenges/professor
// @access Private (Professor only)
export const getProfessorChallenges = async (req, res, next) => {
  try {
    const professorId = req.user.id;

    // Use custom method to get challenges for all professor's courses
    const challenges = await Challenge.findForProfessor(professorId);

    res.json(challenges);
  } catch (err) {
    next(err);
  }
};

// @desc Get challenges for a specific course (professor view)
// @route GET /api/challenges/course/:courseId
// @access Private (Professor only)
export const getCourseChallenges = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const professorId = req.user.id;

    // Verify professor owns this course
    const course = await Course.findOne({ id: courseId, professor: professorId });
    if (!course) {
      return res.status(403).json({ message: "Not authorized to view these challenges" });
    }

    const challenges = await Challenge.find({ course: courseId });

    res.json(challenges);
  } catch (err) {
    next(err);
  }
};

// @desc Respond to a challenge
// @route PUT /api/challenges/:id/respond
// @access Private (Professor only)
export const respondToChallenge = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { response, attachmentUrl, attachmentName } = req.body;
    const professorId = req.user.id;

    console.log("🔍 Professor responding to challenge:", {
      challengeId: id,
      professorId,
      hasResponse: !!response,
      hasAttachment: !!attachmentUrl
    });

    // Find the challenge (it already comes populated from the model)
    const challenge = await Challenge.findById(id);

    if (!challenge) {
      console.log("❌ Challenge not found:", id);
      return res.status(404).json({ message: "Challenge not found" });
    }

    console.log("✅ Challenge found:", {
      id: challenge.id,
      courseId: challenge.course?.id || challenge.course,
      courseProfessor: challenge.course?.professor_id || challenge.course?.professor,
      student: challenge.student?.name || challenge.student
    });

    // Verify professor owns the course
    // The challenge already has course data populated from the model
    const courseProfessorId = challenge.course?.professor_id || challenge.course?.professor;
    if (courseProfessorId !== professorId) {
      console.log("❌ Unauthorized access:", {
        courseProfessor: courseProfessorId,
        requestingProfessor: professorId
      });
      return res.status(403).json({ message: "Not authorized to respond to this challenge" });
    }

    console.log("✅ Authorization verified, updating challenge...");

    // Update challenge with response
    const updatedChallenge = await Challenge.findByIdAndUpdate(
      id,
      {
        professorResponse: response,
        professorAttachmentUrl: attachmentUrl || null,
        professorAttachmentName: attachmentName || null,
        status: "reviewed",
        respondedAt: new Date()
      },
      { new: true }
    );

    console.log("✅ Challenge updated successfully");

    // Send notification to student
    const studentId = challenge.student?.id || challenge.student;
    if (studentId) {
      try {
        const student = await User.findById(studentId);
        if (student?.email) {
          await sendChallengeResponseNotification(
            student.email, 
            challenge.course?.name || 'Unknown Course'
          );
          console.log("✅ Email notification sent to student");
        }
      } catch (emailError) {
        console.log("⚠️ Email notification failed:", emailError.message);
        // Don't fail the response if email fails
      }
    }

    res.json({
      message: "Response submitted successfully",
      challenge: updatedChallenge,
    });
  } catch (err) {
    console.error("❌ Error in respondToChallenge:", err);
    next(err);
  }
};

// @desc Get a single challenge by ID
// @route GET /api/challenges/:id
// @access Private
export const getChallengeById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;
    const userRole = req.user.role;

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Challenge already comes with populated data from the model

    // Check authorization
    const studentId = challenge.student?.id || challenge.student;
    if (userRole === "student" && studentId !== userId) {
      return res.status(403).json({ message: "Not authorized to view this challenge" });
    }

    if (userRole === "professor") {
      const courseId = challenge.course?.id || challenge.course;
      const courseProfessorId = challenge.course?.professor_id || challenge.course?.professor;
      
      if (courseProfessorId !== userId) {
        return res.status(403).json({ message: "Not authorized to view this challenge" });
      }
    }

    res.json(challenge);
  } catch (err) {
    next(err);
  }
};

// @desc Get challenge count for a student in a course
// @route GET /api/challenges/count/:courseId
// @access Private (Student only)
export const getChallengeCount = async (req, res, next) => {
  try {
    const { courseId } = req.params;
    const studentId = req.user.id;

    const count = await Challenge.countDocuments({
      course: courseId,
      student: studentId,
    });

    res.json({
      count,
      maxChallenges: 5,
      remaining: 5 - count,
      canSubmit: count < 5,
    });
  } catch (err) {
    next(err);
  }
};
