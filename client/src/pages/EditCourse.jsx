import { useState, useEffect } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useNavigate, useParams } from "react-router-dom";

export default function EditCourse() {
  const navigate = useNavigate();
  const { courseId } = useParams();
  const [loading, setLoading] = useState(true);
  const [quizCount, setQuizCount] = useState(0);
  const [assignmentCount, setAssignmentCount] = useState(0);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
    policy: {
      midsem: 0,
      endsem: 0,
      quizzes: 0,
      project: 0,
      assignment: 0,
      attendance: 0,
      participation: 0,
    },
  });

  useEffect(() => {
    const fetchCourse = async () => {
      try {
        const res = await api.get(`/courses/${courseId}`);
        setForm({
          name: res.data.name,
          code: res.data.code,
          description: res.data.description,
          policy: res.data.policy,
        });
        setQuizCount(res.data.quizCount || 0);
        setAssignmentCount(res.data.assignmentCount || 0);
        setLoading(false);
      } catch (err) {
        alert("Error loading course");
        navigate("/professor/courses");
      }
    };
    fetchCourse();
  }, [courseId, navigate]);

  // Handle course update
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate policy percentages add up to 100
      const total = Object.values(form.policy).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        return alert("Total course policy percentages must add up to 100");
      }

      // Validate quiz count if quizzes have non-zero percentage
      if (form.policy.quizzes > 0 && quizCount === 0) {
        return alert("Quiz count must be greater than 0 when quizzes have a non-zero percentage. Please add quizzes first.");
      }

      // Validate assignment count if assignments have non-zero percentage
      if (form.policy.assignment > 0 && assignmentCount === 0) {
        return alert("Assignment count must be greater than 0 when assignments have a non-zero percentage. Please add assignments first.");
      }

      await api.put(`/courses/${courseId}`, form);
      alert("Course updated successfully!");
      navigate("/professor/courses");
    } catch (err) {
      alert(err.response?.data?.message || "Error updating course");
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
      alert(`Quiz ${quizCount} removed successfully!`);
    } catch (err) {
      console.error("Error removing quiz:", err);
      alert(err.response?.data?.message || "Error removing quiz");
    }
  };

  const handleAddAssignment = async () => {
    if (assignmentCount >= 5) {
      alert("Maximum 5 assignments allowed");
      return;
    }
    
    try {
      const newCount = assignmentCount + 1;
      await api.put(`/courses/${courseId}/assignment-count`, { assignmentCount: newCount });
      setAssignmentCount(newCount);
      alert(`Assignment ${newCount} added successfully!`);
    } catch (err) {
      console.error("Error adding assignment:", err);
      alert(err.response?.data?.message || "Error adding assignment");
    }
  };

  const handleRemoveAssignment = async () => {
    if (assignmentCount <= 0) {
      alert("No assignments to remove");
      return;
    }
    
    const confirmed = window.confirm(`Are you sure you want to remove Assignment ${assignmentCount}? This will delete all grades for this assignment.`);
    if (!confirmed) return;
    
    try {
      const newCount = assignmentCount - 1;
      await api.put(`/courses/${courseId}/assignment-count`, { assignmentCount: newCount });
      setAssignmentCount(newCount);
      alert(`Assignment ${assignmentCount} removed successfully!`);
    } catch (err) {
      console.error("Error removing assignment:", err);
      alert(err.response?.data?.message || "Error removing assignment");
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading course...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gray-50 p-8">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="mb-6">
            <button
              onClick={() => navigate("/professor/courses")}
              className="flex items-center text-blue-600 hover:text-blue-800 mb-4"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to Dashboard
            </button>
            <h1 className="text-3xl font-bold text-gray-800">Edit Course</h1>
            <p className="text-gray-600 mt-2">
              Update course details and grading policy
            </p>
          </div>

          {/* Edit Course Form */}
          <div className="bg-white p-8 shadow-lg rounded-xl">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Course Name */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g., Computer Networks"
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              {/* Course Code */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Code *
                </label>
                <input
                  type="text"
                  placeholder="e.g., CS301"
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  value={form.code}
                  onChange={(e) => setForm({ ...form, code: e.target.value })}
                  required
                />
              </div>

              {/* Course Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Course Description *
                </label>
                <textarea
                  placeholder="Describe the course content and objectives..."
                  className="border border-gray-300 p-3 rounded-lg w-full focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  rows="4"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  required
                />
              </div>

              {/* Grading Policy */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Grading Policy * (Must total 100%)
                </label>
                <p className="text-sm text-gray-600 mb-3">
                  💡 Set a component to 0% to remove it from the course. Students won't see components with 0% weightage.
                </p>
                <div className="grid grid-cols-2 gap-4">
                  {Object.keys(form.policy).map((key) => (
                    <div key={key} className="flex flex-col">
                      <label className="text-sm font-medium text-gray-600 mb-1">
                        {key.charAt(0).toUpperCase() + key.slice(1)} (%)
                      </label>
                      <input
                        type="number"
                        min={0}
                        max={100}
                        value={form.policy[key]}
                        onChange={(e) =>
                          setForm({
                            ...form,
                            policy: { ...form.policy, [key]: Number(e.target.value) },
                          })
                        }
                        className="border border-gray-300 p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required
                      />
                    </div>
                  ))}
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Current total:{" "}
                  <span
                    className={
                      Object.values(form.policy).reduce((a, b) => a + b, 0) === 100
                        ? "text-green-600 font-semibold"
                        : "text-red-600 font-semibold"
                    }
                  >
                    {Object.values(form.policy).reduce((a, b) => a + b, 0)}%
                  </span>
                </p>
              </div>

              {/* Quiz Management Section */}
              {form.policy.quizzes > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          <h3 className="text-lg font-bold text-gray-800">Quiz Management</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Configure the number of quizzes for this course. Each quiz will be weighted equally.
                        </p>
                      </div>
                    </div>

                    {/* Quiz Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Weightage</p>
                        <p className="text-2xl font-bold text-indigo-600">{form.policy.quizzes}%</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active Quizzes</p>
                        <p className="text-2xl font-bold text-gray-800">{quizCount}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-indigo-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Weight per Quiz</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {quizCount > 0 ? (form.policy.quizzes / quizCount).toFixed(2) : 0}%
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleAddQuiz}
                        disabled={quizCount >= 10}
                        className="flex-1 flex items-center justify-center gap-2 bg-indigo-600 text-white px-4 py-3 rounded-lg hover:bg-indigo-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 font-medium transition-all shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Quiz {quizCount >= 10 && "(Max Reached)"}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveQuiz}
                        disabled={quizCount <= 0}
                        className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 border-2 border-red-200 px-4 py-3 rounded-lg hover:bg-red-50 hover:border-red-300 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-all shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        Remove Quiz {quizCount <= 0 && "(None Active)"}
                      </button>
                    </div>

                    {/* Info Message */}
                    {quizCount === 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          No quizzes configured. Click "Add Quiz" to create your first quiz.
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Assignment Management Section */}
              {form.policy.assignment > 0 && (
                <div className="border-t border-gray-200 pt-6">
                  <div className="bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-6 shadow-sm">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          <h3 className="text-lg font-bold text-gray-800">Assignment Management</h3>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          Configure the number of assignments for this course. Each assignment will be weighted equally.
                        </p>
                      </div>
                    </div>

                    {/* Assignment Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-5">
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Total Weightage</p>
                        <p className="text-2xl font-bold text-purple-600">{form.policy.assignment}%</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Active Assignments</p>
                        <p className="text-2xl font-bold text-gray-800">{assignmentCount}</p>
                      </div>
                      <div className="bg-white rounded-lg p-4 shadow-sm border border-purple-100">
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Weight per Assignment</p>
                        <p className="text-2xl font-bold text-emerald-600">
                          {assignmentCount > 0 ? (form.policy.assignment / assignmentCount).toFixed(2) : 0}%
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={handleAddAssignment}
                        disabled={assignmentCount >= 5}
                        className="flex-1 flex items-center justify-center gap-2 bg-purple-600 text-white px-4 py-3 rounded-lg hover:bg-purple-700 disabled:bg-gray-300 disabled:cursor-not-allowed disabled:text-gray-500 font-medium transition-all shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        Add Assignment {assignmentCount >= 5 && "(Max Reached)"}
                      </button>
                      <button
                        type="button"
                        onClick={handleRemoveAssignment}
                        disabled={assignmentCount <= 0}
                        className="flex-1 flex items-center justify-center gap-2 bg-white text-red-600 border-2 border-red-200 px-4 py-3 rounded-lg hover:bg-red-50 hover:border-red-300 disabled:bg-gray-100 disabled:border-gray-200 disabled:text-gray-400 disabled:cursor-not-allowed font-medium transition-all shadow-sm hover:shadow-md"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                        </svg>
                        Remove Assignment {assignmentCount <= 0 && "(None Active)"}
                      </button>
                    </div>

                    {/* Info Message */}
                    {assignmentCount === 0 && (
                      <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-lg">
                        <p className="text-sm text-amber-800 flex items-center gap-2">
                          <svg className="w-5 h-5 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                          </svg>
                          No assignments configured. Click "Add Assignment" to create your first assignment.
                        </p>
                      </div>
                )}
                  </div>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Update Course
                </button>
                <button
                  type="button"
                  onClick={() => navigate("/professor/courses")}
                  className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 font-semibold transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}
