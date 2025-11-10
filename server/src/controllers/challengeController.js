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
    const grade = await Grade.findOne({ _id: gradeId, student: studentId });
    if (!grade) {
      return res.status(404).json({ message: "Grade not found or does not belong to you" });
    }

    // Check if challenge already exists for this grade
    const existingChallenge = await Challenge.findOne({
      grade: gradeId,
      student: studentId,
    });

    if (existingChallenge) {
      return res.status(400).json({ 
        message: "You have already submitted a challenge for this grade" 
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

    // Get course and professor info for email notification
    const course = await Course.findById(courseId).populate("professor", "email name");
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
      message: "Challenge submitted successfully",
      challenge,
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

    const challenges = await Challenge.find({ student: studentId }).sort({
      createdAt: -1,
    });

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

    // Find all courses taught by this professor
    const courses = await Course.find({ professor: professorId });
    const courseIds = courses.map((course) => course._id);

    // Find all challenges for these courses
    const challenges = await Challenge.find({
      course: { $in: courseIds },
    }).sort({ createdAt: -1 });

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
    const course = await Course.findOne({ _id: courseId, professor: professorId });
    if (!course) {
      return res.status(403).json({ message: "Not authorized to view these challenges" });
    }

    const challenges = await Challenge.find({ course: courseId }).sort({
      createdAt: -1,
    });

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
    const { response } = req.body;
    const professorId = req.user.id;

    // Find the challenge
    const challenge = await Challenge.findById(id).populate("course");

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Verify professor owns the course
    if (challenge.course.professor.toString() !== professorId) {
      return res.status(403).json({ message: "Not authorized to respond to this challenge" });
    }

    // Update challenge with response
    challenge.professorResponse = response;
    challenge.status = "reviewed";
    challenge.respondedAt = new Date();
    await challenge.save();

    // Send notification to student
    const student = await User.findById(challenge.student);
    if (student?.email) {
      await sendChallengeResponseNotification(student.email, challenge.course.name);
    }

    res.json({
      message: "Response submitted successfully",
      challenge,
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

    const challenge = await Challenge.findById(id);

    if (!challenge) {
      return res.status(404).json({ message: "Challenge not found" });
    }

    // Check authorization
    if (userRole === "student" && challenge.student._id.toString() !== userId) {
      return res.status(403).json({ message: "Not authorized to view this challenge" });
    }

    if (userRole === "professor") {
      const course = await Course.findOne({
        _id: challenge.course._id,
        professor: userId,
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
