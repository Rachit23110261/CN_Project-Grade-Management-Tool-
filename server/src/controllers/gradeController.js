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
      console.error("Error fetching student grades:", err);
      res.status(500).json({ message: err.message });
    }
  };
  