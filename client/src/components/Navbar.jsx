import { useAuth } from "../context/AuthContext";
import { useNavigate, NavLink } from "react-router-dom";
import { useState } from "react";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const navClass = ({ isActive }) =>
    `px-3 py-2 rounded-md text-sm font-medium ${
      isActive ? "bg-gray-200 text-gray-900" : "text-gray-700 hover:bg-gray-100"
    }`;

  return (
    <header className="bg-white border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between">
          {/* Left: Brand */}
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-indigo-600 to-purple-600 w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold">
              G
            </div>
            <span className="font-semibold text-gray-900">Grade Management</span>
          </div>

          {/* Center: Nav (desktop) */}
          <nav className="hidden md:flex items-center space-x-2">
            {user?.role === "admin" && (
              <>
                <NavLink to="/admin" className={navClass}>Dashboard</NavLink>
                <NavLink to="/admin/students" className={navClass}>Students</NavLink>
                <NavLink to="/admin/professors" className={navClass}>Professors</NavLink>
              </>
            )}
            {user?.role === "professor" && (
              <>
                <NavLink to="/professor/courses" className={navClass}>My Courses</NavLink>
                <NavLink to="/professor/challenges" className={navClass}>Challenges</NavLink>
              </>
            )}
            {user?.role === "student" && (
              <>
                <NavLink to="/student/courses" className={navClass}>My Courses</NavLink>
                <NavLink to="/student/challenges" className={navClass}>My Challenges</NavLink>
              </>
            )}
          </nav>

          {/* Right: User */}
          <div className="flex items-center space-x-3">
            {user && (
              <div className="relative">
                <button
                  onClick={() => setOpen(!open)}
                  className="inline-flex items-center space-x-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-md text-sm"
                >
                  <span className="hidden sm:inline text-gray-700 font-medium">{user.name}</span>
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-indigo-600 text-white font-semibold">
                    {user.name?.[0]?.toUpperCase() || "U"}
                  </span>
                </button>
                {open && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-100 z-50">
                    <div className="px-4 py-2 text-xs text-gray-500">Signed in as</div>
                    <div className="px-4 pb-2 text-sm font-medium text-gray-900 truncate">{user.email}</div>
                    <div className="border-t my-2" />
                    <button
                      onClick={() => {
                        setOpen(false);
                        navigate("/change-password");
                      }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 flex items-center"
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                      </svg>
                      Change Password
                    </button>
                    <div className="border-t my-2" />
                    <button
                      onClick={handleLogout}
                      className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                    >
                      Logout
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Mobile menu button */}
            <button className="md:hidden p-2 rounded hover:bg-gray-100" onClick={() => setOpen(!open)}>
              <svg className="w-6 h-6 text-gray-700" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Nav */}
      {open && (
        <div className="md:hidden border-t bg-white">
          <div className="px-4 py-3 space-y-2">
            {user?.role === "admin" && (
              <>
                <NavLink to="/admin" className={navClass}>Dashboard</NavLink>
                <NavLink to="/admin/students" className={navClass}>Students</NavLink>
                <NavLink to="/admin/professors" className={navClass}>Professors</NavLink>
              </>
            )}
            {user?.role === "professor" && (
              <>
                <NavLink to="/professor/courses" className={navClass}>My Courses</NavLink>
                <NavLink to="/professor/challenges" className={navClass}>Challenges</NavLink>
              </>
            )}
            {user?.role === "student" && (
              <>
                <NavLink to="/student/courses" className={navClass}>My Courses</NavLink>
                <NavLink to="/student/challenges" className={navClass}>My Challenges</NavLink>
              </>
            )}
            <button onClick={handleLogout} className="w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50">
              Logout
            </button>
          </div>
        </div>
      )}
    </header>
  );
}
