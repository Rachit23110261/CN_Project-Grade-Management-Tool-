import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function StudentGrades() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [grades, setGrades] = useState(null);
  const [gradeId, setGradeId] = useState(null);
  const [courseName, setCourseName] = useState("");
  const [coursePolicy, setCoursePolicy] = useState({});
  const [quizCount, setQuizCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [maxMarks, setMaxMarks] = useState({});
  const [letterGrade, setLetterGrade] = useState(null);
  const [letterGradesPublished, setLetterGradesPublished] = useState(false);
  const [challengeCount, setChallengeCount] = useState(0);
  const [maxChallenges, setMaxChallenges] = useState(5);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        // Use student-specific endpoint
        const res = await api.get(`/grades/student/${courseId}`);

        const { course, studentGrades } = res.data;
        setCourseName(course?.name || "Course");
        setCoursePolicy(course?.policy || {});
        setQuizCount(course?.quizCount || 0);
        setAssignmentCount(course?.assignmentCount || 0);
        setMaxMarks(course?.maxMarks || {});
        setLetterGradesPublished(course?.letterGradesPublished || false);
        setLetterGrade(res.data.letterGrade || null);

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

  useEffect(() => {
    const fetchChallengeCount = async () => {
      try {
        const res = await api.get(`/challenges/count/${courseId}`);
        setChallengeCount(res.data.count);
        setMaxChallenges(res.data.maxChallenges);
      } catch (err) {
        console.error("Error fetching challenge count:", err);
      }
    };

    if (courseId) {
      fetchChallengeCount();
    }
  }, [courseId]);

  // Filter assessments to only show those with policy > 0 AND score > 0
  const getVisibleAssessments = () => {
    if (!grades || !coursePolicy) return [];
    const visible = [];
    
    Object.entries(grades).forEach(([key, value]) => {
      const score = typeof value === 'number' ? value : 0;
      
      // Skip the main 'quizzes' key as we'll show individual quizzes
      if (key === 'quizzes') return;
      
      // Handle individual quiz grades
      if (key.startsWith('quiz')) {
        const quizNum = parseInt(key.replace('quiz', ''));
        if (quizNum <= quizCount && score > 0) {
          visible.push([key, value]);
        }
      } else if (key.startsWith('assignment')) {
        // Handle individual assignment grades
        const assignmentNum = parseInt(key.replace('assignment', ''));
        if (assignmentNum <= assignmentCount && score > 0) {
          visible.push([key, value]);
        }
      } else {
        // Handle other assessments
        const policyWeight = coursePolicy[key] || 0;
        if (policyWeight > 0 && score > 0) {
          visible.push([key, value]);
        }
      }
    });
    
    return visible;
  };

  // Calculate weighted score contribution for an assessment
  const calculateWeightedScore = (score, key) => {
    let policyWeight;
    
    if (key.startsWith('quiz')) {
      // For individual quizzes, divide total quiz weight by quiz count
      policyWeight = quizCount > 0 ? (coursePolicy.quizzes / quizCount) : 0;
    } else if (key.startsWith('assignment')) {
      // For individual assignments, divide total assignment weight by assignment count
      policyWeight = assignmentCount > 0 ? (coursePolicy.assignment / assignmentCount) : 0;
    } else {
      policyWeight = coursePolicy[key] || 0;
    }
    
    // Get max marks for this assessment (default to 100 if not set)
    const max = maxMarks[key] || 100;
    
    // Calculate weighted contribution: (score / maxMarks) * policyWeight
    return (score / max) * policyWeight;
  };

  // Calculate total weighted score
  const calculateTotalWeightedScore = () => {
    const visibleAssessments = getVisibleAssessments();
    if (visibleAssessments.length === 0) return 0;
    
    return visibleAssessments.reduce((total, [key, value]) => {
      const score = typeof value === 'number' ? value : 0;
      return total + calculateWeightedScore(score, key);
    }, 0).toFixed(2);
  };

  const calculateAverage = (gradesObj) => {
    if (!gradesObj) return 0;
    const values = Object.values(gradesObj).filter(v => typeof v === 'number' && v > 0);
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2);
  };

  const getGradeColor = (score) => {
    if (score === 0) return "text-gray-600 bg-gray-100";
    if (score >= 90) return "text-green-600 bg-green-100";
    if (score >= 80) return "text-blue-600 bg-blue-100";
    if (score >= 70) return "text-yellow-600 bg-yellow-100";
    if (score >= 60) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
  };

  const getLetterGrade = (score) => {
    if (score === 0) return "N.A.";
    if (score >= 90) return "A";
    if (score >= 80) return "B";
    if (score >= 70) return "C";
    if (score >= 60) return "D";
    return "N.A.";
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
  const totalWeightedScore = calculateTotalWeightedScore();
  const visibleAssessments = getVisibleAssessments();

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
                    <div className="flex flex-col items-end space-y-2">
                      <button
                        onClick={() => navigate(`/student/challenge/${gradeId}`)}
                        disabled={challengeCount >= maxChallenges}
                        className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors font-medium ${
                          challengeCount >= maxChallenges
                            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                            : 'bg-yellow-500 hover:bg-yellow-600 text-white'
                        }`}
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>Challenge Grade</span>
                      </button>
                      <span className={`text-xs font-medium ${
                        challengeCount >= maxChallenges ? 'text-red-600' : 'text-gray-600'
                      }`}>
                        {challengeCount}/{maxChallenges} challenges used
                        {challengeCount >= maxChallenges && ' (limit reached)'}
                      </span>
                    </div>
                  )}
                  <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl p-4 text-white text-center">
                    <div className="text-3xl font-bold">{totalWeightedScore}%</div>
                    <div className="text-sm opacity-90">Weighted Score</div>
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
                      <p className="text-gray-600 text-sm font-medium">Graded Assessments</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{visibleAssessments.length}</p>
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
                      <p className="text-gray-600 text-sm font-medium">Total Weighted Score</p>
                      <p className="text-3xl font-bold text-gray-900 mt-1">{totalWeightedScore}%</p>
                    </div>
                    <div className={`rounded-full p-3 ${getGradeColor(totalWeightedScore)}`}>
                      <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Letter Grade Card */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-gray-600 text-sm font-medium">Letter Grade</p>
                      {letterGradesPublished && letterGrade ? (
                        <p className="text-3xl font-bold text-gray-900 mt-1">{letterGrade}</p>
                      ) : (
                        <p className="text-xl font-semibold text-gray-400 mt-1">Not Published</p>
                      )}
                    </div>
                    <div className={`rounded-full p-3 ${
                      letterGradesPublished && letterGrade
                        ? letterGrade.startsWith('A') ? 'bg-green-100' :
                          letterGrade.startsWith('B') ? 'bg-blue-100' :
                          letterGrade.startsWith('C') ? 'bg-yellow-100' :
                          (letterGrade === 'D' || letterGrade === 'E') ? 'bg-orange-100' :
                          'bg-red-100'
                        : 'bg-gray-100'
                    }`}>
                      <svg className={`w-8 h-8 ${
                        letterGradesPublished && letterGrade
                          ? letterGrade.startsWith('A') ? 'text-green-600' :
                            letterGrade.startsWith('B') ? 'text-blue-600' :
                            letterGrade.startsWith('C') ? 'text-yellow-600' :
                            (letterGrade === 'D' || letterGrade === 'E') ? 'text-orange-600' :
                            'text-red-600'
                          : 'text-gray-400'
                      }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
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
                  {visibleAssessments.length > 0 ? (
                    <div className="space-y-4">
                      {visibleAssessments.map(([key, value], index) => {
                        const score = typeof value === 'number' ? value : 0;
                        const displayValue = score === 0 ? "-" : value;
                        
                        // Calculate weight for this assessment
                        let policyWeight;
                        if (key.startsWith('quiz')) {
                          policyWeight = quizCount > 0 ? (coursePolicy.quizzes / quizCount).toFixed(2) : 0;
                        } else if (key.startsWith('assignment')) {
                          policyWeight = assignmentCount > 0 ? (coursePolicy.assignment / assignmentCount).toFixed(2) : 0;
                        } else {
                          policyWeight = coursePolicy[key] || 0;
                        }
                        
                        const weightedContribution = calculateWeightedScore(score, key);
                        const max = maxMarks[key] || 100;
                        
                        // Format display name
                        let displayName;
                        if (key.startsWith('quiz')) {
                          displayName = key.replace('quiz', 'Quiz ');
                        } else if (key.startsWith('assignment')) {
                          displayName = key.replace('assignment', 'Assignment ');
                        } else {
                          displayName = key.replace(/_/g, ' ');
                        }
                        
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
                                    {displayName}
                                  </h3>
                                  <div className="flex items-center space-x-3 text-sm text-gray-600 mt-1">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded">
                                      Weightage: {policyWeight}%
                                    </span>
                                    <span className="bg-green-100 text-green-700 px-2 py-0.5 rounded">
                                      Contribution: {weightedContribution.toFixed(2)}%
                                    </span>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex items-center space-x-4">
                                <span className="text-3xl font-bold text-gray-900">{displayValue}</span>
                                {score > 0 && <span className="text-gray-500 text-sm">/{max}</span>}
                              </div>
                            </div>
                            
                            {/* Progress Bar */}
                            {score > 0 && (
                              <div className="w-full bg-gray-200 rounded-full h-2.5">
                                <div 
                                  className="bg-gradient-to-r from-indigo-500 to-purple-600 h-2.5 rounded-full transition-all duration-500"
                                  style={{ width: `${Math.min((score / max) * 100, 100)}%` }}
                                ></div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="bg-gray-100 rounded-full w-16 h-16 flex items-center justify-center mx-auto mb-4">
                        <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <p className="text-gray-600">No graded assessments to display yet.</p>
                    </div>
                  )}
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
