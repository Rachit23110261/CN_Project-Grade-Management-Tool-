import { Link } from "react-router-dom";
import Navbar from "../components/Navbar"; // adjust path

export default function AdminPanel() {
  return (
    <>
      <Navbar />
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">Admin Dashboard</h1>

        <div className="flex flex-col gap-4">
          <Link
            to="/admin/register"
            className="bg-green-600 text-white px-5 py-3 rounded-lg hover:bg-green-700 transition"
          >
            ➕ Register New User
          </Link>

          <Link
            to="/admin/students"
            className="bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition"
          >
            🎓 View All Students
          </Link>

          <Link
            to="/admin/professors"
            className="bg-purple-600 text-white px-5 py-3 rounded-lg hover:bg-purple-700 transition"
          >
            👨‍🏫 View All Professors
          </Link>
        </div>
      </div>
    </>
  );
}
