import Course from "../models/Course.js";
import Grade from "../models/Grade.js";
import User from "../models/userModel.js";

export const getCourseGrades = async (req, res) => {
  const { courseId } = req.params;

  try {
    console.log("good fuck")
    const course = await Course.findById(courseId).populate("students", "name email");
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Fetch grades for enrolled students
    const grades = await Grade.find({ course: courseId });
    console.log("grades", grades)

    // Merge students with grades
    const studentGrades = course.students.map(student => {
      const g = grades.find(grade => grade.student.toString() === student._id.toString());
      // Create a new object for each student to avoid shared references
      const marks = g ? {
        midsem: g.marks.midsem || 0,
        endsem: g.marks.endsem || 0,
        quizzes: g.marks.quizzes || 0,
        quiz1: g.marks.quiz1 || 0,
        quiz2: g.marks.quiz2 || 0,
        quiz3: g.marks.quiz3 || 0,
        quiz4: g.marks.quiz4 || 0,
        quiz5: g.marks.quiz5 || 0,
        quiz6: g.marks.quiz6 || 0,
        quiz7: g.marks.quiz7 || 0,
        quiz8: g.marks.quiz8 || 0,
        quiz9: g.marks.quiz9 || 0,
        quiz10: g.marks.quiz10 || 0,
        project: g.marks.project || 0,
        assignment: g.marks.assignment || 0,
        attendance: g.marks.attendance || 0,
        participation: g.marks.participation || 0
      } : {
        midsem: 0,
        endsem: 0,
        quizzes: 0,
        quiz1: 0,
        quiz2: 0,
        quiz3: 0,
        quiz4: 0,
        quiz5: 0,
        quiz6: 0,
        quiz7: 0,
        quiz8: 0,
        quiz9: 0,
        quiz10: 0,
        project: 0,
        assignment: 0,
        attendance: 0,
        participation: 0
      };
      
      return {
        _id: student._id,
        name: student.name,
        marks: marks
      };
    });

    res.json({ course, studentGrades });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

export const updateCourseGrades = async (req, res) => {
  const { courseId } = req.params;
  const { grades } = req.body;

  try {
    console.log("Controller triggered for course:", courseId);
    console.log("Grades payload:", grades);

    for (const studentId in grades) {
      console.log(`Updating student ${studentId} ...`);

      const updatedGrade = await Grade.findOneAndUpdate(
        { course: courseId, student: studentId },
        { marks: grades[studentId] },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log("Updated grade doc:", updatedGrade);
    }

    res.json({ message: "Grades updated successfully" });
  } catch (err) {
    console.error("Error updating grades:", err);
    res.status(500).json({ message: err.message });
  }
};

  export const getStudentGrades = async (req, res) => {
    const studentId = req.user._id; // from verifyToken middleware
    const { courseId } = req.params;
  
    try {
      console.log(`Fetching grades for student ${studentId} in course ${courseId}`);
      
      const grade = await Grade.findOne({ student: studentId, course: courseId });
      const course = await Course.findById(courseId);
  
      if (!course) return res.status(404).json({ message: "Course not found" });
  
      console.log("Found grade:", grade);
      
      res.json({
        course: {
          name: course.name,
          code: course.code,
          policy: course.policy,
          quizCount: course.quizCount || 0,
        },
        studentGrades: grade ? [{
          _id: grade._id,
          name: req.user.name,
          marks: grade.marks
        }] : [],
        marks: grade ? grade.marks : null,
      });
    } catch (err) {
      console.log("Error fetching student grades:", err);
      res.status(500).json({ message: err.message });
    }
  };

// Upload grades from CSV
export const uploadGradesFromCSV = async (req, res) => {
  const { courseId } = req.params;
  const { csvData } = req.body; // Array of objects from parsed CSV

  try {
    const course = await Course.findById(courseId).populate("students", "name email");
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Check if the logged-in professor owns this course
    if (course.professor.toString() !== req.user.id.toString()) {
      return res.status(403).json({ message: "Not authorized to update grades for this course" });
    }

    let successCount = 0;
    let skippedCount = 0;
    const skippedEntries = [];

    // Process each row from CSV
    for (const row of csvData) {
      const studentName = row.name || row.Name || row.student_name || row['Student Name'];
      const studentEmail = row.email || row.Email || row.student_email || row['Student Email'];

      if (!studentName || !studentEmail) {
        skippedCount++;
        skippedEntries.push({ row, reason: "Missing name or email" });
        continue;
      }

      // Find student in course by name AND email
      const student = course.students.find(
        s => s.name.toLowerCase().trim() === studentName.toLowerCase().trim() && 
             s.email.toLowerCase().trim() === studentEmail.toLowerCase().trim()
      );

      if (!student) {
        skippedCount++;
        skippedEntries.push({ name: studentName, email: studentEmail, reason: "Not enrolled in course" });
        continue;
      }

      // Build marks object with defaults
      const marks = {
        midsem: 0,
        endsem: 0,
        quizzes: 0,
        quiz1: 0,
        quiz2: 0,
        quiz3: 0,
        quiz4: 0,
        quiz5: 0,
        quiz6: 0,
        quiz7: 0,
        quiz8: 0,
        quiz9: 0,
        quiz10: 0,
        project: 0,
        assignment: 0,
        attendance: 0,
        participation: 0
      };

      // Map CSV columns to marks (case-insensitive)
      Object.keys(row).forEach(key => {
        const lowerKey = key.toLowerCase().trim();
        const value = parseFloat(row[key]) || 0;

        // Map common column names
        if (lowerKey === 'midsem' || lowerKey === 'mid sem' || lowerKey === 'midterm') {
          marks.midsem = value;
        } else if (lowerKey === 'endsem' || lowerKey === 'end sem' || lowerKey === 'endterm' || lowerKey === 'final') {
          marks.endsem = value;
        } else if (lowerKey === 'quizzes' || lowerKey === 'quiz') {
          marks.quizzes = value;
        } else if (lowerKey.match(/^quiz\s*(\d+)$/)) {
          const quizNum = lowerKey.match(/^quiz\s*(\d+)$/)[1];
          if (quizNum >= 1 && quizNum <= 10) {
            marks[`quiz${quizNum}`] = value;
          }
        } else if (lowerKey === 'project') {
          marks.project = value;
        } else if (lowerKey === 'assignment' || lowerKey === 'assignments') {
          marks.assignment = value;
        } else if (lowerKey === 'attendance') {
          marks.attendance = value;
        } else if (lowerKey === 'participation') {
          marks.participation = value;
        }
      });

      // Update or create grade entry
      await Grade.findOneAndUpdate(
        { course: courseId, student: student._id },
        { marks },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      successCount++;
    }

    res.json({
      message: `CSV upload completed. ${successCount} students updated, ${skippedCount} entries skipped.`,
      successCount,
      skippedCount,
      skippedEntries: skippedEntries.length > 0 ? skippedEntries : undefined
    });

  } catch (err) {
    console.error("Error uploading grades from CSV:", err);
    res.status(500).json({ message: err.message });
  }
};

// Get a single grade by ID (for challenge page)
export const getGradeById = async (req, res) => {
  const { gradeId } = req.params;

  try {
    const grade = await Grade.findById(gradeId).populate('student', 'name email').populate('course', 'name');
    
    if (!grade) {
      return res.status(404).json({ message: "Grade not found" });
    }

    // Check if the user is authorized to view this grade
    // Student can view their own grade, professor can view any grade in their course
    const userId = req.user._id.toString();
    const isStudent = grade.student._id.toString() === userId;
    
    if (!isStudent) {
      // Check if user is the professor of the course
      const course = await Course.findById(grade.course._id);
      const isProfessor = course && course.professor.toString() === userId;
      
      if (!isProfessor) {
        return res.status(403).json({ message: "Not authorized to view this grade" });
      }
    }

    res.json(grade);
  } catch (err) {
    console.error("Error fetching grade by ID:", err);
    res.status(500).json({ message: err.message });
  }
};
  