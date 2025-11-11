import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import api from "../api/axios";

export default function GradeManagement() {
  const { courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [grades, setGrades] = useState({}); // studentId -> marks object
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get(`/grades/${courseId}`);
        setCourse(res.data.course);

        // Initialize grades
        const g = {};
        res.data.studentGrades.forEach(student => {
          g[student._id] = student.marks;
        });
        setGrades(g);
        setLoading(false);
      } catch (err) {
        console.error(err);
      }
    };
    fetchData();
  }, [courseId]);

  const handleChange = (studentId, key, value) => {
    setGrades(prev => ({
      ...prev,
      [studentId]: { ...prev[studentId], [key]: Number(value) }
    }));
  };

  const handleSave = async () => {
    try {
      await api.post(`/grades/${courseId}`, { grades }); // ✅ wrap grades in an object
  
      alert("Grades saved successfully!");
    } catch (err) {
      console.error("Error saving grades:", err);
      alert(err.response?.data?.message || "Error saving grades");
    }
  };

  if (loading) return <p>Loading...</p>;

  return (
    <>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">{course.name} - Grade Management</h1>
        <table className="w-full border">
          <thead>
            <tr>
              <th className="border p-2">Student</th>
              {Object.keys(course.policy).map(key => (
                <th key={key} className="border p-2">{key.toUpperCase()}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Object.keys(grades).map(studentId => (
              <tr key={studentId}>
                <td className="border p-2">{course.students.find(s => s._id === studentId)?.name}</td>
                {Object.keys(course.policy).map(key => (
                  <td key={key} className="border p-2">
                    <input
                      type="number"
                      min={0}
                      max={course.policy[key]}
                      value={grades[studentId][key] || 0}
                      onChange={(e) => handleChange(studentId, key, e.target.value)}
                      className="w-full border rounded p-1"
                    />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <button
          onClick={handleSave}
          className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700"
        >
          Save Grades
        </button>
      </div>
    </>
  );
}
