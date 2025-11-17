import Course from "../models/Course.js";
import Grade from "../models/Grade.js";
import User from "../models/userModel.js";

export const getCourseGrades = async (req, res) => {
  const { courseId } = req.params;

  try {
    let course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });
    
    // SECURITY: Verify professor owns this course
    if (!course.professorId) {
      return res.status(500).json({ message: "Course data corrupted: missing professor information" });
    }
    
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view grades for this course" });
    }

    // Populate students
    course = await Course.populate(course, ['students']);

    // Fetch grades for enrolled students
    const grades = await Grade.find({ course: courseId });

    // Merge students with grades
    const studentGrades = course.students.map(student => {
      const g = grades.find(grade => grade.studentId == student.id);
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
        assignment1: g.marks.assignment1 || 0,
        assignment2: g.marks.assignment2 || 0,
        assignment3: g.marks.assignment3 || 0,
        assignment4: g.marks.assignment4 || 0,
        assignment5: g.marks.assignment5 || 0,
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
        assignment1: 0,
        assignment2: 0,
        assignment3: 0,
        assignment4: 0,
        assignment5: 0,
        project: 0,
        assignment: 0,
        attendance: 0,
        participation: 0
      };
      
      return {
        _id: student.id,
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
    // SECURITY: Verify professor owns this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    if (!course.professorId) {
      return res.status(500).json({ message: "Course data corrupted: missing professor information" });
    }
    
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update grades for this course" });
    }
    
    // SECURITY: Verify all students are enrolled in this course
    const enrolledStudents = await Course.getStudents(courseId);
    const enrolledStudentIds = enrolledStudents.map(s => s.id.toString());
    
    // Get course max marks for validation
    const maxMarks = course.maxMarks || {};
    
    for (const studentId in grades) {
      if (!enrolledStudentIds.includes(studentId.toString())) {
        return res.status(403).json({ 
          message: `Cannot update grades: Student ${studentId} is not enrolled in this course` 
        });
      }
      
      // DATA INTEGRITY: Validate that all marks don't exceed maxMarks
      const studentMarks = grades[studentId];
      for (const component in studentMarks) {
        const enteredMark = studentMarks[component];
        const maxMark = maxMarks[component] || 100; // Default to 100 if not specified
        
        if (enteredMark !== null && enteredMark !== undefined && enteredMark > maxMark) {
          return res.status(400).json({ 
            message: `Invalid marks: ${component} mark (${enteredMark}) exceeds maximum (${maxMark}) for student ${studentId}` 
          });
        }
        
        if (enteredMark !== null && enteredMark !== undefined && enteredMark < 0) {
          return res.status(400).json({ 
            message: `Invalid marks: ${component} mark (${enteredMark}) cannot be negative for student ${studentId}` 
          });
        }
      }
      
      const updatedGrade = await Grade.findOneAndUpdate(
        { course: courseId, student: studentId },
        { marks: grades[studentId] },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log("Updated grade doc:", updatedGrade);
    }

    res.json({ message: "Grades updated successfully" });
  } catch (err) {
    res.status(500).json({ message: "Failed to update grades" });
  }
};

  export const getStudentGrades = async (req, res) => {
    const studentId = req.user.id; // from verifyToken middleware
    const { courseId } = req.params;
  
    try {
      const course = await Course.findById(courseId);
  
      if (!course) return res.status(404).json({ message: "Course not found" });
      
      // SECURITY: Verify student is enrolled in this course
      const User = (await import('../models/userModel.js')).default;
      const enrolledCourses = await User.getEnrolledCourses(studentId);
      
      if (!enrolledCourses.includes(courseId)) {
        return res.status(403).json({ 
          message: "Access denied: You are not enrolled in this course" 
        });
      }
      
      const grade = await Grade.findOne({ student: studentId, course: courseId });

      // Calculate letter grade if published
      let letterGrade = null;
      if (course.letterGradesPublished && grade) {
        // Calculate weighted score for this student
        const policy = course.policy;
        const quizCount = course.quizCount || 0;
        const assignmentCount = course.assignmentCount || 0;
        const maxMarks = course.maxMarks || {};
        let weightedScore = 0;
        const marks = grade.marks;

        Object.keys(policy).forEach(key => {
          if (policy[key] > 0) {
            if (key === 'quizzes' && quizCount > 0) {
              for (let i = 1; i <= quizCount; i++) {
                const quizKey = `quiz${i}`;
                const score = marks[quizKey] || 0;
                const max = maxMarks[quizKey] || 100;
                const weight = policy.quizzes / quizCount;
                weightedScore += (score / max) * weight;
              }
            } else if (key === 'assignment' && assignmentCount > 0) {
              for (let i = 1; i <= assignmentCount; i++) {
                const assignmentKey = `assignment${i}`;
                const score = marks[assignmentKey] || 0;
                const max = maxMarks[assignmentKey] || 100;
                const weight = policy.assignment / assignmentCount;
                weightedScore += (score / max) * weight;
              }
            } else if (key !== 'quizzes' && key !== 'assignment') {
              const score = marks[key] || 0;
              const max = maxMarks[key] || 100;
              weightedScore += (score / max) * policy[key];
            }
          }
        });

        // Calculate overall statistics for all students
        const allGrades = await Grade.find({ course: courseId });
        const allWeightedScores = allGrades.map(g => {
          let ws = 0;
          const m = g.marks;
          Object.keys(policy).forEach(key => {
            if (policy[key] > 0) {
              if (key === 'quizzes' && quizCount > 0) {
                for (let i = 1; i <= quizCount; i++) {
                  const quizKey = `quiz${i}`;
                  const score = m[quizKey] || 0;
                  const max = maxMarks[quizKey] || 100;
                  const weight = policy.quizzes / quizCount;
                  ws += (score / max) * weight;
                }
              } else if (key === 'assignment' && assignmentCount > 0) {
                for (let i = 1; i <= assignmentCount; i++) {
                  const assignmentKey = `assignment${i}`;
                  const score = m[assignmentKey] || 0;
                  const max = maxMarks[assignmentKey] || 100;
                  const weight = policy.assignment / assignmentCount;
                  ws += (score / max) * weight;
                }
              } else if (key !== 'quizzes' && key !== 'assignment') {
                const score = m[key] || 0;
                const max = maxMarks[key] || 100;
                ws += (score / max) * policy[key];
              }
            }
          });
          return ws;
        });

        const mean = allWeightedScores.reduce((a, b) => a + b, 0) / allWeightedScores.length;
        const variance = allWeightedScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allWeightedScores.length;
        const stdDev = Math.sqrt(variance);

        // Calculate letter grade based on z-score using course's grading scale
        if (stdDev > 0) {
          const zScore = (weightedScore - mean) / stdDev;
          
          // Use course's custom grading scale if available
          const gradingScale = course.gradingScale || {
            "A+": 1.5,
            "A": 1.0,
            "A-": 0.5,
            "B": 0.0,
            "C": -0.5,
            "D": -1.0,
            "E": -1.5,
            "F": -2.0
          };
          
          // Sort grades by threshold descending to find the appropriate grade
          const sortedGrades = Object.entries(gradingScale)
            .sort((a, b) => b[1] - a[1]);
          
          letterGrade = "FAIL"; // Default
          for (const [grade, threshold] of sortedGrades) {
            if (zScore >= threshold) {
              letterGrade = grade;
              break;
            }
          }
        } else {
          // Edge case: All students have the same weighted score (stdDev = 0)
          // Assign grade based on absolute performance
          const gradingScale = course.gradingScale || {
            "A+": 1.5,
            "A": 1.0,
            "A-": 0.5,
            "B": 0.0,
            "C": -0.5,
            "D": -1.0,
            "E": -1.5,
            "F": -2.0
          };
          
          // When everyone performs equally, assign grade based on mean score percentage
          // 90-100%: A+, 80-90%: A, 70-80%: A-, 60-70%: B, 50-60%: C, 40-50%: D, 30-40%: E, <30%: F
          if (mean >= 90) letterGrade = "A+";
          else if (mean >= 80) letterGrade = "A";
          else if (mean >= 70) letterGrade = "A-";
          else if (mean >= 60) letterGrade = "B";
          else if (mean >= 50) letterGrade = "C";
          else if (mean >= 40) letterGrade = "D";
          else if (mean >= 30) letterGrade = "E";
          else letterGrade = "F";
        }
      }
      
      res.json({
        course: {
          name: course.name,
          code: course.code,
          policy: course.policy,
          quizCount: course.quizCount || 0,
          assignmentCount: course.assignmentCount || 0,
          maxMarks: course.maxMarks || {},
          letterGradesPublished: course.letterGradesPublished || false,
          gradingScale: course.gradingScale || {}
        },
        studentGrades: grade ? [{
          _id: grade.id,
          name: req.user.name,
          marks: grade.marks
        }] : [],
        marks: grade ? grade.marks : null,
        letterGrade: letterGrade,
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
    let course = await Course.findById(courseId);
    
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Populate students
    course = await Course.populate(course, ['students']);

    // Check if the logged-in professor owns this course
    if (course.professorId !== req.user.id) {
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
        { course: courseId, student: student.id },
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
    let grade = await Grade.findById(gradeId);
    
    if (!grade) {
      return res.status(404).json({ message: "Grade not found" });
    }

    // Populate student and course
    grade = await Grade.populate(grade, ['student', 'course']);

    // Check if the user is authorized to view this grade
    // Student can view their own grade, professor can view any grade in their course
    const userId = req.user.id;
    const isStudent = grade.student.id == userId;
    
    if (!isStudent) {
      // Check if user is the professor of the course
      const course = await Course.findById(grade.courseId);
      const isProfessor = course && course.professorId == userId;
      
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

// Get course grade statistics
export const getCourseStatistics = async (req, res) => {
  const { courseId } = req.params;

  try {
    let course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Populate students
    course = await Course.populate(course, ['students']);

    // Check if professor owns this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view statistics for this course" });
    }

    let grades = await Grade.find({ course: courseId });

    if (grades.length === 0) {
      return res.status(404).json({ message: "No grades found for this course" });
    }

    // Populate student info for each grade
    grades = await Promise.all(
      grades.map(async (grade) => {
        return await Grade.populate(grade, ['student']);
      })
    );

    const policy = course.policy;
    const quizCount = course.quizCount || 0;
    const assignmentCount = course.assignmentCount || 0;
    const maxMarks = course.maxMarks || {};

    // Helper function to calculate statistics
    const calculateStats = (values) => {
      if (values.length === 0) return { mean: 0, median: 0, stdDev: 0, min: 0, max: 0 };
      
      const sorted = values.slice().sort((a, b) => a - b);
      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const median = values.length % 2 === 0
        ? (sorted[values.length / 2 - 1] + sorted[values.length / 2]) / 2
        : sorted[Math.floor(values.length / 2)];
      
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
      const stdDev = Math.sqrt(variance);
      
      return {
        mean,
        median,
        stdDev,
        min: sorted[0],
        max: sorted[sorted.length - 1]
      };
    };

    // Calculate weighted scores for each student
    const studentGrades = grades.map(grade => {
      let weightedScore = 0;
      const marks = grade.marks;

      // Calculate weighted contribution for each component
      Object.keys(policy).forEach(key => {
        if (policy[key] > 0) {
          if (key === 'quizzes' && quizCount > 0) {
            // Handle individual quizzes
            for (let i = 1; i <= quizCount; i++) {
              const quizKey = `quiz${i}`;
              const score = marks[quizKey] || 0;
              const max = maxMarks[quizKey] || 100;
              const weight = policy.quizzes / quizCount;
              weightedScore += (score / max) * weight;
            }
          } else if (key === 'assignment' && assignmentCount > 0) {
            // Handle individual assignments
            for (let i = 1; i <= assignmentCount; i++) {
              const assignmentKey = `assignment${i}`;
              const score = marks[assignmentKey] || 0;
              const max = maxMarks[assignmentKey] || 100;
              const weight = policy.assignment / assignmentCount;
              weightedScore += (score / max) * weight;
            }
          } else if (key !== 'quizzes' && key !== 'assignment') {
            // Handle other components
            const score = marks[key] || 0;
            const max = maxMarks[key] || 100;
            weightedScore += (score / max) * policy[key];
          }
        }
      });

      return {
        name: grade.student.name,
        email: grade.student.email,
        weightedScore,
        marks: marks
      };
    });

    // Calculate overall statistics
    const overallScores = studentGrades.map(s => s.weightedScore);
    const overallStats = calculateStats(overallScores);

    // Calculate assessment-wise statistics
    const assessmentStats = {};
    
    // Helper to get active assessments
    const getActiveAssessments = () => {
      const assessments = [];
      Object.keys(policy).forEach(key => {
        if (policy[key] > 0) {
          if (key === 'quizzes' && quizCount > 0) {
            for (let i = 1; i <= quizCount; i++) {
              assessments.push(`quiz${i}`);
            }
          } else if (key === 'assignment' && assignmentCount > 0) {
            for (let i = 1; i <= assignmentCount; i++) {
              assessments.push(`assignment${i}`);
            }
          } else if (key !== 'quizzes' && key !== 'assignment') {
            assessments.push(key);
          }
        }
      });
      return assessments;
    };

    const activeAssessments = getActiveAssessments();
    
    activeAssessments.forEach(assessment => {
      const scores = grades.map(grade => grade.marks[assessment] || 0).filter(s => s > 0);
      if (scores.length > 0) {
        assessmentStats[assessment] = calculateStats(scores);
      }
    });

    res.json({
      course,
      statistics: {
        overallStats,
        assessmentStats,
        studentGrades
      }
    });
  } catch (err) {
    console.error("Error calculating statistics:", err);
    res.status(500).json({ message: err.message });
  }
};
  