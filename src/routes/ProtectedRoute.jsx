/**
 * =========================================================
 * 🔐 PROTECTED ROUTE (FINAL PRODUCTION FIXED 🔥)
 * =========================================================
 *
 * ✅ Auth check
 * ✅ Role-based access
 * ✅ Instructor activation (NO LOOP)
 * ✅ Safe redirects
 * =========================================================
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../core/providers/AuthProvider";
import {
  canAccessAdminPage,
  canAccessAnyAdminPage,
  getDefaultAdminPath,
} from "../constants/adminPages";

export default function ProtectedRoute({
  children,
  allowedRoles,
  role,
  adminPage,
  adminPages,
}) {
  const { user, token, loading } = useAuth();
  const location = useLocation();

  /* =========================================================
     ⏳ LOADING
  ========================================================= */
  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        Loading...
      </div>
    );
  }

  /* =========================================================
     ❌ NOT LOGGED IN
  ========================================================= */
  if (!token || !user) {
    const redirect = `${location.pathname}${location.search}`;
    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    );
  }

  /* =========================================================
     🔥 NORMALIZE ROLE
  ========================================================= */
  const userRole = user?.role?.toLowerCase();

  /* =========================================================
     🧠 HANDLE ROLE INPUT
  ========================================================= */
  let rolesToCheck = allowedRoles;

  if (role && !allowedRoles) {
    rolesToCheck = [role];
  }

  if (rolesToCheck) {
    rolesToCheck = rolesToCheck.map((r) => r.toLowerCase());
  }

  /* =========================================================
     🚫 INSTRUCTOR NOT ACTIVE (FIXED 🔥)
  ========================================================= */
  if (userRole === "instructor" && !user?.isInstructorActive) {
    // 🔥 Prevent redirect loop
    if (location.pathname !== "/courses") {
      return (
        <Navigate
          to="/courses"
          replace
          state={{
            message: "Instructor not approved yet",
          }}
        />
      );
    }

    // Already on /courses → allow render
    return children;
  }

  /* =========================================================
     ❌ ROLE NOT ALLOWED
  ========================================================= */
  if (rolesToCheck && !rolesToCheck.includes(userRole)) {
    console.warn("⛔ Access denied:", userRole);

    // 🔥 Prevent redirect loop
    if (userRole === "admin") {
      if (location.pathname !== "/admin/dashboard") {
        return <Navigate to="/admin/dashboard" replace />;
      }
      return children;
    }

    if (userRole === "instructor") {
      if (location.pathname !== "/instructor/dashboard") {
        return <Navigate to="/instructor/dashboard" replace />;
      }
      return children;
    }

    if (location.pathname !== "/courses") {
      return <Navigate to="/courses" replace />;
    }

    return children;
  }

  const pagesToCheck = adminPages || (adminPage ? [adminPage] : null);

  if (userRole === "admin" && pagesToCheck) {
    const hasPageAccess =
      pagesToCheck.length === 1
        ? canAccessAdminPage(user, pagesToCheck[0])
        : canAccessAnyAdminPage(user, pagesToCheck);

    if (!hasPageAccess) {
      const fallback = getDefaultAdminPath(user);

      if (location.pathname !== fallback) {
        return <Navigate to={fallback} replace />;
      }

      return <Navigate to="/courses" replace />;
    }
  }

  /* =========================================================
     ✅ ACCESS GRANTED
  ========================================================= */
  return children;
}
