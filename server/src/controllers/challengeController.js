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

    // Verify the grade exists and belongs to this student
    const grade = await Grade.findOne({ id: gradeId, studentId: studentId });
    if (!grade) {
      return res.status(404).json({ message: "Grade not found or does not belong to you" });
    }

    // Check how many challenges already exist for this course by this student
    const challengeCount = await Challenge.countDocuments({
      courseId: courseId,
      studentId: studentId,
    });

    // Limit to 5 challenges per course
    if (challengeCount >= 5) {
      return res.status(400).json({ 
        message: "You have reached the maximum limit of 5 challenges for this course" 
      });
    }

    // Create challenge
    const challenge = await Challenge.create({
      studentId: studentId,
      courseId: courseId,
      gradeId: gradeId,
      description,
      attachmentUrl: attachmentUrl || null,
      attachmentName: attachmentName || null,
    });

    // Get course and professor info for email notification
    let course = await Course.findById(courseId);
    course = await Course.populate(course, ['professor']);
    const student = await User.findById(studentId);

    // Send notification to professor
    if (course?.professor?.email) {
      await sendChallengeNotification(
        course.professor.email,
        student.name,
        course.name
      );
    }

    res.status(201).json({
      message: `Challenge submitted successfully (${challengeCount + 1}/5 challenges used)`,
      challenge,
      challengeCount: challengeCount + 1,
      maxChallenges: 5,
    });
  } catch (err) {
    next(err);
  }
};

// @desc Get all challenges for a student
// @route GET /api/challenges/student
// @access Private (Student only)
export const getStudentChallenges = async (req, res, next) => {
  try {
    const studentId = req.user.id;

    const challenges = await Challenge.find({ studentId: studentId });

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
    const course = await Course.findOne({ id: courseId, professorId: professorId });
    if (!course) {
      return res.status(403).json({ message: "Not authorized to view these challenges" });
    }

    const challenges = await Challenge.find({ courseId: courseId });

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

    // Find the challenge
    let challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Populate course to verify ownership
    challenge = await Challenge.populate(challenge, ['course']);

    // Verify professor owns the course
    if (challenge.course.professorId !== professorId) {
      return res.status(403).json({ message: "Not authorized to respond to this challenge" });
    }

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

    // Send notification to student
    const student = await User.findById(challenge.studentId);
    if (student?.email) {
      await sendChallengeResponseNotification(student.email, challenge.course.name);
    }

    res.json({
      message: "Response submitted successfully",
      challenge: updatedChallenge,
    });
  } catch (err) {
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

    let challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Populate related data
    challenge = await Challenge.populate(challenge, ['student', 'course', 'grade']);

    // Check authorization
    if (userRole === "student" && challenge.studentId !== userId) {
      return res.status(403).json({ message: "Not authorized to view this challenge" });
    }

    if (userRole === "professor") {
      const course = await Course.findOne({
        id: challenge.courseId,
        professorId: userId,
      });
      if (!course) {
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
      courseId: courseId,
      studentId: studentId,
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
