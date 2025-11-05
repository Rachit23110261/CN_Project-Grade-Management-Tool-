import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import Login from "./pages/Login";
import StudentCourses from "./pages/StudentCourses";
import ProfessorCourses from "./pages/ProffessorCourses";
import AdminPanel from "./pages/AdminPanel";
import AdminRegister from "./pages/AdminRegister";
import ProtectedRoute from "./components/ProtectedRoute";
import StudentsList from "./pages/StudentsList";
import ProfessorsList from "./pages/ProffessorList";
import GradeManagement from "./pages/GradeManagement";
import StudentGrades from "./pages/StudentGrades";


export default function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>

          {/* ---------- Public ---------- */}
          <Route path="/login" element={<Login />} />

          {/* ---------- Student ---------- */}
          <Route
            path="/student/courses"
            element={
              <ProtectedRoute allowedRoles={["student"]}>
                <StudentCourses />
              </ProtectedRoute>
            }
          />

          {/* ---------- Professor ---------- */}
          <Route
            path="/professor/courses"
            element={
              <ProtectedRoute allowedRoles={["professor"]}>
                <ProfessorCourses />
              </ProtectedRoute>
            }
          />

          {/* ---------- Admin ---------- */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminPanel />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/register"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <AdminRegister />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/students"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <StudentsList />
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin/professors"
            element={
              <ProtectedRoute allowedRoles={["admin"]}>
                <ProfessorsList />
              </ProtectedRoute>
            }
          />

          {/* ---------- Professor - Grade Management ---------- */}
<Route
  path="/grades/:courseId"
  element={
    <ProtectedRoute allowedRoles={["professor"]}>
      <GradeManagement />
    </ProtectedRoute>
  }
/>

<Route
  path="/student/grades/:courseId"
  element={
    <ProtectedRoute allowedRoles={["student"]}>
      <StudentGrades />
    </ProtectedRoute>
  }
/>




          {/* ---------- Default ---------- */}
          <Route path="*" element={<Navigate to="/login" replace />} />

        </Routes>
      </Router>
    </AuthProvider>
  );
}
