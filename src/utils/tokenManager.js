/**
 * 🔐 TOKEN MANAGER (FINAL - PRODUCTION READY)
 *
 * Handles:
 * ✅ JWT Token
 * ✅ User Data (role, name, email)
 * ✅ Session management
 * ✅ Safe parsing (no crashes)
 * ✅ Clean logout
 */

/* =========================
   🔑 CONSTANT KEYS
========================= */

const TOKEN_KEY = "token";
const USER_KEY = "user";

/* =========================
   🔐 TOKEN METHODS
========================= */

/**
 * ✅ Save JWT token
 */
export const setToken = (token) => {
  if (!token) return;
  localStorage.setItem(TOKEN_KEY, token);
};

/**
 * ✅ Get JWT token
 */
export const getToken = () => {
  return localStorage.getItem(TOKEN_KEY);
};

/**
 * ❌ Remove ONLY token
 */
export const removeToken = () => {
  localStorage.removeItem(TOKEN_KEY);
};

/* =========================
   👤 USER METHODS
========================= */

/**
 * ✅ Save user data (role, name, email)
 */
export const setUser = (user) => {
  if (!user) return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

/**
 * ✅ Get user safely
 */
export const getUser = () => {
  try {
    const user = localStorage.getItem(USER_KEY);
    return user ? JSON.parse(user) : null;
  } catch (error) {
    console.error("❌ User parse error:", error);
    return null;
  }
};

/**
 * ❌ Remove ONLY user
 */
export const removeUser = () => {
  localStorage.removeItem(USER_KEY);
};

/* =========================
   🔁 SESSION METHODS
========================= */

/**
 * 🔥 Save FULL session (login)
 */
export const saveSession = (token, user) => {
  setToken(token);
  setUser(user);
};

/**
 * 🔥 Clear FULL session (logout)
 */
export const clearSession = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

/**
 * ✅ Check if user is logged in
 */
export const isAuthenticated = () => {
  return !!getToken();
};

/**
 * ✅ Get user role
 */
export const getUserRole = () => {
  const user = getUser();
  return user?.role || null;
};

/* =========================
   🚀 EXPORT (COMPATIBILITY)
========================= */

/**
 * ✅ This keeps compatibility with old code
 * (so your existing imports don’t break)
 */
export const tokenManager = {
  getToken,
  setToken,
  removeToken,
  setUser,
  getUser,
  removeUser,
  saveSession,
  clearSession,
  isAuthenticated,
  getUserRole,
};