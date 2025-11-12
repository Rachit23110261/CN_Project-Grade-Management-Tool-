import Course from "../models/Course.js";
import User from "../models/userModel.js";

export const createCourse = async (req, res) => {
  try {
    console.log(req.body)
    const course = await Course.create({
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      professor: req.user.id,
    });
    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("professor", "name email");
    const user = await User.findById(req.user.id);

    // Return both all courses and enrolledCourses
    res.json({
      enrolledCourses: await Course.find({ _id: { $in: user.enrolledCourses } }).populate("professor", "name email"),
      allCourses: courses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all courses created by this professor
export const getMyCourses = async (req, res) => {
  try {
    const courses = await Course.find({ professor: req.user.id })
      .populate("students", "name email")
      .populate("professor", "name email"); // optional
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const joinCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    const user = await User.findById(req.user.id);

    if (!course) return res.status(404).json({ message: "Course not found" });
    if (user.enrolledCourses.includes(course._id))
      return res.status(400).json({ message: "Already joined" });

    user.enrolledCourses.push(course._id);
    course.students.push(user._id);
    await user.save();
    await course.save();

    res.json({ message: "Course joined successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single course by ID
export const getCourseById = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId)
      .populate("professor", "name email")
      .populate("students", "name email");
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update a course (professor only)
export const updateCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to edit this course" });
    }
    
    // Validate policy if provided
    if (req.body.policy) {
      const total = Object.values(req.body.policy).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        return res.status(400).json({ message: "Policy percentages must total 100%" });
      }
    }
    
    // Update course fields
    if (req.body.name) course.name = req.body.name;
    if (req.body.code) course.code = req.body.code;
    if (req.body.description) course.description = req.body.description;
    if (req.body.policy) course.policy = req.body.policy;
    
    await course.save();
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update quiz count for a course (professor only)
export const updateQuizCount = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this course" });
    }
    
    const { quizCount } = req.body;
    
    if (quizCount < 0 || quizCount > 10) {
      return res.status(400).json({ message: "Quiz count must be between 0 and 10" });
    }
    
    course.quizCount = quizCount;
    await course.save();
    
    res.json({ message: "Quiz count updated successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update assignment count for a course (professor only)
export const updateAssignmentCount = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this course" });
    }
    
    const { assignmentCount } = req.body;
    
    if (assignmentCount < 0 || assignmentCount > 5) {
      return res.status(400).json({ message: "Assignment count must be between 0 and 5" });
    }
    
    course.assignmentCount = assignmentCount;
    await course.save();
    
    res.json({ message: "Assignment count updated successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update max marks for assessments (professor only)
export const updateMaxMarks = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to modify this course" });
    }
    
    const { maxMarks } = req.body;
    
    // Validate that max marks are positive numbers
    for (const [key, value] of Object.entries(maxMarks)) {
      if (value < 0) {
        return res.status(400).json({ message: `Max marks for ${key} must be positive` });
      }
    }
    
    // Initialize maxMarks if it doesn't exist
    if (!course.maxMarks) {
      course.maxMarks = {};
    }
    
    // Update max marks - spread existing and new values
    course.maxMarks = { 
      ...course.maxMarks.toObject ? course.maxMarks.toObject() : course.maxMarks,
      ...maxMarks 
    };
    
    // Mark the field as modified for Mongoose
    course.markModified('maxMarks');
    
    await course.save();
    
    res.json({ message: "Max marks updated successfully", course });
  } catch (error) {
    console.error("Error updating max marks:", error);
    res.status(500).json({ message: error.message });
  }
};
  