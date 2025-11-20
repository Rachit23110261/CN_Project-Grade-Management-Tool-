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
  const [showGradingScaleModal, setShowGradingScaleModal] = useState(false);
  const [gradingScale, setGradingScale] = useState({});

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const res = await api.get(`/grades/${courseId}/statistics`);
        setCourse(res.data.course);
        setStatistics(res.data.statistics);
        
        // Initialize grading scale based on grading scheme
        if (res.data.course.gradingScale) {
          setGradingScale(res.data.course.gradingScale);
        } else {
          // Set default based on grading scheme
          if (res.data.course.gradingScheme === 'absolute') {
            setGradingScale({
              "A+": { min: 95, max: 100 },
              "A": { min: 90, max: 94.99 },
              "A-": { min: 85, max: 89.99 },
              "B+": { min: 80, max: 84.99 },
              "B": { min: 75, max: 79.99 },
              "B-": { min: 70, max: 74.99 },
              "C+": { min: 65, max: 69.99 },
              "C": { min: 60, max: 64.99 },
              "C-": { min: 55, max: 59.99 },
              "D": { min: 50, max: 54.99 },
              "F": { min: 0, max: 49.99 }
            });
          } else {
            setGradingScale({
              "A+": 1.5,
              "A": 1.0,
              "A-": 0.5,
              "B": 0.0,
              "C": -0.5,
              "D": -1.0,
              "E": -1.5,
              "F": -2.0
            });
          }
        }
        
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
    if (course?.gradingScheme === 'absolute' && gradingScale) {
      // Absolute grading: use percentage ranges
      let letterGrade = "F";
      for (const [grade, range] of Object.entries(gradingScale)) {
        if (typeof range === 'object' && range.min !== undefined && range.max !== undefined) {
          if (score >= range.min && score <= range.max) {
            letterGrade = grade;
            break;
          }
        }
      }
      return letterGrade;
    } else {
      // Relative grading: use z-score
      if (!stdDev || stdDev === 0) return "N/A";
      
      const zScore = (score - mean) / stdDev;
      
      // Use gradingScale if available, otherwise use defaults
      if (gradingScale && typeof Object.values(gradingScale)[0] === 'number') {
        const sortedGrades = Object.entries(gradingScale).sort((a, b) => b[1] - a[1]);
        for (const [grade, threshold] of sortedGrades) {
          if (zScore >= threshold) {
            return grade;
          }
        }
        return "F";
      }
      
      // Default Gaussian distribution grading
      if (zScore >= 1.5) return "A+";
      if (zScore >= 1.0) return "A";
      if (zScore >= 0.5) return "A-";
      if (zScore >= 0.0) return "B";
      if (zScore >= -0.5) return "C";
      if (zScore >= -1.0) return "D";
      if (zScore >= -1.5) return "E";
      if (zScore >= -2.0) return "F";
      return "FAIL :)";
    }
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

  const handleGradingScaleChange = (grade, field, value) => {
    const numValue = Number(value);
    
    if (course?.gradingScheme === 'relative') {
      setGradingScale(prev => ({
        ...prev,
        [grade]: numValue
      }));
    } else {
      setGradingScale(prev => ({
        ...prev,
        [grade]: {
          ...prev[grade],
          [field]: numValue
        }
      }));
    }
  };

  const handleSaveGradingScale = async () => {
    try {
      const response = await api.put(`/courses/${courseId}/grading-scale`, { gradingScale });
      setCourse(response.data.course);
      setGradingScale(response.data.course.gradingScale);
      setShowGradingScaleModal(false);
      alert("Grading scale updated successfully!");
    } catch (err) {
      console.error("Error updating grading scale:", err);
      alert(err.response?.data?.message || "Error updating grading scale");
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
              onClick={() => navigate('/professor/courses')}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Professor Dashboard
            </button>
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{course?.name} - Grade Statistics</h1>
                <p className="text-gray-600 mt-2">Comprehensive statistical analysis of course grades</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowGradingScaleModal(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-semibold transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Configure Grading Scale
                </button>
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
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Grade Distribution {course?.gradingScheme === 'absolute' ? '(Absolute Ranges)' : '(Gaussian Curve)'}
            </h2>
            <p className="text-gray-600 mb-6">
              {course?.gradingScheme === 'absolute' 
                ? 'Letter grades assigned using custom percentage ranges' 
                : 'Letter grades assigned using standard deviation from mean'}
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="p-3 text-left font-semibold text-gray-700">Student Name</th>
                    <th className="p-3 text-center font-semibold text-gray-700">Weighted Score</th>
                    {course?.gradingScheme !== 'absolute' && (
                      <th className="p-3 text-center font-semibold text-gray-700">Z-Score</th>
                    )}
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
                        {course?.gradingScheme !== 'absolute' && (
                          <td className="p-3 text-center text-gray-600">{zScore}</td>
                        )}
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
              <h3 className="font-bold text-gray-800 mb-3">
                {course?.gradingScheme === 'absolute' 
                  ? 'Grading Scale (Based on Percentage Ranges)' 
                  : 'Grading Scale (Based on Standard Deviation)'}
              </h3>
              {course?.gradingScheme === 'absolute' ? (
                // Absolute grading legend
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {Object.entries(gradingScale).sort((a, b) => {
                    const aMin = typeof a[1] === 'object' ? a[1].min : 0;
                    const bMin = typeof b[1] === 'object' ? b[1].min : 0;
                    return bMin - aMin;
                  }).map(([grade, range]) => (
                    <div key={grade} className="text-center">
                      <div className={`font-bold py-2 rounded-lg mb-1 ${getGradeColor(grade)}`}>
                        {grade}
                      </div>
                      <p className="text-xs text-gray-600">
                        {typeof range === 'object' ? `${range.min}% - ${range.max}%` : 'N/A'}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                // Relative grading legend
                <>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
                    {Object.entries(gradingScale)
                      .filter(([_, value]) => typeof value === 'number')
                      .sort((a, b) => b[1] - a[1])
                      .map(([grade, threshold]) => (
                        <div key={grade} className="text-center">
                          <div className={`font-bold py-2 rounded-lg mb-1 ${getGradeColor(grade)}`}>
                            {grade}
                          </div>
                          <p className="text-xs text-gray-600">≥ {threshold}σ</p>
                        </div>
                      ))}
                  </div>
                  <p className="text-xs text-gray-500 mt-3 text-center">σ = Standard Deviation from Mean</p>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Grading Scale Modal */}
        {showGradingScaleModal && (
          <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowGradingScaleModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-gradient-to-r from-indigo-600 to-blue-600 px-6 py-4 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white">Grading Scale Configuration</h3>
                  <p className="text-indigo-100 text-sm">
                    {course?.gradingScheme === 'absolute' 
                      ? 'Set percentage ranges for letter grades' 
                      : 'Set Z-score thresholds for letter grades'}
                  </p>
                </div>
                <button
                  onClick={() => setShowGradingScaleModal(false)}
                  className="text-white hover:bg-white hover:bg-opacity-20 rounded-full p-2 transition"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="p-6">
                <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-2">
                    <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    <div className="flex-1">
                      {course?.gradingScheme === 'absolute' ? (
                        <>
                          <h4 className="font-semibold text-blue-900 mb-1">About Absolute Grading</h4>
                          <p className="text-sm text-blue-700">
                            Set fixed percentage ranges for each grade. Students scoring within the range will receive that grade.
                            Ensure ranges don't overlap and cover all possible scores (0-100%).
                          </p>
                        </>
                      ) : (
                        <>
                          <h4 className="font-semibold text-blue-900 mb-1">About Z-Score Grading</h4>
                          <p className="text-sm text-blue-700">
                            Z-scores measure how many standard deviations a student's score is from the mean. 
                            Higher thresholds = stricter grading. Default values follow standard bell curve distribution.
                          </p>
                        </>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  {course?.gradingScheme === 'absolute' ? (
                    // Absolute grading: Show min/max percentage ranges
                    Object.entries(gradingScale).sort((a, b) => {
                      const aMin = typeof a[1] === 'object' ? a[1].min : 0;
                      const bMin = typeof b[1] === 'object' ? b[1].min : 0;
                      return bMin - aMin;
                    }).map(([grade, range]) => (
                      <div key={grade} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center gap-4 mb-2">
                          <div className="flex-shrink-0 w-16 text-center">
                            <span className="text-2xl font-bold text-gray-900">{grade}</span>
                          </div>
                          <div className="flex-1 text-sm text-gray-600">
                            Percentage Range
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Minimum %
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={typeof range === 'object' ? range.min : 0}
                              onChange={(e) => handleGradingScaleChange(grade, 'min', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-gray-700 mb-1">
                              Maximum %
                            </label>
                            <input
                              type="number"
                              step="0.01"
                              min="0"
                              max="100"
                              value={typeof range === 'object' ? range.max : 100}
                              onChange={(e) => handleGradingScaleChange(grade, 'max', e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    // Relative grading: Show z-score thresholds
                    Object.entries(gradingScale)
                      .filter(([_, value]) => typeof value === 'number')
                      .sort((a, b) => b[1] - a[1])
                      .map(([grade, threshold]) => (
                        <div key={grade} className="flex items-center gap-4 bg-gray-50 rounded-lg p-4">
                          <div className="flex-shrink-0 w-16 text-center">
                            <span className="text-2xl font-bold text-gray-900">{grade}</span>
                          </div>
                          <div className="flex-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                              Z-Score Threshold
                            </label>
                            <input
                              type="number"
                              step="0.1"
                              value={threshold}
                              onChange={(e) => handleGradingScaleChange(grade, null, e.target.value)}
                              className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                            />
                          </div>
                          <div className="flex-shrink-0 text-sm text-gray-500">
                            σ ≥ {threshold}
                          </div>
                        </div>
                      ))
                  )}
                </div>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-2">
                    {course?.gradingScheme === 'absolute' ? 'Example Ranges:' : 'Standard Values Reference:'}
                  </h4>
                  {course?.gradingScheme === 'absolute' ? (
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>• A+: 95-100%</div>
                      <div>• B+: 80-84.99%</div>
                      <div>• A: 90-94.99%</div>
                      <div>• B: 75-79.99%</div>
                      <div>• A-: 85-89.99%</div>
                      <div>• B-: 70-74.99%</div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
                      <div>• A+: 1.5σ (Top 7%)</div>
                      <div>• B: 0.0σ (Average)</div>
                      <div>• A: 1.0σ (Top 16%)</div>
                      <div>• C: -0.5σ (Below avg)</div>
                      <div>• A-: 0.5σ (Above avg)</div>
                      <div>• D: -1.0σ (Bottom 16%)</div>
                    </div>
                  )}
                </div>

                <div className="mt-6 flex justify-end gap-3">
                  <button
                    onClick={() => {
                      if (course?.gradingScheme === 'absolute') {
                        setGradingScale({
                          "A+": { min: 95, max: 100 },
                          "A": { min: 90, max: 94.99 },
                          "A-": { min: 85, max: 89.99 },
                          "B+": { min: 80, max: 84.99 },
                          "B": { min: 75, max: 79.99 },
                          "B-": { min: 70, max: 74.99 },
                          "C+": { min: 65, max: 69.99 },
                          "C": { min: 60, max: 64.99 },
                          "C-": { min: 55, max: 59.99 },
                          "D": { min: 50, max: 54.99 },
                          "F": { min: 0, max: 49.99 }
                        });
                      } else {
                        setGradingScale({
                          "A+": 1.5,
                          "A": 1.0,
                          "A-": 0.5,
                          "B": 0.0,
                          "C": -0.5,
                          "D": -1.0,
                          "E": -1.5,
                          "F": -2.0
                        });
                      }
                    }}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Reset to Default
                  </button>
                  <button
                    onClick={() => setShowGradingScaleModal(false)}
                    className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSaveGradingScale}
                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition"
                  >
                    Save Grading Scale
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
