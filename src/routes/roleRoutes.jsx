/**
 * =========================================================
 * 🔐 ROLE BASED ROUTING (FINAL - PRODUCTION READY 🔥)
 * =========================================================
 *
 * ✅ Uses AuthProvider (NO localStorage ❌)
 * ✅ Handles loading state
 * ✅ Prevents unauthorized access
 * ✅ Instructor activation control
 * ✅ Clean redirects
 * ✅ Admin routes protected
 * =========================================================
 */

import { Navigate } from "react-router-dom";
import { useAuth } from "../core/providers/AuthProvider";

/* ================= IMPORT PAGES ================= */
import AdminLayout from "../layouts/AdminLayout";
import AdminDashboard from "../features/admin/pages/Dashboard";
import ManageUsers from "../features/admin/pages/ManageUsers";
import ManageCourses from "../features/admin/pages/ManageCourses";
import EditCourse from "../features/admin/pages/EditCourse";

import InstructorDashboard from "../features/instructor/pages/Dashboard";

/* =========================================================
   🔐 ROLE GUARD COMPONENT
========================================================= */
export default function RoleRoute({ children, allowedRoles = [] }) {
  const { user, loading } = useAuth();

  /* ================= LOADING ================= */
  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  /* ================= NOT LOGGED IN ================= */
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  /* ================= INSTRUCTOR CONTROL ================= */
  if (user.role === "instructor" && !user.isInstructorActive) {
    return (
      <Navigate
        to="/courses"
        replace
        state={{
          message: "Instructor access not activated by admin",
        }}
      />
    );
  }

  /* ================= ROLE CHECK ================= */
  if (!allowedRoles.includes(user.role)) {
    console.warn(`⛔ Access denied for role: ${user.role}`);
    return <Navigate to="/courses" replace />;
  }

  /* ================= ACCESS GRANTED ================= */
  return children;
}

/* =========================================================
   🚀 ROLE ROUTES CONFIG (FINAL 🔥)
========================================================= */

export function getRoleRoutes() {
  return [
    /**
     * =========================================================
     * 👑 ADMIN ROUTES (PROTECTED 🔥)
     * =========================================================
     */
    {
      path: "/admin",
      element: (
        <RoleRoute allowedRoles={["admin"]}>
          <AdminLayout />
        </RoleRoute>
      ),
      children: [
        {
          path: "dashboard",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <AdminDashboard />
            </RoleRoute>
          ),
        },
        {
          path: "users",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <ManageUsers />
            </RoleRoute>
          ),
        },
        {
          path: "courses",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <ManageCourses />
            </RoleRoute>
          ),
        },
        {
          path: "courses/:id",
          element: (
            <RoleRoute allowedRoles={["admin"]}>
              <EditCourse />
            </RoleRoute>
          ),
        },
      ],
    },

    /**
     * =========================================================
     * 🎓 INSTRUCTOR ROUTES
     * =========================================================
     */
    {
      path: "/instructor/dashboard",
      element: (
        <RoleRoute allowedRoles={["instructor"]}>
          <InstructorDashboard />
        </RoleRoute>
      ),
    },
  ];
}