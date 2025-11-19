import Course from "../models/Course.js";
import User from "../models/userModel.js";
import Grade from "../models/Grade.js";
import Challenge from "../models/Challenge.js";

export const createCourse = async (req, res) => {
  try {
    // Validate policy if provided
    if (req.body.policy) {
      const policyValues = Object.values(req.body.policy);
      
      // Check all values are between 0 and 100
      if (!policyValues.every(v => typeof v === 'number' && v >= 0 && v <= 100)) {
        return res.status(400).json({ message: "All policy percentages must be between 0 and 100" });
      }
      
      // Check that percentages sum to 100
      const total = policyValues.reduce((a, b) => a + b, 0);
      if (Math.abs(total - 100) > 0.01) {
        return res.status(400).json({ message: "Policy percentages must total 100%" });
      }

      // Validate quiz count if quizzes have non-zero percentage
      const quizPercentage = req.body.policy.quizzes || 0;
      const quizCount = req.body.quizCount || 0;
      if (quizPercentage > 0 && quizCount === 0) {
        return res.status(400).json({ 
          message: "Quiz count must be greater than 0 when quizzes have a non-zero percentage" 
        });
      }

      // Validate assignment count if assignments have non-zero percentage
      const assignmentPercentage = req.body.policy.assignment || 0;
      const assignmentCount = req.body.assignmentCount || 0;
      if (assignmentPercentage > 0 && assignmentCount === 0) {
        return res.status(400).json({ 
          message: "Assignment count must be greater than 0 when assignments have a non-zero percentage" 
        });
      }

      // Validate quiz count is within reasonable limits
      if (quizCount > 10) {
        return res.status(400).json({ 
          message: "Quiz count cannot exceed 10" 
        });
      }

      // Validate assignment count is within reasonable limits
      if (assignmentCount > 5) {
        return res.status(400).json({ 
          message: "Assignment count cannot exceed 5" 
        });
      }
    }
    
    const course = await Course.create({
      name: req.body.name,
      code: req.body.code,
      description: req.body.description,
      professor: req.user.id, // Changed from professorId to professor
      policy: req.body.policy || {},
      maxMarks: req.body.maxMarks || {},
      quizCount: req.body.quizCount || 0,
      assignmentCount: req.body.assignmentCount || 0
    });
    res.status(201).json(course);
  } catch (error) {
    console.error("Error creating course:", error);
    res.status(500).json({ message: "Failed to create course" });
  }
};

export const getAllCourses = async (req, res) => {
  try {
    // Get all courses (already populated with professor)
    const courses = await Course.find();
    
    // Get enrolled course IDs for this student
    const enrolledIds = await User.getEnrolledCourses(req.user.id);
    
    // Get enrolled courses with professor info
    const enrolledCourses = await Promise.all(
      enrolledIds.map(id => Course.findById(id))
    );

    res.json({
      enrolledCourses: enrolledCourses.filter(c => c !== null),
      allCourses: courses
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all courses created by this professor
export const getMyCourses = async (req, res) => {
  try {
    let courses = await Course.find({ professor: req.user.id });
    
    // Populate students and professor for each course
    courses = await Promise.all(
      courses.map(async (course) => {
        return await Course.populate(course, ['students', 'professor']);
      })
    );
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};




export const joinCourse = async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);

    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if already enrolled
    const enrolledIds = await User.getEnrolledCourses(req.user.id);
    if (enrolledIds.includes(course.id)) {
      return res.status(400).json({ message: "Already joined" });
    }

    // Enroll user in course
    await User.enrollCourse(req.user.id, course.id);
    await Course.addStudent(course.id, req.user.id);

    res.json({ message: "Course joined successfully", course });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get a single course by ID
export const getCourseById = async (req, res) => {
  try {
    let course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Populate professor and students
    course = await Course.populate(course, ['professor', 'students']);
    
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
    
    // Check if professorId exists (data integrity check)
    if (!course.professorId) {
      return res.status(500).json({ message: "Course data corrupted: missing professor information" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to edit this course" });
    }
    
    // Validate policy if provided
    if (req.body.policy) {
      const total = Object.values(req.body.policy).reduce((a, b) => a + b, 0);
      if (Math.abs(total - 100) > 0.01) {
        return res.status(400).json({ message: "Policy percentages must total 100%" });
      }

      // Get current quiz and assignment counts
      const currentQuizCount = course.quizCount || 0;
      const currentAssignmentCount = course.assignmentCount || 0;

      // Validate quiz count if quizzes have non-zero percentage
      const quizPercentage = req.body.policy.quizzes || 0;
      if (quizPercentage > 0 && currentQuizCount === 0) {
        return res.status(400).json({ 
          message: "Quiz count must be greater than 0 when quizzes have a non-zero percentage. Please add quizzes first." 
        });
      }

      // Validate assignment count if assignments have non-zero percentage
      const assignmentPercentage = req.body.policy.assignment || 0;
      if (assignmentPercentage > 0 && currentAssignmentCount === 0) {
        return res.status(400).json({ 
          message: "Assignment count must be greater than 0 when assignments have a non-zero percentage. Please add assignments first." 
        });
      }
    }
    
    // Build update data
    const updateData = {};
    if (req.body.name) updateData.name = req.body.name;
    if (req.body.code) updateData.code = req.body.code;
    if (req.body.description) updateData.description = req.body.description;
    if (req.body.policy) updateData.policy = req.body.policy;
    
    const updatedCourse = await Course.findByIdAndUpdate(req.params.courseId, updateData, { new: true });
    
    res.json(updatedCourse);
  } catch (error) {
    res.status(500).json({ message: "Failed to update course" });
  }
};

// Update quiz count for a course (professor only)
export const updateQuizCount = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if professorId exists (data integrity check)
    if (!course.professorId) {
      return res.status(500).json({ message: "Course data corrupted: missing professor information" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course" });
    }
    
    const { quizCount } = req.body;
    
    if (quizCount < 0 || quizCount > 10) {
      return res.status(400).json({ message: "Quiz count must be between 0 and 10" });
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.courseId,
      { quizCount },
      { new: true }
    );
    
    res.json({ message: "Quiz count updated successfully", course: updatedCourse });
  } catch (error) {
    res.status(500).json({ message: "Failed to update quiz count" });
  }
};

// Update assignment count for a course (professor only)
export const updateAssignmentCount = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if professorId exists (data integrity check)
    if (!course.professorId) {
      return res.status(500).json({ message: "Course data corrupted: missing professor information" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course" });
    }
    
    const { assignmentCount } = req.body;
    
    if (assignmentCount < 0 || assignmentCount > 5) {
      return res.status(400).json({ message: "Assignment count must be between 0 and 5" });
    }
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.courseId,
      { assignmentCount },
      { new: true }
    );
    
    res.json({ message: "Assignment count updated successfully", course: updatedCourse });
  } catch (error) {
    res.status(500).json({ message: "Failed to update assignment count" });
  }
};

// Update max marks for assessments (professor only)
export const updateMaxMarks = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if professorId exists (data integrity check)
    if (!course.professorId) {
      return res.status(500).json({ message: "Course data corrupted: missing professor information" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course" });
    }
    
    const { maxMarks } = req.body;
    
    // Validate that max marks are positive numbers
    for (const [key, value] of Object.entries(maxMarks)) {
      if (value < 0) {
        return res.status(400).json({ message: `Max marks for ${key} must be positive` });
      }
    }
    
    // Update max marks - merge existing and new values
    const updatedMaxMarks = { 
      ...course.maxMarks,
      ...maxMarks 
    };
    
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.courseId,
      { maxMarks: updatedMaxMarks },
      { new: true }
    );
    
    res.json({ message: "Max marks updated successfully", course: updatedCourse });
  } catch (error) {
    res.status(500).json({ message: "Failed to update max marks" });
  }
};

// Toggle letter grade publishing (professor only)
export const toggleLetterGradePublishing = async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if professorId exists (data integrity check)
    if (!course.professorId) {
      return res.status(500).json({ message: "Course data corrupted: missing professor information" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course" });
    }
    
    // Toggle the publishing status
    const updatedCourse = await Course.findByIdAndUpdate(
      req.params.courseId,
      { letterGradesPublished: !course.letterGradesPublished },
      { new: true }
    );
    
    res.json({ 
      message: `Letter grades ${updatedCourse.letterGradesPublished ? 'published' : 'unpublished'} successfully`, 
      letterGradesPublished: updatedCourse.letterGradesPublished,
      course: updatedCourse 
    });
  } catch (error) {
    res.status(500).json({ message: "Failed to toggle letter grade publishing" });
  }
};

// Remove a student from a course (professor only)
export const removeStudentFromCourse = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if professorId exists (data integrity check)
    if (!course.professorId) {
      return res.status(500).json({ message: "Course data corrupted: missing professor information" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course" });
    }
    
    // Remove student from course
    await Course.removeStudent(courseId, studentId);
    await User.unenrollCourse(studentId, courseId);
    
    // Delete all grades for this student in this course
    const gradeResult = await Grade.deleteMany({ course: courseId, student: studentId });
    console.log(`Deleted ${gradeResult.deletedCount} grades for student ${studentId} in course ${courseId}`);
    
    // Delete all challenges for this student in this course
    const challengeResult = await Challenge.deleteMany({ course: courseId, student: studentId });
    console.log(`Deleted ${challengeResult.deletedCount} challenges for student ${studentId} in course ${courseId}`);
    
    res.json({ message: "Student, their grades, and challenges removed from course successfully" });
  } catch (error) {
    console.error("Error removing student from course:", error);
    res.status(500).json({ message: error.message });
  }
};

// Leave/delete a course (student/professor)
export const leaveCourse = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // If professor is leaving, they can only do so if no students are enrolled
    if (req.user.role === 'professor') {
      if (course.professorId !== userId) {
        return res.status(403).json({ message: "Not authorized" });
      }
      
      const students = await Course.getStudents(courseId);
      if (students && students.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete course with enrolled students. Remove all students first." 
        });
      }
      
      // Delete all grades for this course before deleting the course
      const gradeResult = await Grade.deleteMany({ course: courseId });
      console.log(`Deleted ${gradeResult.deletedCount} grades for course ${courseId}`);
      
      // Delete all challenges for this course before deleting the course
      const challengeResult = await Challenge.deleteMany({ course: courseId });
      console.log(`Deleted ${challengeResult.deletedCount} challenges for course ${courseId}`);
      
      // Delete the course
      await Course.findByIdAndDelete(courseId);
      res.json({ message: "Course deleted successfully with all associated data" });
    } else {
      // Student leaving the course - remove their grades and challenges too
      await Course.removeStudent(courseId, userId);
      await User.unenrollCourse(userId, courseId);
      
      // Delete student's grades for this course
      const gradeResult = await Grade.deleteMany({ course: courseId, student: userId });
      console.log(`Deleted ${gradeResult.deletedCount} grades for student ${userId} leaving course ${courseId}`);
      
      // Delete student's challenges for this course
      const challengeResult = await Challenge.deleteMany({ course: courseId, student: userId });
      console.log(`Deleted ${challengeResult.deletedCount} challenges for student ${userId} leaving course ${courseId}`);
      
      res.json({ message: "Successfully left the course with all grades and challenges removed" });
    }
  } catch (error) {
    console.error("Error leaving course:", error);
    res.status(500).json({ message: error.message });
  }
};

// Update grading scale for a course (professor only)
export const updateGradingScale = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { gradingScale } = req.body;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if professorId exists (data integrity check)
    if (!course.professorId) {
      return res.status(500).json({ message: "Course data corrupted: missing professor information" });
    }
    
    // Check if the logged-in professor owns this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to modify this course" });
    }
    
    // Validate grading scale format
    if (!gradingScale || typeof gradingScale !== 'object') {
      return res.status(400).json({ message: "Invalid grading scale format" });
    }

    // Validate grading scale format - support both percentage-based and sigma-based systems
    const grades = Object.entries(gradingScale);
    let isSigmaBased = false;
    
    // Check if this is a sigma-based grading system
    if (grades.length > 0) {
      const firstGrade = grades[0][1];
      isSigmaBased = firstGrade.minSigma !== undefined || firstGrade.maxSigma !== undefined;
    }
    
    console.log(`Validating ${isSigmaBased ? 'sigma-based' : 'percentage-based'} grading scale`);
    
    for (let i = 0; i < grades.length; i++) {
      const [gradeName, gradeData] = grades[i];
      
      if (isSigmaBased) {
        // Sigma-based validation
        if (typeof gradeData.minSigma !== 'number' || typeof gradeData.maxSigma !== 'number') {
          return res.status(400).json({ 
            message: `Invalid sigma boundaries for ${gradeName}. minSigma and maxSigma must be numbers.` 
          });
        }
        
        if (gradeData.minSigma > gradeData.maxSigma) {
          return res.status(400).json({ 
            message: `Invalid sigma boundaries for ${gradeName}. minSigma cannot be greater than maxSigma.` 
          });
        }
        
        if (gradeData.minSigma < -4 || gradeData.maxSigma > 4) {
          return res.status(400).json({ 
            message: `Sigma boundaries for ${gradeName} must be between -4 and 4 standard deviations.` 
          });
        }
      } else {
        // Percentage-based validation (legacy)
        if (typeof gradeData.min !== 'number' || typeof gradeData.max !== 'number') {
          return res.status(400).json({ 
            message: `Invalid grade boundaries for ${gradeName}. Min and max must be numbers.` 
          });
        }
        
        if (gradeData.min > gradeData.max) {
          return res.status(400).json({ 
            message: `Invalid grade boundaries for ${gradeName}. Minimum cannot be greater than maximum.` 
          });
        }
        
        if (gradeData.min < 0 || gradeData.max > 100) {
          return res.status(400).json({ 
            message: `Grade boundaries for ${gradeName} must be between 0 and 100.` 
          });
        }
      }
    }
    
    // Update the grading scale
    const updatedCourse = await Course.updateGradingScale(courseId, gradingScale);
    
    res.json({ 
      message: "Grading scale updated successfully",
      course: updatedCourse
    });
  } catch (error) {
    console.error("Error updating grading scale:", error);
    res.status(500).json({ message: error.message });
  }
};
  