import { useEffect, useState } from "react";
import Navbar from "../components/Navbar";
import api from "../api/axios";
import { useNavigate } from "react-router-dom";

export default function ProfessorCourses() {
  const navigate = useNavigate();
  const [courses, setCourses] = useState([]);
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

  // Handle course creation
  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Optional: Validate policy percentages add up to 100
      const total = Object.values(form.policy).reduce((a, b) => a + b, 0);
      if (total !== 100) {
        return alert("Total course policy percentages must add up to 100");
      }

      await api.post("/courses/create", form);
      alert("Course created successfully!");
      setForm({
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
      fetchCourses();
    } catch (err) {
      alert(err.response?.data?.message || "Error creating course");
    }
  };

  return (
    <>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6">Professor Dashboard</h1>

        {/* Create Course Form */}
        <div className="bg-white p-6 shadow-md rounded-xl mb-8 max-w-md">
          <h2 className="text-lg font-semibold mb-4">Create a New Course</h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              type="text"
              placeholder="Course Name"
              className="border p-2 rounded w-full"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <input
              type="text"
              placeholder="Course Code"
              className="border p-2 rounded w-full"
              value={form.code}
              onChange={(e) => setForm({ ...form, code: e.target.value })}
              required
            />
            <textarea
              placeholder="Course Description"
              className="border p-2 rounded w-full"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />

            {/* Policy Inputs */}
            <div className="grid grid-cols-2 gap-2">
              {Object.keys(form.policy).map((key) => (
                <div key={key} className="flex flex-col">
                  <label className="text-sm font-medium">{key.toUpperCase()} %</label>
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
                    className="border p-2 rounded"
                    required
                  />
                </div>
              ))}
            </div>

            <button
              type="submit"
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
            >
              Create
            </button>
          </form>
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
