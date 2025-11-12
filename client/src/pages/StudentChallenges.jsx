import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function StudentChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await api.get("/challenges/student");
      setChallenges(res.data);
    } catch (err) {
      console.error("Failed to fetch challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-100 text-yellow-800",
      reviewed: "bg-blue-100 text-blue-800",
      resolved: "bg-green-100 text-green-800",
    };
    return (
      <span className={`px-3 py-1 rounded-full text-xs font-medium ${styles[status]}`}>
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </span>
    );
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900">My Grade Challenges</h1>
            <p className="text-gray-600 mt-2">Track your grade challenge submissions and professor responses</p>
          </div>

          {challenges.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No challenges yet</h3>
              <p className="text-gray-600 mb-4">You haven't submitted any grade challenges.</p>
              <button
                onClick={() => navigate("/student/courses")}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                View My Courses
              </button>
            </div>
          ) : (
            <div className="grid gap-4">
              {challenges.map((challenge) => (
                <div
                  key={challenge._id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => setSelectedChallenge(challenge)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {challenge.course?.name}
                      </h3>
                      <p className="text-sm text-gray-500">{challenge.course?.code}</p>
                    </div>
                    {getStatusBadge(challenge.status)}
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-2">{challenge.description}</p>

                  <div className="flex items-center justify-between text-sm text-gray-500">
                    <span>Submitted {new Date(challenge.createdAt).toLocaleDateString()}</span>
                    {challenge.respondedAt && (
                      <span className="text-indigo-600 font-medium">Response received</span>
                    )}
                  </div>

                  {challenge.attachmentName && (
                    <div className="mt-3 flex items-center text-sm text-gray-600">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                      </svg>
                      {challenge.attachmentName}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Challenge Detail Modal */}
      {selectedChallenge && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedChallenge(null)}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedChallenge.course?.name}</h3>
                <p className="text-indigo-100 text-sm">{selectedChallenge.course?.code}</p>
              </div>
              <button
                onClick={() => setSelectedChallenge(null)}
                className="text-white hover:text-gray-200 p-2 transition"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  {getStatusBadge(selectedChallenge.status)}
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-500">Submitted</p>
                  <p className="font-medium text-gray-900">
                    {new Date(selectedChallenge.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Grade Details</h4>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-3 gap-3">
                    {selectedChallenge.course?.policy?.midsem > 0 && (
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500">Midsem ({selectedChallenge.course.policy.midsem}%)</p>
                        <p className="font-semibold">{selectedChallenge.grade?.marks?.midsem || 0}</p>
                      </div>
                    )}
                    {selectedChallenge.course?.policy?.endsem > 0 && (
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500">Endsem ({selectedChallenge.course.policy.endsem}%)</p>
                        <p className="font-semibold">{selectedChallenge.grade?.marks?.endsem || 0}</p>
                      </div>
                    )}
                    {selectedChallenge.course?.policy?.project > 0 && (
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500">Project ({selectedChallenge.course.policy.project}%)</p>
                        <p className="font-semibold">{selectedChallenge.grade?.marks?.project || 0}</p>
                      </div>
                    )}
                    {selectedChallenge.course?.policy?.assignment > 0 && (
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500">Assignment ({selectedChallenge.course.policy.assignment}%)</p>
                        <p className="font-semibold">{selectedChallenge.grade?.marks?.assignment || 0}</p>
                      </div>
                    )}
                    {selectedChallenge.course?.policy?.attendance > 0 && (
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500">Attendance ({selectedChallenge.course.policy.attendance}%)</p>
                        <p className="font-semibold">{selectedChallenge.grade?.marks?.attendance || 0}</p>
                      </div>
                    )}
                    {selectedChallenge.course?.policy?.participation > 0 && (
                      <div className="bg-white p-2 rounded border">
                        <p className="text-xs text-gray-500">Participation ({selectedChallenge.course.policy.participation}%)</p>
                        <p className="font-semibold">{selectedChallenge.grade?.marks?.participation || 0}</p>
                      </div>
                    )}
                    {selectedChallenge.course?.policy?.quizzes > 0 && selectedChallenge.course?.quizCount > 0 && (
                      <>
                        {[...Array(selectedChallenge.course.quizCount)].map((_, i) => (
                          <div key={i} className="bg-white p-2 rounded border">
                            <p className="text-xs text-gray-500">Quiz {i + 1}</p>
                            <p className="font-semibold">{selectedChallenge.grade?.marks?.[`quiz${i + 1}`] || 0}</p>
                          </div>
                        ))}
                      </>
                    )}
                  </div>
                </div>
              </div>

              <div className="mb-6">
                <h4 className="font-semibold text-gray-900 mb-2">Your Challenge</h4>
                <p className="text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-lg p-4">
                  {selectedChallenge.description}
                </p>
              </div>

              {selectedChallenge.attachmentName && (
                <div className="mb-6">
                  <h4 className="font-semibold text-gray-900 mb-2">Attachment</h4>
                  <div className="flex items-center space-x-3 bg-gray-50 rounded-lg p-4">
                    <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                    </svg>
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{selectedChallenge.attachmentName}</p>
                    </div>
                    {selectedChallenge.attachmentUrl && (
                      <a
                        href={selectedChallenge.attachmentUrl}
                        download={selectedChallenge.attachmentName}
                        className="px-4 py-2 bg-gray-200 text-gray-900 rounded-lg hover:bg-gray-300 transition flex items-center space-x-2"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                        </svg>
                        <span>Download</span>
                      </a>
                    )}
                  </div>
                </div>
              )}

              {selectedChallenge.professorResponse && (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-semibold text-gray-900">Professor's Response</h4>
                    <p className="text-sm text-gray-500">
                      {new Date(selectedChallenge.respondedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-indigo-50 border-l-4 border-indigo-600 rounded-lg p-4">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedChallenge.professorResponse}
                    </p>
                  </div>
                </div>
              )}

              {!selectedChallenge.professorResponse && selectedChallenge.status === "pending" && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                  <p className="text-yellow-800 text-sm">
                    Your challenge is pending review. You'll be notified when the professor responds.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
