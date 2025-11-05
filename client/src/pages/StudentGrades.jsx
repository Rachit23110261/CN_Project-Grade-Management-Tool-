import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import Navbar from "../components/Navbar";
import axios from "axios";

export default function StudentGrades() {
  const { courseId } = useParams();
  const [grades, setGrades] = useState(null);
  const [courseName, setCourseName] = useState("");

  useEffect(() => {
    const fetchGrades = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token:", token);
        console.log("Course ID:", courseId);

        const res = await axios.get(`http://localhost:5000/api/grades/${courseId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });

        console.log("API response:", res.data);

        // Extract data properly
        const { course, studentGrades } = res.data;
        setCourseName(course?.name || "Course");

        if (Array.isArray(studentGrades) && studentGrades.length > 0) {
          setGrades(studentGrades[0].marks);
        } else {
          setGrades(null);
        }
      } catch (err) {
        console.error("Error fetching grades:", err);
        setGrades(null);
      }
    };

    fetchGrades();
  }, [courseId]);

  return (
    <>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">
          Grades for {courseName || "Course"}
        </h1>

        {grades ? (
          <div className="space-y-2">
            {Object.entries(grades).map(([key, value]) => (
              <p key={key} className="text-lg">
                <strong>{key.toUpperCase()}:</strong> {value}
              </p>
            ))}
          </div>
        ) : (
          <p className="text-gray-600">No grades available yet.</p>
        )}
      </div>
    </>
  );
}
