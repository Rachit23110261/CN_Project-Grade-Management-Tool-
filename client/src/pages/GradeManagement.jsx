import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import Papa from "papaparse";

export default function GradeManagement() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [grades, setGrades] = useState({}); // studentId -> marks object
  const [loading, setLoading] = useState(true);
  const [quizCount, setQuizCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [uploadResult, setUploadResult] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [showMaxMarksModal, setShowMaxMarksModal] = useState(false);
  const [maxMarks, setMaxMarks] = useState({});

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/grades/${courseId}`);
        setCourse(res.data.course);
        setQuizCount(res.data.course.quizCount || 0);
        setAssignmentCount(res.data.course.assignmentCount || 0);
        setMaxMarks(res.data.course.maxMarks || {});

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

  const handleCSVUpload = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    setUploading(true);
    setUploadResult(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await api.post(`/grades/${courseId}/upload-csv`, {
            csvData: results.data
          });

          setUploadResult(response.data);
          
          // Refresh grades after successful upload
          const res = await api.get(`/grades/${courseId}`);
          const g = {};
          res.data.studentGrades.forEach(student => {
            g[student._id] = { ...student.marks };
          });
          setGrades(g);

          alert(`Grades uploaded successfully!\nUpdated: ${response.data.successCount} students\nSkipped: ${response.data.skippedCount} entries`);
        } catch (err) {
          console.error("Error uploading CSV:", err);
          alert(err.response?.data?.message || "Error uploading CSV");
        } finally {
          setUploading(false);
          event.target.value = ""; // Reset file input
        }
      },
      error: (error) => {
        console.error("Error parsing CSV:", error);
        alert("Error parsing CSV file. Please check the format.");
        setUploading(false);
        event.target.value = "";
      }
    });
  };

  const downloadSampleCSV = () => {
    // Create sample CSV content
    const headers = ["Name", "Email"];
    
    // Add active assessment columns
    if (course.policy.midsem > 0) headers.push("Midsem");
    if (course.policy.endsem > 0) headers.push("Endsem");
    
    // Add quiz columns based on quizCount
    for (let i = 1; i <= quizCount; i++) {
      headers.push(`Quiz ${i}`);
    }
    
    if (course.policy.project > 0) headers.push("Project");
    if (course.policy.assignment > 0) headers.push("Assignment");
    if (course.policy.attendance > 0) headers.push("Attendance");
    if (course.policy.participation > 0) headers.push("Participation");

    // Add sample row
    const sampleRow = ["John Doe", "john@example.com"];
    for (let i = 2; i < headers.length; i++) {
      sampleRow.push("0");
    }

    const csvContent = [headers.join(","), sampleRow.join(",")].join("\n");
    
    // Create download link
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${course.name}_sample.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const handleMaxMarksChange = (key, value) => {
    setMaxMarks(prev => ({
      ...prev,
      [key]: Number(value) || 100
    }));
  };

  const handleSaveMaxMarks = async () => {
    try {
      // Ensure all values are valid numbers
      const validatedMaxMarks = {};
      Object.keys(maxMarks).forEach(key => {
        const value = Number(maxMarks[key]);
        if (!isNaN(value) && value > 0) {
          validatedMaxMarks[key] = value;
        }
      });

      console.log("Sending maxMarks:", validatedMaxMarks);

      const response = await api.put(`/courses/${courseId}/max-marks`, { maxMarks: validatedMaxMarks });
      
      // Update local state with the response
      setCourse(response.data.course);
      setMaxMarks(response.data.course.maxMarks || validatedMaxMarks);
      setShowMaxMarksModal(false);
      alert("Max marks updated successfully!");
    } catch (err) {
      console.error("Error updating max marks:", err);
      console.error("Error details:", err.response?.data);
      alert(err.response?.data?.message || "Error updating max marks");
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
        } else if (key === 'assignment' && assignmentCount > 0) {
          // Add individual assignment columns
          for (let i = 1; i <= assignmentCount; i++) {
            components.push(`assignment${i}`);
          }
        } else if (key !== 'quizzes' && key !== 'assignment') {
          components.push(key);
        }
      }
    });
    return components;
  };

  const activeComponents = getActiveComponents();
  const quizWeightPerQuiz = quizCount > 0 ? (course.policy.quizzes / quizCount).toFixed(2) : 0;
  const assignmentWeightPerAssignment = assignmentCount > 0 ? (course.policy.assignment / assignmentCount).toFixed(2) : 0;

  return (
    <>
      <Navbar />
      <div className="p-8">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-2xl font-bold">{course.name} - Grade Management</h1>
          <div className="flex gap-3">
            <button
              onClick={async () => {
                try {
                  const res = await api.put(`/courses/${courseId}/toggle-letter-grades`);
                  setCourse(res.data.course);
                  alert(res.data.message);
                } catch (err) {
                  console.error("Error toggling letter grades:", err);
                  alert(err.response?.data?.message || "Error toggling letter grades");
                }
              }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg font-semibold transition-colors ${
                course?.letterGradesPublished
                  ? 'bg-red-600 hover:bg-red-700 text-white'
                  : 'bg-amber-600 hover:bg-amber-700 text-white'
              }`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {course?.letterGradesPublished ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                )}
              </svg>
              {course?.letterGradesPublished ? 'Unpublish Grades' : 'Publish Grades'}
            </button>
            <button
              onClick={() => navigate(`/professor/courses/${courseId}/statistics`)}
              className="flex items-center gap-2 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              View Statistics
            </button>
            <button
              onClick={() => setShowMaxMarksModal(true)}
              className="flex items-center gap-2 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Set Max Marks
            </button>
          </div>
        </div>
        
        {/* Status Badge for Letter Grades */}
        {course?.letterGradesPublished && (
          <div className="mb-4 bg-green-50 border border-green-200 text-green-800 p-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Letter grades are published and visible to students</span>
          </div>
        )}
        
        {!course?.letterGradesPublished && (
          <div className="mb-4 bg-yellow-50 border border-yellow-200 text-yellow-800 p-3 rounded-lg flex items-center gap-2">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <span className="font-semibold">Letter grades are not published. Students will see "Not Published"</span>
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
                      const isAssignment = key.startsWith('assignment');
                      let displayName;
                      let weight;
                      
                      if (isQuiz) {
                        displayName = key.toUpperCase().replace('QUIZ', 'Quiz ');
                        weight = quizWeightPerQuiz;
                      } else if (isAssignment) {
                        displayName = key.toUpperCase().replace('ASSIGNMENT', 'Assignment ');
                        weight = assignmentWeightPerAssignment;
                      } else {
                        displayName = key.toUpperCase();
                        weight = course.policy[key];
                      }
                      
                      const max = maxMarks[key] || 100;
                      
                      return (
                        <th key={key} className="border p-2">
                          {displayName}
                          <div className="text-xs font-normal text-gray-500">({weight}%)</div>
                          <div className="text-xs font-normal text-blue-600">Max: {max}</div>
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
                        {activeComponents.map(key => {
                          const max = maxMarks[key] || 100;
                          return (
                            <td key={key} className="border p-2">
                              <input
                                type="number"
                                min={0}
                                max={max}
                                value={grades[studentId]?.[key] || 0}
                                onChange={(e) => handleChange(studentId, key, e.target.value)}
                                className="w-full border rounded p-1"
                                data-student-id={studentId}
                                data-field={key}
                              />
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* CSV Upload Section */}
            <div className="bg-green-50 border border-green-200 p-4 rounded-lg mt-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-green-900">Bulk Upload Grades</h3>
                  <p className="text-sm text-green-700">
                    Upload a CSV file to update grades for multiple students at once
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={downloadSampleCSV}
                    className="flex items-center gap-1 bg-green-600 text-white px-3 py-2 rounded-lg hover:bg-green-700"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Download Sample CSV
                  </button>
                  <label className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-lg hover:bg-blue-700 cursor-pointer">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    {uploading ? "Uploading..." : "Upload CSV"}
                    <input
                      type="file"
                      accept=".csv"
                      onChange={handleCSVUpload}
                      disabled={uploading}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Upload Result Display */}
            {uploadResult && uploadResult.skippedEntries.length > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg mb-4">
                <h3 className="font-semibold text-yellow-900 mb-2">
                  Upload Summary: {uploadResult.successCount} updated, {uploadResult.skippedCount} skipped
                </h3>
                <div className="text-sm text-yellow-800">
                  <p className="font-semibold mb-2">Skipped Entries:</p>
                  <div className="max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead>
                        <tr className="bg-yellow-100">
                          <th className="border border-yellow-300 p-1">Name</th>
                          <th className="border border-yellow-300 p-1">Email</th>
                          <th className="border border-yellow-300 p-1">Reason</th>
                        </tr>
                      </thead>
                      <tbody>
                        {uploadResult.skippedEntries.map((entry, idx) => (
                          <tr key={idx}>
                            <td className="border border-yellow-300 p-1">{entry.name || "-"}</td>
                            <td className="border border-yellow-300 p-1">{entry.email || "-"}</td>
                            <td className="border border-yellow-300 p-1">{entry.reason}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={handleSave}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
            >
              Save Grades
            </button>
          </>
        )}
      </div>

      {/* Max Marks Modal */}
      {showMaxMarksModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setShowMaxMarksModal(false)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">Set Maximum Marks</h3>
                <p className="text-purple-100 text-sm">Configure max marks for each assessment</p>
              </div>
              <button
                onClick={() => setShowMaxMarksModal(false)}
                className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 gap-4">
                {activeComponents.map(key => {
                  const isQuiz = key.startsWith('quiz');
                  const displayName = isQuiz ? key.toUpperCase().replace('QUIZ', 'Quiz ') : key.toUpperCase();
                  const weight = isQuiz ? quizWeightPerQuiz : course.policy[key];
                  
                  return (
                    <div key={key} className="bg-gray-50 rounded-lg p-4">
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {displayName}
                        <span className="text-gray-500 text-xs ml-2">({weight}% weightage)</span>
                      </label>
                      <input
                        type="number"
                        min={1}
                        value={maxMarks[key] || 100}
                        onChange={(e) => handleMaxMarksChange(key, e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        placeholder="100"
                      />
                    </div>
                  );
                })}
              </div>

              <div className="mt-6 flex justify-end gap-3">
                <button
                  onClick={() => setShowMaxMarksModal(false)}
                  className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveMaxMarks}
                  className="px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition"
                >
                  Save Max Marks
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
