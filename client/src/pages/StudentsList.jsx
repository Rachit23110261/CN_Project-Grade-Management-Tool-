import { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function StudentsList() {
  const [students, setStudents] = useState([]);

  useEffect(() => {
    const fetchStudents = async () => {
        try {
          console.log("called")
          const response = await axios.get("/users/role/student", {
            headers: {
              Authorization: `Bearer ${localStorage.getItem("token")}`,
            },
          });
          console.log("response:", response.data); // should now log the array
          setStudents(response.data);
        } catch (err) {
          console.error("Fetch error:", err);
        }
      };
    fetchStudents();
  }, []);

  return (
    <>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">All Students</h1>
        <Link
          to="/admin"
          className="text-blue-600 underline hover:text-blue-800 mb-4 inline-block"
        >
          ← Back to Admin Panel
        </Link>

        <table className="w-full border border-gray-300 rounded-lg">
          <thead>
            <tr className="bg-gray-200 text-left">
              <th className="p-3 border">Name</th>
              <th className="p-3 border">Email</th>
              <th className="p-3 border">Role</th>
            </tr>
          </thead>
          <tbody>
            {students.map((s) => (
              <tr key={s._id} className="hover:bg-gray-100">
                <td className="p-3 border">{s.name}</td>
                <td className="p-3 border">{s.email}</td>
                <td className="p-3 border">{s.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
