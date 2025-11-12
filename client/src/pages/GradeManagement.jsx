import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function GradeManagement() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [grades, setGrades] = useState({}); // studentId -> marks object
  const [loading, setLoading] = useState(true);
  const [quizCount, setQuizCount] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/grades/${courseId}`);
        setCourse(res.data.course);
        setQuizCount(res.data.course.quizCount || 0);

        // Initialize grades - create deep copy to avoid shared references
        const g = {};
        res.data.studentGrades.forEach(student => {
          // Create a new object for each student to avoid shared references
          g[student._id] = { ...student.marks };
        });
        
        // Debug: Log each student's grade object reference
        console.log("Initialized grades for students:");
        Object.keys(g).forEach(studentId => {
          console.log(`Student ${studentId}:`, g[studentId]);
        });
        
        setGrades(g);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [courseId]);

  const handleChange = (studentId, key, value) => {
    console.log(`Changing grade for student ${studentId}, field ${key}, value ${value}`);
    setGrades(prev => {
      const updated = {
        ...prev,
        [studentId]: { 
          ...prev[studentId], 
          [key]: Number(value) || 0
        }
      };
      console.log(`Updated grades:`, updated);
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      console.log("=== SAVING GRADES ===");
      console.log("Total students:", Object.keys(grades).length);
      Object.keys(grades).forEach(studentId => {
        console.log(`Student ${studentId}:`, grades[studentId]);
      });
      
      await api.post(`/grades/${courseId}`, { grades });
  
      alert("Grades saved successfully!");
    } catch (err) {
      console.error("Error saving grades:", err);
      alert(err.response?.data?.message || "Error saving grades");
    }
  };

  const handleAddQuiz = async () => {
    if (quizCount >= 10) {
      alert("Maximum 10 quizzes allowed");
      return;
    }
    
    try {
      const newCount = quizCount + 1;
      await api.put(`/courses/${courseId}/quiz-count`, { quizCount: newCount });
      setQuizCount(newCount);
      setCourse({ ...course, quizCount: newCount });
      alert(`Quiz ${newCount} added successfully!`);
    } catch (err) {
      console.error("Error adding quiz:", err);
      alert(err.response?.data?.message || "Error adding quiz");
    }
  };

  const handleRemoveQuiz = async () => {
    if (quizCount <= 0) {
      alert("No quizzes to remove");
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to remove Quiz ${quizCount}? This will delete all grades for this quiz.`);
    if (!confirmed) return;
    
    try {
      const newCount = quizCount - 1;
      await api.put(`/courses/${courseId}/quiz-count`, { quizCount: newCount });
      setQuizCount(newCount);
      setCourse({ ...course, quizCount: newCount });
      
      // Clear the removed quiz grades from state
      const updatedGrades = { ...grades };
      Object.keys(updatedGrades).forEach(studentId => {
        updatedGrades[studentId][`quiz${quizCount}`] = 0;
      });
      setGrades(updatedGrades);
      
      alert(`Quiz ${quizCount} removed successfully!`);
    } catch (err) {
      console.error("Error removing quiz:", err);
      alert(err.response?.data?.message || "Error removing quiz");
    }
  };

  if (loading) return <p>Loading...</p>;

  // Get active components and expand quizzes if needed
  const getActiveComponents = () => {
    const components = [];
    Object.keys(course.policy).forEach(key => {
      if (course.policy[key] > 0) {
        if (key === 'quizzes' && quizCount > 0) {
          // Add individual quiz columns
          for (let i = 1; i <= quizCount; i++) {
            components.push(`quiz${i}`);
          }
        } else if (key !== 'quizzes') {
          components.push(key);
        }
      }
    });
    return components;
  };

  const activeComponents = getActiveComponents();
  const quizWeightPerQuiz = quizCount > 0 ? (course.policy.quizzes / quizCount).toFixed(2) : 0;

  return (
    <>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">{course.name} - Grade Management</h1>
        
        {/* Quiz Management Section */}
        {course.policy.quizzes > 0 && (
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg mb-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-blue-900">Quiz Management</h3>
                <p className="text-sm text-blue-700">
                  Total Quiz Weightage: {course.policy.quizzes}% | 
                  Active Quizzes: {quizCount} | 
                  Weight per Quiz: {quizWeightPerQuiz}%
                </p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleAddQuiz}
                  disabled={quizCount >= 10}
                  className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                  </svg>
                  Add Quiz
                </button>
                <button
                  onClick={handleRemoveQuiz}
                  disabled={quizCount <= 0}
                  className="flex items-center gap-1 bg-red-600 text-white px-3 py-2 rounded-lg hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                  </svg>
                  Remove Quiz
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeComponents.length === 0 ? (
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
            <p>⚠️ No active components in this course. Please edit the course to add grading components.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full border">
                <thead>
                  <tr>
                    <th className="border p-2 sticky left-0 bg-gray-100 z-10">Student</th>
                    {activeComponents.map(key => {
                      const isQuiz = key.startsWith('quiz');
                      const displayName = isQuiz ? key.toUpperCase().replace('QUIZ', 'Quiz ') : key.toUpperCase();
                      const weight = isQuiz ? quizWeightPerQuiz : course.policy[key];
                      
                      return (
                        <th key={key} className="border p-2">
                          {displayName}
                          <div className="text-xs font-normal text-gray-500">({weight}%)</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(grades).map(studentId => {
                    const student = course.students.find(s => s._id === studentId);
                    return (
                      <tr key={studentId}>
                        <td className="border p-2 sticky left-0 bg-white">
                          <div className="font-semibold">{student?.name}</div>
                          <div className="text-xs text-gray-500">{student?.email}</div>
                          <div className="text-xs text-gray-400 font-mono">ID: {studentId.slice(-6)}</div>
                        </td>
                        {activeComponents.map(key => (
                          <td key={key} className="border p-2">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={grades[studentId]?.[key] || 0}
                              onChange={(e) => handleChange(studentId, key, e.target.value)}
                              className="w-full border rounded p-1"
                              data-student-id={studentId}
                              data-field={key}
                            />
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              onClick={handleSave}
              className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Save Grades
            </button>
          </>
        )}
      </div>
    </>
  );
}
