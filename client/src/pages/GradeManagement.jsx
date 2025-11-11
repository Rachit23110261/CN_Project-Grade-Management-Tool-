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

        // Initialize grades - create deep copy to avoid shared references
        const g = {};
        res.data.studentGrades.forEach(student => {
          // Create a new object for each student to avoid shared references
          g[student._id] = { ...student.marks };
        });
        
        // Debug: Log each student's grade object reference
        console.log("Initialized grades for students:");
        Object.keys(g).forEach(studentId => {
          console.log(`Student ${studentId}:`, g[studentId]);
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
    console.log(`Changing grade for student ${studentId}, field ${key}, value ${value}`);
    setGrades(prev => {
      const updated = {
        ...prev,
        [studentId]: { 
          ...prev[studentId], 
          [key]: Number(value) || 0
        }
      };
      console.log(`Updated grades:`, updated);
      return updated;
    });
  };

  const handleSave = async () => {
    try {
      console.log("=== SAVING GRADES ===");
      console.log("Total students:", Object.keys(grades).length);
      Object.keys(grades).forEach(studentId => {
        console.log(`Student ${studentId}:`, grades[studentId]);
      });
      
      await api.post(`/grades/${courseId}`, { grades });
  
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
            {Object.keys(grades).map(studentId => {
              const student = course.students.find(s => s._id === studentId);
              return (
                <tr key={studentId}>
                  <td className="border p-2">
                    <div className="font-semibold">{student?.name}</div>
                    <div className="text-xs text-gray-500">{student?.email}</div>
                    <div className="text-xs text-gray-400 font-mono">ID: {studentId.slice(-6)}</div>
                  </td>
                  {Object.keys(course.policy).map(key => (
                    <td key={key} className="border p-2">
                      <input
                        type="number"
                        min={0}
                        max={course.policy[key]}
                        value={grades[studentId]?.[key] || 0}
                        onChange={(e) => handleChange(studentId, key, e.target.value)}
                        className="w-full border rounded p-1"
                      />
                    </td>
                  ))}
                </tr>
              );
            })}
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
