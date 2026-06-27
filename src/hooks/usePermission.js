/**
 * 🔐 usePermission Hook (FINAL PRODUCTION)
 * ------------------------------------------------
 * ✅ Role-based access control (RBAC)
 * ✅ Clean + reusable
 * ✅ Works with AuthProvider
 * ✅ Supports multi-role checks
 * ✅ Prevents UI leaks (security)
 */

import { useMemo } from "react";
import { useAuth } from "../core/providers/AuthProvider";

/* =========================================================
   🔐 ROLE CONSTANTS (BEST PRACTICE)
========================================================= */

export const ROLES = {
  ADMIN: "admin",
  INSTRUCTOR: "instructor",
  STUDENT: "student",
};

/* =========================================================
   🔥 MAIN HOOK
========================================================= */

export const usePermission = () => {
  const { user } = useAuth();

  const role = user?.role;

  /* =========================================================
     🔍 BASIC CHECKS
  ========================================================= */

  const isAdmin = useMemo(() => role === ROLES.ADMIN, [role]);
  const isInstructor = useMemo(() => role === ROLES.INSTRUCTOR, [role]);
  const isStudent = useMemo(() => role === ROLES.STUDENT, [role]);

  /* =========================================================
     🔥 MULTI ROLE CHECK
  ========================================================= */

  const hasRole = (roles = []) => {
    if (!role) return false;
    return roles.includes(role);
  };

  /* =========================================================
     🔐 PERMISSION HELPERS (APP LEVEL)
  ========================================================= */

  const canManageUsers = isAdmin;

  const canManageCourses = isAdmin;

  const canUploadVideo = isInstructor;

  const canEditOwnCourse = isInstructor;

  const canViewCourse = isAdmin || isInstructor || isStudent;

  const canPurchaseCourse = isStudent;

  /* =========================================================
     🚀 RETURN ALL PERMISSIONS
  ========================================================= */

  return {
    role,

    // basic roles
    isAdmin,
    isInstructor,
    isStudent,

    // helpers
    hasRole,

    // permissions
    canManageUsers,
    canManageCourses,
    canUploadVideo,
    canEditOwnCourse,
    canViewCourse,
    canPurchaseCourse,
  };
};