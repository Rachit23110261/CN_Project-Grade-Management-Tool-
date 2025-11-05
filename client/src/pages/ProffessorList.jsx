import { useEffect, useState } from "react";
import axios from "../api/axios";
import Navbar from "../components/Navbar";
import { Link } from "react-router-dom";

export default function ProfessorsList() {
  const [professors, setProfessors] = useState([]);

  useEffect(() => {
    const fetchProfessors = async () => {
      try {
        const { data } = await axios.get("/users/role/professor", {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
        });
        setProfessors(data);
      } catch (err) {
        console.error(err);
      }
    };
    fetchProfessors();
  }, []);

  return (
    <>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4 text-gray-800">All Professors</h1>
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
            {professors.map((p) => (
              <tr key={p._id} className="hover:bg-gray-100">
                <td className="p-3 border">{p.name}</td>
                <td className="p-3 border">{p.email}</td>
                <td className="p-3 border">{p.role}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
