import { useState, useEffect } from "react";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function ProfessorChallenges() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedChallenge, setSelectedChallenge] = useState(null);
  const [response, setResponse] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const res = await api.get("/challenges/professor");
      setChallenges(res.data);
    } catch (err) {
      console.error("Failed to fetch challenges:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleRespond = async (e) => {
    e.preventDefault();
    if (!response.trim()) return;

    setSubmitting(true);
    try {
      await api.put(`/challenges/${selectedChallenge._id}/respond`, { response });

      // Refresh challenges
      await fetchChallenges();
      setSelectedChallenge(null);
      setResponse("");
    } catch (err) {
      console.error("Failed to submit response:", err);
      alert(err.response?.data?.message || "Failed to submit response");
    } finally {
      setSubmitting(false);
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

  const filteredChallenges = challenges.filter((challenge) => {
    if (filter === "all") return true;
    return challenge.status === filter;
  });

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
            <h1 className="text-3xl font-bold text-gray-900">Grade Challenges</h1>
            <p className="text-gray-600 mt-2">Review and respond to student grade challenges</p>
          </div>

          {/* Filter Tabs */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex space-x-2">
              {[
                { key: "all", label: "All" },
                { key: "pending", label: "Pending" },
                { key: "reviewed", label: "Reviewed" },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setFilter(tab.key)}
                  className={`px-4 py-2 rounded-lg font-medium transition ${
                    filter === tab.key
                      ? "bg-indigo-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                  <span className="ml-2 text-sm">
                    ({tab.key === "all" ? challenges.length : challenges.filter((c) => c.status === tab.key).length})
                  </span>
                </button>
              ))}
            </div>
          </div>

          {filteredChallenges.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No challenges found</h3>
              <p className="text-gray-600">There are no grade challenges in this category.</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {filteredChallenges.map((challenge) => (
                <div
                  key={challenge._id}
                  className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition cursor-pointer"
                  onClick={() => {
                    setSelectedChallenge(challenge);
                    setResponse(challenge.professorResponse || "");
                  }}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        {challenge.course?.name}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Student: {challenge.student?.name} ({challenge.student?.email})
                      </p>
                    </div>
                    {getStatusBadge(challenge.status)}
                  </div>

                  <p className="text-gray-700 mb-4 line-clamp-2">{challenge.description}</p>

                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-500">
                      Submitted {new Date(challenge.createdAt).toLocaleDateString()}
                    </span>
                    {challenge.status === "pending" && (
                      <span className="text-yellow-600 font-medium">Action Required</span>
                    )}
                    {challenge.respondedAt && (
                      <span className="text-indigo-600 font-medium">
                        Responded {new Date(challenge.respondedAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
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
          onClick={() => {
            setSelectedChallenge(null);
            setResponse("");
          }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedChallenge.course?.name}</h3>
                <p className="text-indigo-100 text-sm">
                  Student: {selectedChallenge.student?.name}
                </p>
              </div>
              <button
                onClick={() => {
                  setSelectedChallenge(null);
                  setResponse("");
                }}
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
                <h4 className="font-semibold text-gray-900 mb-2">Student's Challenge</h4>
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

              <div className="border-t pt-6">
                <h4 className="font-semibold text-gray-900 mb-4">
                  {selectedChallenge.professorResponse ? "Your Response" : "Respond to Challenge"}
                </h4>
                
                <form onSubmit={handleRespond}>
                  <textarea
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                    rows="12"
                    placeholder="Provide your response to the student's challenge..."
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    required
                    disabled={selectedChallenge.professorResponse && selectedChallenge.status === "reviewed"}
                  ></textarea>

                  {!selectedChallenge.professorResponse || selectedChallenge.status !== "reviewed" ? (
                    <div className="mt-4 flex justify-end gap-3">
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedChallenge(null);
                          setResponse("");
                        }}
                        className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={submitting}
                        className="px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                      >
                        {submitting ? "Submitting..." : "Submit Response"}
                      </button>
                    </div>
                  ) : (
                    <div className="mt-4 bg-green-50 border-l-4 border-green-500 p-4 rounded">
                      <p className="text-green-800 text-sm">
                        Response submitted on {new Date(selectedChallenge.respondedAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
