import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";

export default function StudentGrades() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [grades, setGrades] = useState(null);
  const [gradeId, setGradeId] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(`http://localhost:5000/api/grades/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        const { course, studentGrades } = res.data;
        setCourseName(course?.name || "Course");

        if (Array.isArray(studentGrades) && studentGrades.length > 0) {
          setGrades(studentGrades[0].marks);
          setGradeId(studentGrades[0]._id); // Store grade ID for challenges
        } else {
          setGrades(null);
        }
      } catch (err) {
        console.error("Error fetching grades:", err);
        setGrades(null);
      } finally {
        setLoading(false);
      }
    };

    fetchGrades();
  }, [courseId]);

  const calculateAverage = (gradesObj) => {
    if (!gradesObj) return 0;
    const values = Object.values(gradesObj).filter(v => typeof v === 'number');
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  };

  const getGradeColor = (score) => {
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 80) return "text-blue-600 bg-blue-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    if (score >= 60) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getLetterGrade = (score) => {
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "F";
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading grades...</p>
          </div>
        </div>
      </>
    );
  }

  const average = calculateAverage(grades);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-indigo-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <button
              onClick={() => navigate('/student/courses')}
              className="flex items-center text-indigo-600 hover:text-indigo-700 mb-4 transition-colors"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Courses
            </button>

            <div className="bg-white rounded-2xl shadow-lg p-8">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">{courseName}</h1>
                  <p className="text-gray-600">Academic Performance Report</p>
                </div>
                <div className="flex items-center space-x-4">
                  {grades && gradeId && (
                    <button
                      onClick={() => navigate(`/student/challenge/${gradeId}`)}
                      className="flex items-center space-x-2 px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors font-medium"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span>Challenge Grade</span>
                    </button>
                  )}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center">
                    <div className="text-3xl font-bold">{average}</div>
                    <div className="text-sm opacity-90">Average</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Grades Display */}
          {grades ? (
            <>
              {/* Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Total Assessments</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{Object.keys(grades).length}</p>
                    </div>
                    <div className="bg-blue-100 rounded-full p-3">
                      <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Letter Grade</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{getLetterGrade(average)}</p>
                    </div>
                    <div className={`rounded-full p-3 ${getGradeColor(average)}`}>
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Status</p>
                      <p className="text-lg font-bold text-green-600 mt-1">
                        {average >= 60 ? 'Passing' : 'Needs Improvement'}
                      </p>
                    </div>
                    <div className={`rounded-full p-3 ${average >= 60 ? 'bg-green-100' : 'bg-red-100'}`}>
                      <svg className={`w-8 h-8 ${average >= 60 ? 'text-green-600' : 'text-red-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={average >= 60 ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"} />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Detailed Grades */}
              <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
                  <h2 className="text-xl font-bold text-white">Detailed Breakdown</h2>
                </div>
                
                <div className="p-6">
                  <div className="space-y-4">
                    {Object.entries(grades).map(([key, value], index) => {
                      const score = typeof value === 'number' ? value : 0;
                      return (
                        <div key={index} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors">
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div className="bg-indigo-100 rounded-lg p-2">
                                <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                </svg>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold text-gray-900 capitalize">
                                  {key.replace(/_/g, ' ')}
                                </h3>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-4">
                              <span className={`px-4 py-2 rounded-full text-sm font-bold ${getGradeColor(score)}`}>
                                {getLetterGrade(score)}
                              </span>
                              <span className="text-3xl font-bold text-gray-900">{value}</span>
                              <span className="text-gray-500 text-sm">/100</span>
                            </div>
                          </div>
                          
                          {/* Progress Bar */}
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div 
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                              style={{ width: `${score}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
              <div className="bg-gray-100 rounded-full w-24 h-24 flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">No Grades Available</h3>
              <p className="text-gray-600 mb-6">Your professor hasn't posted any grades for this course yet.</p>
              <p className="text-sm text-gray-500">Check back later or contact your professor for more information.</p>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
