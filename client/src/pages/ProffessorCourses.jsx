import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ProfessorCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);

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
