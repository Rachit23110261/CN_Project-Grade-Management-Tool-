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
      return {
        _id: student._id,
        name: student.name,
        marks: g ? g.marks : {
          midsem: 0,
          endsem: 0,
          quizzes: 0,
          project: 0,
          assignment: 0,
          attendance: 0,
          participation: 0
        }
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
      const grade = await Grade.findOne({ student: studentId, course: courseId });
      const course = await Course.findById(courseId);
  
      if (!course) return res.status(404).json({ message: "Course not found" });
  
      res.json({
        course: {
          name: course.name,
          code: course.code,
          policy: course.policy,
        },
        marks: grade ? grade.marks : null,
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  };
  