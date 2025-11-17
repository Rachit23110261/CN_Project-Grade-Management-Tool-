import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ProfessorCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
  const [deleting, setDeleting] = useState(null);

  // Fetch professor's own courses
  const fetchCourses = async () => {
    try {
      const res = await api.get("/courses/my-courses");
      setCourses(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, []);

  const handleDeleteCourse = async (courseId, courseName, studentCount) => {
    if (studentCount > 0) {
      alert(`Cannot delete "${courseName}" because it has ${studentCount} enrolled student(s). Please remove all students first.`);
      return;
    }

    if (!window.confirm(`Are you sure you want to delete the course "${courseName}"? This action cannot be undone.`)) {
      return;
    }

    setDeleting(courseId);
    try {
      await api.delete(`/courses/${courseId}/leave`);
      alert("✓ Course deleted successfully!");
      fetchCourses(); // Refresh the list
    } catch (err) {
      alert(err.response?.data?.message || "Error deleting course");
    } finally {
      setDeleting(null);
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Professor Dashboard</h1>
          <button
            onClick={() => navigate("/professor/create-course")}
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 font-semibold flex items-center gap-2 transition-colors"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Create New Course
          </button>
        </div>

        {/* Display Professor's Courses */}
        <h2 className="text-xl font-semibold mb-3">Your Courses</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {courses.length > 0 ? (
            courses.map((course) => (
              <div
                key={course._id}
                className="p-4 border rounded-lg shadow-md bg-white flex flex-col justify-between"
              >
                <div>
                  <h2 className="text-lg font-semibold">{course.name}</h2>
                  <p className="text-sm text-gray-600">{course.description}</p>
                  <p className="text-sm mt-1 text-gray-500">Code: {course.code}</p>
                  <p className="text-sm mt-1 font-medium text-green-600">
                    {course.students?.length || 0} students enrolled
                  </p>
                </div>
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => navigate(`/grades/${course._id}`)}
                    className="flex-1 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700 transition-colors"
                  >
                    Manage Grades
                  </button>
                  <button
                    onClick={() => navigate(`/professor/edit-course/${course._id}`)}
                    className="flex-1 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                    Edit
                  </button>
                  <button
                    onClick={() => handleDeleteCourse(course._id, course.name, course.students?.length || 0)}
                    disabled={deleting === course._id}
                    className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {deleting === course._id ? (
                      <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Deleting...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
                      </>
                    )}
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No courses created yet.</p>
          )}
        </div>
      </div>
    </>
  );
}
