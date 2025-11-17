import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function StudentCourses() {
  const [availableCourses, setAvailableCourses] = useState([]);
  const [joinedCourses, setJoinedCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [leaving, setLeaving] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCourses = async () => {
      try {
        const res = await api.get("/courses");

        const enrolledIds = res.data.enrolledCourses.map((c) => c._id);
        const available = res.data.allCourses.filter(
          (c) => !enrolledIds.includes(c._id)
        );

        setJoinedCourses(res.data.enrolledCourses);
        setAvailableCourses(available);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchCourses();
  }, []);

  const handleJoin = async (id) => {
    try {
      await api.post(`/courses/${id}/join`);
      alert("✓ Successfully joined the course!");

      const res = await api.get("/courses");
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

  const handleLeaveCourse = async (courseId, courseName) => {
    if (!window.confirm(`Are you sure you want to leave "${courseName}"? This action cannot be undone.`)) {
      return;
    }

    setLeaving(courseId);
    try {
      await api.delete(`/courses/${courseId}/leave`);
      alert("✓ Successfully left the course!");
      
      // Refresh courses list
      const res = await api.get("/courses");
      const enrolledIds = res.data.enrolledCourses.map((c) => c._id);
      setJoinedCourses(res.data.enrolledCourses);
      setAvailableCourses(
        res.data.allCourses.filter((c) => !enrolledIds.includes(c._id))
      );
    } catch (err) {
      alert(err.response?.data?.message || "Error leaving course");
    } finally {
      setLeaving(null);
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading courses...</p>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Enrolled Courses Section */}
          <div className="mb-12">
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl p-3 mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">My Enrolled Courses</h1>
                <p className="text-gray-600 mt-1">{joinedCourses.length} course(s) enrolled</p>
              </div>
            </div>

            {joinedCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {joinedCourses.map((course) => (
                  <div
                    key={course._id}
                    className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                  >
                    {/* Course Header with Gradient */}
                    <div className="h-3 bg-gradient-to-r from-green-500 to-emerald-600"></div>
                    
                    <div className="p-6">
                      {/* Course Badge */}
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mb-4">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Enrolled
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-green-600 transition-colors">
                        {course.name}
                      </h2>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      {/* Professor Info */}
                      <div className="flex items-center text-sm text-gray-500 mb-4 pb-4 border-b border-gray-200">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">{course.professor?.name || 'TBA'}</span>
                      </div>

                      {/* View Grades Button */}
                      <button
                        onClick={() => handleViewGrades(course._id)}
                        className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:from-purple-700 hover:to-indigo-700 transform transition duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500 mb-2"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          View Grades
                        </span>
                      </button>

                      {/* Leave Course Button */}
                      <button
                        onClick={() => handleLeaveCourse(course._id, course.name)}
                        disabled={leaving === course._id}
                        className="w-full bg-red-600 text-white px-4 py-3 rounded-lg font-medium hover:bg-red-700 transform transition duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
                      >
                        <span className="flex items-center justify-center">
                          {leaving === course._id ? (
                            <>
                              <svg className="animate-spin h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24">
                                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                              </svg>
                              Leaving...
                            </>
                          ) : (
                            <>
                              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                              </svg>
                              Leave Course
                            </>
                          )}
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
                <p className="text-gray-500 text-lg">You haven't enrolled in any courses yet.</p>
                <p className="text-gray-400 mt-2">Browse available courses below to get started!</p>
              </div>
            )}
          </div>

          {/* Available Courses Section */}
          <div>
            <div className="flex items-center mb-6">
              <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-3 mr-4">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Available Courses</h1>
                <p className="text-gray-600 mt-1">{availableCourses.length} course(s) available to join</p>
              </div>
            </div>

            {availableCourses.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {availableCourses.map((course) => (
                  <div
                    key={course._id}
                    className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:-translate-y-1"
                  >
                    {/* Course Header with Gradient */}
                    <div className="h-3 bg-gradient-to-r from-blue-500 to-blue-600"></div>
                    
                    <div className="p-6">
                      {/* Course Badge */}
                      <div className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 mb-4">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clipRule="evenodd" />
                        </svg>
                        Available
                      </div>

                      <h2 className="text-xl font-bold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                        {course.name}
                      </h2>
                      
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {course.description}
                      </p>

                      {/* Professor Info */}
                      <div className="flex items-center text-sm text-gray-500 mb-4 pb-4 border-b border-gray-200">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span className="font-medium">{course.professor?.name || 'TBA'}</span>
                      </div>

                      {/* Join Button */}
                      <button
                        onClick={() => handleJoin(course._id)}
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white px-4 py-3 rounded-lg font-medium hover:from-blue-700 hover:to-indigo-700 transform transition duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                      >
                        <span className="flex items-center justify-center">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                          </svg>
                          Join Course
                        </span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-xl shadow-md p-12 text-center">
                <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="text-gray-500 text-lg">No new courses available at the moment.</p>
                <p className="text-gray-400 mt-2">Check back later for new course offerings!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
