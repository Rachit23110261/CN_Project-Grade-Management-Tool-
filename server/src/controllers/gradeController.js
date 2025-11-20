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

    // Get students enrolled in this course
    course = await Course.populate(course, ['students']);

    // Fetch grades for enrolled students
    const grades = await Grade.find({ course: courseId });

    console.log(`=== RETRIEVING GRADES FOR COURSE ${courseId} ===`);
    console.log(`Found ${grades.length} grade records`);
    grades.forEach((grade, index) => {
      console.log(`Grade ${index + 1}:`, {
        id: grade.id,
        student: grade.student,
        marks: Object.entries(grade.marks).filter(([key, value]) => value > 0)
      });
    });
    console.log(`Course has ${course.students.length} enrolled students`);

    // Merge students with grades
    const studentGrades = course.students.map(student => {
      const g = grades.find(grade => grade.student && grade.student.id == student.id);
      console.log(`Student ${student.id} (${student.name}): ${g ? 'Found grades' : 'No grades found'}`);
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
        email: student.email || '',
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

  console.log("=== UPDATE COURSE GRADES ===");
  console.log("Course ID:", courseId);
  console.log("Grades to save:", JSON.stringify(grades, null, 2));

  try {
    // SECURITY: Verify professor owns this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    console.log("Professor ID from course:", course.professorId);
    console.log("User ID from token:", req.user.id);
    
    if (!course.professorId) {
      return res.status(500).json({ message: "Course data corrupted: missing professor information" });
    }
    
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update grades for this course" });
    }
    
    // SECURITY: Verify all students are enrolled in this course
    const enrolledStudents = await Course.getStudents(courseId);
    const enrolledStudentIds = enrolledStudents.map(s => s.id.toString());
    
    console.log("Enrolled students:", enrolledStudents.map(s => ({ id: s.id, name: s.name })));
    console.log("Enrolled student IDs (as strings):", enrolledStudentIds);
    console.log("Grade student IDs:", Object.keys(grades));
    
    // Get course max marks for validation
    const maxMarks = course.maxMarks || {};
    
    for (const studentId in grades) {
      console.log(`Checking student ${studentId} (type: ${typeof studentId})`);
      if (!enrolledStudentIds.includes(studentId.toString())) {
        console.log(`Student ${studentId} not found in enrolled list`);
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
      
      console.log(`Saving grades for student ${studentId}:`, grades[studentId]);
      
      const updatedGrade = await Grade.findOneAndUpdate(
        { course: courseId, student: studentId },
        { marks: grades[studentId] },
        { upsert: true, new: true, setDefaultsOnInsert: true }
      );

      console.log("Saved grade result:", updatedGrade);

      if (!updatedGrade) {
        console.error(`Failed to update grade for student ${studentId} in course ${courseId}`);
        return res.status(500).json({ 
          message: `Failed to update grades for student ${studentId}` 
        });
      }

      console.log("Updated grade doc:", updatedGrade);
    }

    res.json({ message: "Grades updated successfully" });
  } catch (err) {
    console.error("Error in updateCourseGrades:", err);
    res.status(500).json({ message: "Failed to update grades", error: err.message });
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
      
      console.log(`Debug - Student ${studentId} checking enrollment in course ${courseId}`);
      console.log(`Debug - Enrolled courses:`, enrolledCourses);
      console.log(`Debug - Course ID type:`, typeof courseId);
      console.log(`Debug - Enrolled course types:`, enrolledCourses.map(id => typeof id));
      
      // Convert courseId to number for comparison since DB returns numbers
      const courseIdNum = parseInt(courseId);
      const enrolledCourseIds = enrolledCourses.map(id => parseInt(id));
      
      if (!enrolledCourseIds.includes(courseIdNum)) {
        console.log(`Access denied - Student ${studentId} not enrolled in course ${courseId}`);
        return res.status(403).json({ 
          message: "Access denied: You are not enrolled in this course" 
        });
      }
      
      const grade = await Grade.findOne({ student: studentId, course: courseId });

      // Calculate letter grade if published
      let letterGrade = null;
      if (course.letterGradesPublished && grade) {
        try {
          // Calculate weighted score for this student
          const policy = course.policy || {};
          const quizCount = course.quizCount || 0;
          const assignmentCount = course.assignmentCount || 0;
          const maxMarks = course.maxMarks || {};
          let weightedScore = 0;
          const marks = grade.marks || {};

          Object.keys(policy).forEach(key => {
            if (policy[key] > 0) {
              if (key === 'quizzes' && quizCount > 0) {
                for (let i = 1; i <= quizCount; i++) {
                  const quizKey = `quiz${i}`;
                  const score = marks[quizKey] || 0;
                  const max = maxMarks[quizKey] || 100;
                  const weight = policy.quizzes / quizCount;
                  weightedScore += (score / max) * 100 * (weight / 100);
                }
              } else if (key === 'assignment' && assignmentCount > 0) {
                for (let i = 1; i <= assignmentCount; i++) {
                  const assignmentKey = `assignment${i}`;
                  const score = marks[assignmentKey] || 0;
                  const max = maxMarks[assignmentKey] || 100;
                  const weight = policy.assignment / assignmentCount;
                  weightedScore += (score / max) * 100 * (weight / 100);
                }
              } else if (key !== 'quizzes' && key !== 'assignment') {
                const score = marks[key] || 0;
                const max = maxMarks[key] || 100;
                weightedScore += (score / max) * 100 * (policy[key] / 100);
              }
            }
          });

          // Calculate overall statistics for all students
          const allGrades = await Grade.find({ course: courseId });
          if (allGrades && allGrades.length > 0) {
            const allWeightedScores = allGrades.map(g => {
              let ws = 0;
              const m = g.marks || {};
              Object.keys(policy).forEach(key => {
                if (policy[key] > 0) {
                  if (key === 'quizzes' && quizCount > 0) {
                    for (let i = 1; i <= quizCount; i++) {
                      const quizKey = `quiz${i}`;
                      const score = m[quizKey] || 0;
                      const max = maxMarks[quizKey] || 100;
                      const weight = policy.quizzes / quizCount;
                      ws += (score / max) * 100 * (weight / 100);
                    }
                  } else if (key === 'assignment' && assignmentCount > 0) {
                    for (let i = 1; i <= assignmentCount; i++) {
                      const assignmentKey = `assignment${i}`;
                      const score = m[assignmentKey] || 0;
                      const max = maxMarks[assignmentKey] || 100;
                      const weight = policy.assignment / assignmentCount;
                      ws += (score / max) * 100 * (weight / 100);
                    }
                  } else if (key !== 'quizzes' && key !== 'assignment') {
                    const score = m[key] || 0;
                    const max = maxMarks[key] || 100;
                    ws += (score / max) * 100 * (policy[key] / 100);
                  }
                }
              });
              return ws;
            });

            // Calculate letter grade based on course's grading scheme
            const gradingScheme = course.gradingScheme || 'relative';
            const gradingScale = course.gradingScale;
            
            console.log(`📊 Letter Grade Calculation for Student ${studentId}:`);
            console.log(`  - Weighted Score: ${weightedScore}`);
            console.log(`  - All Weighted Scores:`, allWeightedScores);
            console.log(`  - Grading Scheme:`, gradingScheme);
            console.log(`  - Grading Scale:`, gradingScale);
            
            if (gradingScheme === 'absolute' && gradingScale && typeof Object.values(gradingScale)[0] === 'object' && course.letterGradesPublished) {
              // Use absolute (percentage-based) grading scale set by professor
              const gradeEntries = Object.entries(gradingScale);
              letterGrade = "F"; // Default
              
              console.log(`  - Using absolute (percentage-based) grading scale`);
              
              // Check which grade range the weighted score falls into
              for (const [gradeLabel, gradeData] of gradeEntries) {
                if (typeof gradeData === 'object' && gradeData.min !== undefined && gradeData.max !== undefined) {
                  if (weightedScore >= gradeData.min && weightedScore <= gradeData.max) {
                    letterGrade = gradeLabel;
                    break;
                  }
                }
              }
            } else {
              // Default: Use relative (z-score based) grading (Gaussian distribution)
              // This matches what professors see in the statistics view
              const mean = allWeightedScores.reduce((a, b) => a + b, 0) / allWeightedScores.length;
              const variance = allWeightedScores.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / allWeightedScores.length;
              const stdDev = Math.sqrt(variance);
              
              console.log(`  - Using relative (z-score based) grading`);
              console.log(`  - Mean: ${mean}, StdDev: ${stdDev}`);
              
              if (stdDev > 0) {
                const zScore = (weightedScore - mean) / stdDev;
                
                console.log(`  - Z-Score: ${zScore}`);
                
                // Gaussian distribution grading (matches frontend professor view)
                if (zScore >= 1.5) letterGrade = "A+";
                else if (zScore >= 1.0) letterGrade = "A";
                else if (zScore >= 0.5) letterGrade = "A-";
                else if (zScore >= 0.0) letterGrade = "B";
                else if (zScore >= -0.5) letterGrade = "C";
                else if (zScore >= -1.0) letterGrade = "D";
                else if (zScore >= -1.5) letterGrade = "E";
                else if (zScore >= -2.0) letterGrade = "F";
                else letterGrade = "FAIL :)";
              } else {
                // Edge case: All students have the same weighted score (stdDev = 0)
                // Assign grade based on absolute performance
                console.log(`  - StdDev is 0, using absolute grading`);
                if (weightedScore >= 90) letterGrade = "A+";
                else if (weightedScore >= 80) letterGrade = "A";
                else if (weightedScore >= 70) letterGrade = "A-";
                else if (weightedScore >= 60) letterGrade = "B";
                else if (weightedScore >= 50) letterGrade = "C";
                else if (weightedScore >= 40) letterGrade = "D";
                else if (weightedScore >= 30) letterGrade = "E";
                else letterGrade = "F";
              }
            }
            
            console.log(`  ✅ Final Letter Grade: ${letterGrade}`);
          }
        } catch (letterGradeError) {
          console.error("Error calculating letter grade:", letterGradeError);
          // Continue without letter grade calculation
          letterGrade = null;
        }
      }
      
      res.json({
        course: {
          name: course.name,
          code: course.code,
          policy: course.policy || {},
          quizCount: course.quizCount || 0,
          assignmentCount: course.assignmentCount || 0,
          maxMarks: course.maxMarks || {},
          letterGradesPublished: course.letterGradesPublished || false,
          gradingScale: course.gradingScale || {}
        },
        studentGrades: grade ? [{
          _id: grade.id,
          name: req.user.name,
          email: req.user.email || '',
          marks: grade.marks
        }] : [],
        marks: grade ? grade.marks : null,
        letterGrade: letterGrade,
      });
    } catch (err) {
      console.error("Error fetching student grades:", err);
      res.status(500).json({ message: "Failed to fetch student grades", error: err.message });
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

    // Check if the logged-in professor owns this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to update grades for this course" });
    }

    // Get students enrolled in this course
    course = await Course.populate(course, ['students']);

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

    // Check if the user is authorized to view this grade
    // Student can view their own grade, professor can view any grade in their course
    const userId = req.user.id;
    const isStudent = grade.studentId == userId;
    
    if (!isStudent) {
      // Check if user is the professor of the course
      const Course = (await import('../models/Course.js')).default;
      const course = await Course.findById(grade.course);
      const isProfessor = course && course.professorId == userId;
      
      if (!isProfessor) {
        return res.status(403).json({ message: "Not authorized to view this grade" });
      }
    }

    res.json(grade);
  } catch (err) {
    console.error("Error fetching grade by ID:", err);
    res.status(500).json({ message: "Failed to fetch grade", error: err.message });
  }
};

// Get course grade statistics
export const getCourseStatistics = async (req, res) => {
  const { courseId } = req.params;

  try {
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Check if professor owns this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view statistics for this course" });
    }

    const grades = await Grade.find({ course: courseId });

    if (grades.length === 0) {
      return res.status(404).json({ message: "No grades found for this course" });
    }

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

// Get grade distribution for histogram display
export const getGradeDistribution = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }
    
    // Check if user is professor of this course
    if (course.professorId !== req.user.id) {
      return res.status(403).json({ message: "Not authorized to view this course's grade distribution" });
    }
    
    // Get all grades for this course
    const grades = await Grade.find({ course: courseId });
    
    console.log(`=== PERCENTAGE-BASED GAUSSIAN GRADE DISTRIBUTION ===`);
    console.log(`Found ${grades.length} grade records for course ${courseId}`);
    
    if (grades.length === 0) {
      console.log("No grades found, returning empty distribution");
      return res.json({
        course: { name: course.name, code: course.code },
        gradingScale: getDefaultGradingScale(),
        distribution: [],
        studentCounts: {},
        students: [],
        totalStudents: 0,
        letterGradesPublished: course.letterGradesPublished || false
      });
    }
    
    const policy = course.policy || {};
    const maxMarks = course.maxMarks || {};
    
    // Calculate weighted scores for each student
    const studentScores = [];
    const studentGradeMapping = {};
    
    console.log(`Processing ${grades.length} grades for course ${courseId}`);
    
    // First pass: Calculate all student percentage scores
    grades.forEach(grade => {
      let weightedScore = 0;
      let totalWeight = 0;
      
      // Calculate weighted score for this student
      for (const assessment in policy) {
        const weight = policy[assessment];
        if (weight > 0) {
          const marks = grade.marks[assessment] || 0;
          const max = maxMarks[assessment] || 100;
          const percentage = (marks / max) * 100;
          
          weightedScore += percentage * (weight / 100);
          totalWeight += weight / 100;
        }
      }
      
      // If no policy is defined, use a simple average of available marks
      if (totalWeight === 0 && grade.marks) {
        let totalMarks = 0;
        let totalMaxMarks = 0;
        let hasMarks = false;
        
        for (const assessment in grade.marks) {
          if (grade.marks[assessment] > 0) {
            const marks = grade.marks[assessment] || 0;
            const max = maxMarks[assessment] || 100;
            totalMarks += marks;
            totalMaxMarks += max;
            hasMarks = true;
          }
        }
        
        if (hasMarks && totalMaxMarks > 0) {
          weightedScore = (totalMarks / totalMaxMarks) * 100;
          totalWeight = 1;
        }
      }
      
      if (totalWeight > 0) {
        const finalScore = weightedScore / totalWeight;
        studentScores.push(finalScore);
        
        // Store student info for later grade assignment
        studentGradeMapping[grade.student.id] = {
          score: finalScore,
          studentName: grade.student.name || "Unknown",
          letterGrade: "F" // Will be assigned in second pass
        };
      }
    });

    // Second pass: Calculate Gaussian-based grade boundaries and assign letter grades
    console.log(`\n=== GAUSSIAN BOUNDARY CALCULATION ===`);
    
    if (course.letterGradesPublished && studentScores.length > 0) {
      // Calculate class statistics
      const mean = studentScores.reduce((sum, score) => sum + score, 0) / studentScores.length;
      const variance = studentScores.reduce((sum, score) => sum + Math.pow(score - mean, 2), 0) / studentScores.length;
      const stdDev = Math.sqrt(variance);
      
      console.log(`Class statistics - Mean: ${mean.toFixed(2)}%, StdDev: ${stdDev.toFixed(2)}%`);
      
      // Calculate Gaussian-based percentage boundaries
      const gaussianBoundaries = calculateGaussianBoundaries(mean, stdDev);
      console.log('Gaussian boundaries calculated:', gaussianBoundaries);
      
      // Assign grades to each student based on percentage scores with Gaussian boundaries
      Object.keys(studentGradeMapping).forEach(studentId => {
        const studentData = studentGradeMapping[studentId];
        const finalScore = studentData.score;
        
        console.log(`Student ${studentData.studentName} - Score: ${finalScore.toFixed(2)}%`);
        
        let letterGrade = "F";
        
        // Check grades from highest to lowest
        const sortedGrades = Object.entries(gaussianBoundaries).sort(([,a], [,b]) => b.min - a.min);
        
        for (const [gradeLabel, gradeData] of sortedGrades) {
          if (finalScore >= gradeData.min && (finalScore <= gradeData.max || gradeData.max === 100)) {
            letterGrade = gradeLabel;
            console.log(`  ✅ Assigned grade: ${letterGrade} (${gradeData.min}% - ${gradeData.max}%)`);
            break;
          }
        }
        
        studentGradeMapping[studentId].letterGrade = letterGrade;
      });
    }

    // Create histogram data (bins of 10%)
    const histogram = Array.from({ length: 10 }, (_, i) => ({
      range: `${i * 10}-${(i + 1) * 10}%`,
      count: 0,
      students: []
    }));

    // Count students in each bin and per letter grade
    const letterGradeCounts = {};
    Object.values(studentGradeMapping).forEach(student => {
      // Add to histogram
      const binIndex = Math.min(Math.floor(student.score / 10), 9);
      if (binIndex >= 0) {
        histogram[binIndex].count++;
        histogram[binIndex].students.push({
          name: student.studentName,
          score: Math.round(student.score * 100) / 100,
          letterGrade: student.letterGrade
        });
      }
      
      // Count letter grades
      letterGradeCounts[student.letterGrade] = (letterGradeCounts[student.letterGrade] || 0) + 1;
    });

    // Convert studentGradeMapping to array format for frontend
    const studentList = Object.entries(studentGradeMapping).map(([studentId, data]) => ({
      studentId: parseInt(studentId),
      name: data.studentName,
      finalGrade: Math.round(data.score * 100) / 100,
      letterGrade: data.letterGrade
    }));

    console.log(`Final results: ${Object.keys(studentGradeMapping).length} students processed`);
    console.log('Letter grade distribution:', letterGradeCounts);

    res.json({
      course: { name: course.name, code: course.code },
      gradingScale: getDefaultGradingScale(),
      distribution: histogram,
      studentCounts: letterGradeCounts,
      students: studentList,
      totalStudents: studentScores.length,
      letterGradesPublished: course.letterGradesPublished || false
    });
    
  } catch (error) {
    console.error("Error getting grade distribution:", error);
    res.status(500).json({ message: error.message });
  }
};

// Helper function to calculate Gaussian boundaries
function calculateGaussianBoundaries(mean, stdDev) {
  // If standard deviation is too small, use default percentage boundaries
  if (stdDev < 1) {
    console.log("Standard deviation too small, using default percentage boundaries");
    return getDefaultGradingScale();
  }

  // Calculate boundaries based on Gaussian distribution (sigma values)
  const boundaries = {
    'A+': { 
      min: Math.max(0, Math.min(100, mean + 2.0 * stdDev)), 
      max: 100,
      color: '#10B981'
    },
    'A': { 
      min: Math.max(0, Math.min(100, mean + 1.5 * stdDev)), 
      max: Math.max(0, Math.min(100, mean + 2.0 * stdDev)),
      color: '#34D399'
    },
    'A-': { 
      min: Math.max(0, Math.min(100, mean + 1.0 * stdDev)), 
      max: Math.max(0, Math.min(100, mean + 1.5 * stdDev)),
      color: '#6EE7B7'
    },
    'B+': { 
      min: Math.max(0, Math.min(100, mean + 0.5 * stdDev)), 
      max: Math.max(0, Math.min(100, mean + 1.0 * stdDev)),
      color: '#3B82F6'
    },
    'B': { 
      min: Math.max(0, Math.min(100, mean)), 
      max: Math.max(0, Math.min(100, mean + 0.5 * stdDev)),
      color: '#60A5FA'
    },
    'B-': { 
      min: Math.max(0, Math.min(100, mean - 0.5 * stdDev)), 
      max: Math.max(0, Math.min(100, mean)),
      color: '#93C5FD'
    },
    'C+': { 
      min: Math.max(0, Math.min(100, mean - 1.0 * stdDev)), 
      max: Math.max(0, Math.min(100, mean - 0.5 * stdDev)),
      color: '#F59E0B'
    },
    'C': { 
      min: Math.max(0, Math.min(100, mean - 1.5 * stdDev)), 
      max: Math.max(0, Math.min(100, mean - 1.0 * stdDev)),
      color: '#FBBF24'
    },
    'C-': { 
      min: Math.max(0, Math.min(100, mean - 2.0 * stdDev)), 
      max: Math.max(0, Math.min(100, mean - 1.5 * stdDev)),
      color: '#FCD34D'
    },
    'D': { 
      min: Math.max(0, Math.min(100, mean - 2.5 * stdDev)), 
      max: Math.max(0, Math.min(100, mean - 2.0 * stdDev)),
      color: '#EF4444'
    },
    'F': { 
      min: 0, 
      max: Math.max(0, Math.min(100, mean - 2.5 * stdDev)),
      color: '#DC2626'
    }
  };

  // Round boundaries to 2 decimal places
  Object.keys(boundaries).forEach(grade => {
    boundaries[grade].min = Math.round(boundaries[grade].min * 100) / 100;
    boundaries[grade].max = Math.round(boundaries[grade].max * 100) / 100;
  });

  return boundaries;
}

// Helper function to get default grading scale (percentage-based)
function getDefaultGradingScale() {
  return {
    'A+': { min: 97, max: 100, color: '#10B981' },
    'A': { min: 93, max: 97, color: '#34D399' },
    'A-': { min: 87, max: 93, color: '#6EE7B7' },
    'B+': { min: 83, max: 87, color: '#3B82F6' },
    'B': { min: 77, max: 83, color: '#60A5FA' },
    'B-': { min: 73, max: 77, color: '#93C5FD' },
    'C+': { min: 67, max: 73, color: '#F59E0B' },
    'C': { min: 63, max: 67, color: '#FBBF24' },
    'C-': { min: 57, max: 63, color: '#FCD34D' },
    'D': { min: 50, max: 57, color: '#EF4444' },
    'F': { min: 0, max: 50, color: '#DC2626' }
  };
}
  