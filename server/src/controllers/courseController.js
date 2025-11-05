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
  