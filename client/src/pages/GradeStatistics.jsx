import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function GradeStatistics() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [statistics, setStatistics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const res = await api.get(`/grades/${courseId}/statistics`);
        setCourse(res.data.course);
        setStatistics(res.data.statistics);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching statistics:", err);
        alert("Error loading statistics");
        setLoading(false);
      }
    };
    fetchStatistics();
  }, [courseId]);

  const getLetterGrade = (score, mean, stdDev) => {
    if (!stdDev || stdDev === 0) return "N/A";
    
    const zScore = (score - mean) / stdDev;
    
    // Gaussian distribution grading
    if (zScore >= 1.5) return "A+";
    if (zScore >= 1.0) return "A";
    if (zScore >= 0.5) return "A-";
    if (zScore >= 0.0) return "B";
    if (zScore >= -0.5) return "C";
    if (zScore >= -1.0) return "D";
    if (zScore >= -1.5) return "E";
    if (zScore >= -2.0) return "F";
    return "FAIL :)";
  };

  const getGradeColor = (grade) => {
    if (grade.startsWith("A")) return "text-green-600 bg-green-100";
    if (grade.startsWith("B")) return "text-blue-600 bg-blue-100";
    if (grade.startsWith("C")) return "text-yellow-600 bg-yellow-100";
    if (grade === "D" || grade === "E") return "text-orange-600 bg-orange-100";
    if (grade === "F" || grade === "FAIL :)") return "text-red-600 bg-red-100";
    return "text-red-600 bg-red-100";
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading statistics...</p>
          </div>
        </div>
      </>
    );
  }

  if (!statistics) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 p-8">
          <div className="bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg">
            <p>No statistics available. Please ensure grades have been entered.</p>
          </div>
        </div>
      </>
    );
  }

  const { assessmentStats, overallStats, studentGrades } = statistics;

  const handleToggleLetterGrades = async () => {
    try {
      const res = await api.put(`/courses/${courseId}/toggle-letter-grades`);
      setCourse(res.data.course);
      alert(res.data.message);
    } catch (err) {
      console.error("Error toggling letter grades:", err);
      alert(err.response?.data?.message || "Error toggling letter grades");
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate(`/professor/courses/${courseId}/grades`)}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Grade Management
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{course?.name} - Grade Statistics</h1>
                <p className="text-gray-600 mt-2">Comprehensive statistical analysis of course grades</p>
              </div>
              <button
                onClick={handleToggleLetterGrades}
                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-semibold transition-colors ${
                  course?.letterGradesPublished
                    ? 'bg-red-600 hover:bg-red-700 text-white'
                    : 'bg-green-600 hover:bg-green-700 text-white'
                }`}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {course?.letterGradesPublished ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                  )}
                </svg>
                {course?.letterGradesPublished ? 'Unpublish Letter Grades' : 'Publish Letter Grades'}
              </button>
            </div>
          </div>

          {/* Status Badge */}
          {course?.letterGradesPublished && (
            <div className="mb-6 bg-green-50 border border-green-200 text-green-800 p-4 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Letter grades are currently published and visible to students</span>
            </div>
          )}

          {!course?.letterGradesPublished && (
            <div className="mb-6 bg-yellow-50 border border-yellow-200 text-yellow-800 p-4 rounded-lg flex items-center gap-2">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              <span className="font-semibold">Letter grades are not published. Students will see "Not Published"</span>
            </div>
          )}

          {/* Overall Statistics Card */}
          <div className="bg-gradient-to-r from-purple-500 to-indigo-600 rounded-2xl shadow-xl p-8 mb-8 text-white">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-bold">Overall Course Statistics</h2>
                <p className="text-purple-100 mt-1">Aggregated weighted scores across all assessments</p>
              </div>
              <div className="bg-white/20 rounded-full p-4">
                <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-purple-100 text-sm mb-1">Mean</p>
                <p className="text-3xl font-bold">{overallStats.mean.toFixed(2)}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-purple-100 text-sm mb-1">Median</p>
                <p className="text-3xl font-bold">{overallStats.median.toFixed(2)}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-purple-100 text-sm mb-1">Std. Deviation</p>
                <p className="text-3xl font-bold">{overallStats.stdDev.toFixed(2)}</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-purple-100 text-sm mb-1">Maximum</p>
                <p className="text-3xl font-bold">{overallStats.max.toFixed(2)}%</p>
              </div>
              <div className="bg-white/10 backdrop-blur rounded-xl p-4">
                <p className="text-purple-100 text-sm mb-1">Minimum</p>
                <p className="text-3xl font-bold">{overallStats.min.toFixed(2)}%</p>
              </div>
            </div>
          </div>

          {/* Assessment-wise Statistics */}
          <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-6">Assessment-wise Statistics</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {Object.entries(assessmentStats).map(([assessment, stats]) => {
                const displayName = assessment.startsWith('quiz')
                  ? assessment.replace('quiz', 'Quiz ')
                  : assessment.startsWith('assignment')
                  ? assessment.replace('assignment', 'Assignment ')
                  : assessment.charAt(0).toUpperCase() + assessment.slice(1);

                return (
                  <div key={assessment} className="border border-gray-200 rounded-xl p-5 hover:shadow-lg transition-shadow">
                    <h3 className="font-bold text-lg text-gray-800 mb-4 capitalize">{displayName}</h3>
                    <div className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Mean:</span>
                        <span className="font-semibold text-gray-800">{stats.mean.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Median:</span>
                        <span className="font-semibold text-gray-800">{stats.median.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Std. Dev:</span>
                        <span className="font-semibold text-gray-800">{stats.stdDev.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Maximum:</span>
                        <span className="font-semibold text-green-600">{stats.max.toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">Minimum:</span>
                        <span className="font-semibold text-red-600">{stats.min.toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Grade Distribution with Letter Grades */}
          <div className="bg-white rounded-2xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Grade Distribution (Gaussian Curve)</h2>
            <p className="text-gray-600 mb-6">Letter grades assigned using standard deviation from mean</p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left font-semibold text-gray-700">Student Name</th>
                    <th className="p-3 text-center font-semibold text-gray-700">Weighted Score</th>
                    <th className="p-3 text-center font-semibold text-gray-700">Z-Score</th>
                    <th className="p-3 text-center font-semibold text-gray-700">Letter Grade</th>
                  </tr>
                </thead>
                <tbody>
                  {studentGrades.map((student, idx) => {
                    const letterGrade = getLetterGrade(
                      student.weightedScore,
                      overallStats.mean,
                      overallStats.stdDev
                    );
                    const zScore = overallStats.stdDev !== 0
                      ? ((student.weightedScore - overallStats.mean) / overallStats.stdDev).toFixed(2)
                      : "N/A";

                    return (
                      <tr key={idx} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="p-3 text-gray-800">{student.name}</td>
                        <td className="p-3 text-center font-semibold text-gray-800">
                          {student.weightedScore.toFixed(2)}%
                        </td>
                        <td className="p-3 text-center text-gray-600">{zScore}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-block px-3 py-1 rounded-full font-bold text-sm ${getGradeColor(letterGrade)}`}>
                            {letterGrade}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Grading Scale Legend */}
            <div className="mt-6 p-4 bg-gray-50 rounded-xl">
              <h3 className="font-bold text-gray-800 mb-3">Grading Scale (Based on Standard Deviation)</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                <div className="text-center">
                  <div className="bg-green-100 text-green-600 font-bold py-2 rounded-lg mb-1">A+</div>
                  <p className="text-xs text-gray-600">≥ 1.5σ</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 text-green-600 font-bold py-2 rounded-lg mb-1">A</div>
                  <p className="text-xs text-gray-600">≥ 1.0σ</p>
                </div>
                <div className="text-center">
                  <div className="bg-green-100 text-green-600 font-bold py-2 rounded-lg mb-1">A-</div>
                  <p className="text-xs text-gray-600">≥ 0.5σ</p>
                </div>
                <div className="text-center">
                  <div className="bg-blue-100 text-blue-600 font-bold py-2 rounded-lg mb-1">B</div>
                  <p className="text-xs text-gray-600">≥ 0.0σ</p>
                </div>
                <div className="text-center">
                  <div className="bg-yellow-100 text-yellow-600 font-bold py-2 rounded-lg mb-1">C</div>
                  <p className="text-xs text-gray-600">≥ -0.5σ</p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 text-orange-600 font-bold py-2 rounded-lg mb-1">D</div>
                  <p className="text-xs text-gray-600">≥ -1.0σ</p>
                </div>
                <div className="text-center">
                  <div className="bg-orange-100 text-orange-600 font-bold py-2 rounded-lg mb-1">E</div>
                  <p className="text-xs text-gray-600">≥ -1.5σ</p>
                </div>
                <div className="text-center">
                  <div className="bg-red-100 text-red-600 font-bold py-2 rounded-lg mb-1">F</div>
                  <p className="text-xs text-gray-600">≥ -2.0σ</p>
                </div>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">σ = Standard Deviation from Mean</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
