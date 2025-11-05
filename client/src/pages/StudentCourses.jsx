import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import axios from "axios";
import { useNavigate } from "react-router-dom";

export default function StudentCourses() {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [joinedCourses, setJoinedCourses] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get("http://localhost:5000/api/courses", {
          headers: { Authorization: `Bearer ${token}` },
        });

        const enrolledIds = res.data.enrolledCourses.map((c) => c._id);
        const available = res.data.allCourses.filter(
          (c) => !enrolledIds.includes(c._id)
        );

        setJoinedCourses(res.data.enrolledCourses);
        setAvailableCourses(available);
      } catch (err) {
        console.error(err);
      }
    };
    fetchCourses();
  }, []);

  const handleJoin = async (id) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `http://localhost:5000/api/courses/${id}/join`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      alert("Joined successfully!");

      const res = await axios.get("http://localhost:5000/api/courses", {
        headers: { Authorization: `Bearer ${token}` },
      });
      const enrolledIds = res.data.enrolledCourses.map((c) => c._id);
      setJoinedCourses(res.data.enrolledCourses);
      setAvailableCourses(
        res.data.allCourses.filter((c) => !enrolledIds.includes(c._id))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Error joining course");
    }
  };

  const handleViewGrades = (courseId) => {
    navigate(`/student/grades/${courseId}`);
  };

  return (
    <>
      <Navbar />
      <div className="p-8">
        {/* Joined Courses */}
        <h1 className="text-2xl font-bold mb-4">Your Courses</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          {joinedCourses.length > 0 ? (
            joinedCourses.map((course) => (
              <div
                key={course._id}
                className="p-4 border rounded-lg shadow-md bg-green-50"
              >
                <h2 className="text-lg font-semibold">{course.name}</h2>
                <p className="text-sm text-gray-600">{course.description}</p>
                <p className="text-sm mt-1">
                  Professor: {course.professor?.name}
                </p>
                <button
                  onClick={() => handleViewGrades(course._id)}
                  className="mt-3 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700"
                >
                  View Grades
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">You have not joined any courses yet.</p>
          )}
        </div>

        {/* Available Courses */}
        <h1 className="text-2xl font-bold mb-4">Available Courses</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {availableCourses.length > 0 ? (
            availableCourses.map((course) => (
              <div
                key={course._id}
                className="p-4 border rounded-lg shadow-md"
              >
                <h2 className="text-lg font-semibold">{course.name}</h2>
                <p className="text-sm text-gray-600">{course.description}</p>
                <p className="text-sm mt-1">
                  Professor: {course.professor?.name}
                </p>
                <button
                  onClick={() => handleJoin(course._id)}
                  className="mt-3 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
                >
                  Join
                </button>
              </div>
            ))
          ) : (
            <p className="text-gray-500">No new courses available.</p>
          )}
        </div>
      </div>
    </>
  );
}
