import { useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function CreateCourse() {
  const navigate = useNavigate();
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
    quizCount: 0,
    assignmentCount: 0,
  });

  // Handle course creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Validate policy percentages add up to 100
      const total = Object.values(form.policy).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        return alert("Total course policy percentages must add up to 100");
      }

      // Validate quiz count if quizzes have non-zero percentage
      if (form.policy.quizzes > 0 && form.quizCount === 0) {
        return alert("Quiz count must be greater than 0 when quizzes have a non-zero percentage");
      }

      // Validate assignment count if assignments have non-zero percentage
      if (form.policy.assignment > 0 && form.assignmentCount === 0) {
        return alert("Assignment count must be greater than 0 when assignments have a non-zero percentage");
      }

      await api.post("/courses/create", form);
      alert("Course created successfully!");
      navigate("/professor/courses");
    } catch (err) {
      alert(err.response?.data?.message || "Error creating course");
    }
  };

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
            <h1 className="text-3xl font-bold text-gray-800">Create a New Course</h1>
            <p className="text-gray-600 mt-2">
              Fill in the details below to create a new course
            </p>
          </div>

          {/* Create Course Form */}
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

              {/* Assessment Configuration */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Assessment Configuration
                </label>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1">
                      Number of Quizzes {form.policy.quizzes > 0 && "*"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={form.quizCount}
                      onChange={(e) => setForm({ ...form, quizCount: Number(e.target.value) })}
                      className={`border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        form.policy.quizzes > 0 && form.quizCount === 0 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      required={form.policy.quizzes > 0}
                    />
                    {form.policy.quizzes > 0 && form.quizCount === 0 && (
                      <p className="text-red-500 text-xs mt-1">Required when quizzes have non-zero percentage</p>
                    )}
                  </div>
                  
                  <div className="flex flex-col">
                    <label className="text-sm font-medium text-gray-600 mb-1">
                      Number of Assignments {form.policy.assignment > 0 && "*"}
                    </label>
                    <input
                      type="number"
                      min={0}
                      max={5}
                      value={form.assignmentCount}
                      onChange={(e) => setForm({ ...form, assignmentCount: Number(e.target.value) })}
                      className={`border p-2 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${
                        form.policy.assignment > 0 && form.assignmentCount === 0 
                          ? 'border-red-300 bg-red-50' 
                          : 'border-gray-300'
                      }`}
                      required={form.policy.assignment > 0}
                    />
                    {form.policy.assignment > 0 && form.assignmentCount === 0 && (
                      <p className="text-red-500 text-xs mt-1">Required when assignments have non-zero percentage</p>
                    )}
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-2">
                  Specify the number of individual assessments for proper grade calculation
                </p>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold transition-colors"
                >
                  Create Course
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
