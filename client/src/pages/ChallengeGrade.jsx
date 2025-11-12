import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";

export default function ChallengeGrade() {
  const { gradeId } = useParams();
  const navigate = useNavigate();
  const [grade, setGrade] = useState(null);
  const [course, setCourse] = useState(null);
  const [description, setDescription] = useState("");
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetchGradeDetails();
  }, [gradeId]);

  const fetchGradeDetails = async () => {
    try {
      const gradeRes = await api.get(`/grades/grade/${gradeId}`);
      setGrade(gradeRes.data);

      const courseRes = await api.get(`/courses/${gradeRes.data.course._id || gradeRes.data.course}`);
      setCourse(courseRes.data);
    } catch (err) {
      console.error("Error fetching grade details:", err);
      setError("Failed to load grade details");
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file type
      const validTypes = ["application/pdf", "image/jpeg", "image/jpg", "image/png"];
      if (!validTypes.includes(file.type)) {
        setError("Only PDF and image files are allowed");
        return;
      }
      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setError("File size must be less than 5MB");
        return;
      }
      setAttachment(file);
      setError("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // For this implementation, we'll convert the file to base64 and store it
      // In production, you'd want to use proper file upload service (S3, Cloudinary, etc.)
      let attachmentData = null;
      if (attachment) {
        const reader = new FileReader();
        attachmentData = await new Promise((resolve, reject) => {
          reader.onload = (e) => resolve(e.target.result);
          reader.onerror = reject;
          reader.readAsDataURL(attachment);
        });
      }

      await api.post("/challenges", {
        courseId: grade.course._id || grade.course,
        gradeId: gradeId,
        description,
        attachmentUrl: attachmentData,
        attachmentName: attachment?.name || null,
      });

      setSuccess(true);
      setTimeout(() => navigate("/student/challenges"), 2000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit challenge");
    } finally {
      setLoading(false);
    }
  };

  if (!grade || !course) {
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
        <div className="max-w-3xl mx-auto px-4">
          {success ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Challenge Submitted!</h2>
              <p className="text-gray-600">Your professor will review your challenge and respond soon.</p>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Challenge Grade</h1>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Course</p>
                      <p className="font-semibold text-gray-900">{course.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Course Code</p>
                      <p className="font-semibold text-gray-900">{course.code}</p>
                    </div>
                  </div>
                  
                  <div className="mt-4">
                    <p className="text-sm text-gray-500 mb-2">Current Grades</p>
                    <div className="grid grid-cols-3 gap-3">
                      {course.policy?.midsem > 0 && (
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-gray-500">Midsem ({course.policy.midsem}%)</p>
                          <p className="font-semibold text-gray-900">{grade.marks?.midsem || 0}</p>
                        </div>
                      )}
                      {course.policy?.endsem > 0 && (
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-gray-500">Endsem ({course.policy.endsem}%)</p>
                          <p className="font-semibold text-gray-900">{grade.marks?.endsem || 0}</p>
                        </div>
                      )}
                      {course.policy?.project > 0 && (
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-gray-500">Project ({course.policy.project}%)</p>
                          <p className="font-semibold text-gray-900">{grade.marks?.project || 0}</p>
                        </div>
                      )}
                      {course.policy?.assignment > 0 && (
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-gray-500">Assignment ({course.policy.assignment}%)</p>
                          <p className="font-semibold text-gray-900">{grade.marks?.assignment || 0}</p>
                        </div>
                      )}
                      {course.policy?.attendance > 0 && (
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-gray-500">Attendance ({course.policy.attendance}%)</p>
                          <p className="font-semibold text-gray-900">{grade.marks?.attendance || 0}</p>
                        </div>
                      )}
                      {course.policy?.participation > 0 && (
                        <div className="bg-white p-2 rounded border">
                          <p className="text-xs text-gray-500">Participation ({course.policy.participation}%)</p>
                          <p className="font-semibold text-gray-900">{grade.marks?.participation || 0}</p>
                        </div>
                      )}
                      {course.policy?.quizzes > 0 && course.quizCount > 0 && (
                        <>
                          {[...Array(course.quizCount)].map((_, i) => (
                            <div key={i} className="bg-white p-2 rounded border">
                              <p className="text-xs text-gray-500">Quiz {i + 1}</p>
                              <p className="font-semibold text-gray-900">{grade.marks?.[`quiz${i + 1}`] || 0}</p>
                            </div>
                          ))}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Form */}
              <div className="bg-white rounded-lg shadow-md p-6">
                <form onSubmit={handleSubmit}>
                  {error && (
                    <div className="mb-4 bg-red-50 border-l-4 border-red-500 p-4 rounded">
                      <p className="text-red-700 text-sm">{error}</p>
                    </div>
                  )}

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Describe your concern <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none"
                      rows="6"
                      placeholder="Please explain why you believe your grade should be reconsidered..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      required
                    ></textarea>
                    <p className="mt-1 text-sm text-gray-500">Be specific and provide detailed reasoning.</p>
                  </div>

                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Attach supporting document (optional)
                    </label>
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        onChange={handleFileChange}
                        className="hidden"
                        id="file-upload"
                      />
                      <label
                        htmlFor="file-upload"
                        className="cursor-pointer inline-flex flex-col items-center"
                      >
                        <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        <span className="text-sm text-gray-600">
                          {attachment ? attachment.name : "Click to upload or drag and drop"}
                        </span>
                        <span className="text-xs text-gray-500 mt-1">PDF, JPG, JPEG, PNG (max 5MB)</span>
                      </label>
                    </div>
                  </div>

                  <div className="flex gap-4">
                    <button
                      type="button"
                      onClick={() => navigate(-1)}
                      className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="flex-1 bg-indigo-600 text-white py-3 rounded-lg hover:bg-indigo-700 transition disabled:opacity-50"
                    >
                      {loading ? "Submitting..." : "Submit Challenge"}
                    </button>
                  </div>
                </form>
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
}
