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
                          <button
            onClick={() => navigate(`/grades/${course._id}`)}
            className="mt-3 bg-yellow-600 text-white px-4 py-2 rounded-lg hover:bg-yellow-700"
          >
            Manage Grades
          </button>
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
