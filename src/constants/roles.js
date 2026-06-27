/**
 * =========================================================
 * 🔥 ROLE CONSTANTS (FRONTEND - FINAL 🔥)
 * =========================================================
 *
 * Used for:
 * ✅ UI visibility (Navbar, buttons)
 * ✅ Route protection
 * ✅ Role-based redirects
 *
 * ⚠️ NOTE:
 * Frontend roles are NOT secure
 * Backend must always validate permissions
 *
 * =========================================================
 */

/* =========================================================
   🔥 ROLE CONSTANTS
========================================================= */
export const ROLES = {
  STUDENT: "student",
  INSTRUCTOR: "instructor",
  ADMIN: "admin",
};

/* =========================================================
   🔥 ROLE LABELS (UI DISPLAY)
========================================================= */
export const ROLE_LABELS = {
  student: "Student",
  instructor: "Instructor",
  admin: "Admin",
};

/* =========================================================
   🔥 ROLE ROUTES (REDIRECTION)
========================================================= */
export const ROLE_ROUTES = {
  student: "/courses",
  instructor: "/instructor/dashboard",
  admin: "/admin/dashboard",
};

/* =========================================================
   🔥 HELPER FUNCTIONS
========================================================= */

/**
 * Normalize role safely
 */
export const normalizeRole = (role) => {
  if (!role) return null;
  return role.toLowerCase();
};

/**
 * Validate role
 */
export const isValidRole = (role) => {
  return Object.values(ROLES).includes(role);
};

/**
 * Check if role matches
 */
export const isRole = (user, role) => {
  return user?.role === role;
};

/**
 * Role helpers (clean usage)
 */
export const isAdmin = (user) => user?.role === ROLES.ADMIN;
export const isInstructor = (user) => user?.role === ROLES.INSTRUCTOR;
export const isStudent = (user) => user?.role === ROLES.STUDENT;