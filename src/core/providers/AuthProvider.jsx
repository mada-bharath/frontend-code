/**
 * =========================================================
 * 🔥 AUTH CONTEXT (FINAL ENTERPRISE PRODUCTION 🔥)
 * =========================================================
 */

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLazyGetAuthMeQuery } from "../api/endpoints/authApi";
import {
  getToken,
  setToken as saveToken,
  removeToken,
} from "../../utils/tokenManager";
import { normalizeAdminAccess } from "../../constants/adminPages";

const AuthContext = createContext();

/* =========================================================
   🧠 NORMALIZE USER (CRITICAL)
========================================================= */
const normalizeUser = (user) => {
  if (!user) return null;

  return {
    ...user,
    role: user?.role?.toLowerCase() || "student",
    status: user?.status || "pending",

    /* 🔥 IMPORTANT FLAGS */
    isInstructorActive: Boolean(user?.isInstructorActive),
    approvedByAdmin: Boolean(user?.approvedByAdmin),

    /* 🔥 FIX: allow null expiry */
    permissionExpiry: user?.permissionExpiry || null,
    adminAccess: normalizeAdminAccess(user?.adminAccess),
  };
};

const getRoleRedirectPath = (role) => {
  if (role === "admin") return "/admin/dashboard";
  if (role === "instructor") return "/instructor/dashboard";
  return "/courses";
};

const isSafeRedirectPath = (path) =>
  Boolean(path && path.startsWith("/") && !path.startsWith("//"));

export const AuthProvider = ({ children }) => {
  const navigate = useNavigate();
  const [getAuthMe] = useLazyGetAuthMeQuery();

  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(null);
  const [loading, setLoading] = useState(true);

  /* =========================================================
     🔄 RESTORE SESSION
  ========================================================= */
  useEffect(() => {
    try {
      const storedToken = getToken();
      const storedUser = localStorage.getItem("user");

      if (storedToken && storedUser) {
        const parsedUser = JSON.parse(storedUser);

        if (!parsedUser?.role) {
          removeToken();
          localStorage.removeItem("user");
        } else {
          const normalizedUser = normalizeUser(parsedUser);
          setTokenState(storedToken);
          setUser(normalizedUser);
        }
      } else {
        setUser(null);
        setTokenState(null);
      }
    } catch (error) {
      console.error("❌ Restore error:", error);
      removeToken();
      localStorage.removeItem("user");
    } finally {
      setLoading(false);
    }
  }, []);

  /* =========================================================
     🔥 REFRESH USER FROM BACKEND (VERY IMPORTANT)
  ========================================================= */
  const refreshUser = useCallback(async () => {
    try {
      const token = getToken();
      if (!token) return;

      const data = await getAuthMe().unwrap();

      /* ❌ Prevent HTML crash */
      if (data?.user) {
        const updatedUser = normalizeUser(data.user);

        localStorage.setItem("user", JSON.stringify(updatedUser));
        setUser(updatedUser);

        console.log("✅ User refreshed:", updatedUser);
      }
    } catch (err) {
      console.error("❌ Refresh user failed:", err.message);
    }
  }, [getAuthMe]);

  /* =========================================================
     🔁 AUTO REFRESH
  ========================================================= */
  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, [token, refreshUser]);

  /* =========================================================
     🔔 ADMIN ALERTS (OPTIONAL UX)
  ========================================================= */
  useEffect(() => {
    if (!user) return;

    try {
      const key = `admin_popup_${user._id}`;
      if (localStorage.getItem(key)) return;

      if (user?.isFreeAccess) {
        alert("🎉 You got FREE ACCESS from Admin!");
      }

      if (user?.role === "instructor" && user?.isInstructorActive) {
        alert("🚀 You are now an INSTRUCTOR!");
      }

      localStorage.setItem(key, "true");
    } catch (err) {
      console.error("Popup error:", err);
    }
  }, [user]);

  /* =========================================================
     🔐 LOGIN
  ========================================================= */
  const login = (token, userData, expectedRole = null, redirectPath = null) => {
    try {
      if (!token || !userData) {
        return { success: false, message: "Invalid login data" };
      }

      const role = userData?.role?.toLowerCase();

      if (!role) {
        return { success: false, message: "Role missing" };
      }

      if (expectedRole && role !== expectedRole) {
        return {
          success: false,
          message: `Not authorized as ${expectedRole}`,
        };
      }

      const normalizedUser = normalizeUser(userData);

      saveToken(token);
      localStorage.setItem("user", JSON.stringify(normalizedUser));

      setTokenState(token);
      setUser(normalizedUser);

      /* 🔥 IMPORTANT */
      setTimeout(() => refreshUser(), 100);

      /* 🔀 REDIRECT */
      setTimeout(() => {
        navigate(
          isSafeRedirectPath(redirectPath)
            ? redirectPath
            : getRoleRedirectPath(role)
        );
      }, 150);

      return { success: true };
    } catch (error) {
      console.error("❌ Login error:", error);
      return { success: false, message: "Login failed" };
    }
  };

  /* =========================================================
     🚪 LOGOUT
  ========================================================= */
  const logout = () => {
    removeToken();
    localStorage.removeItem("user");
    sessionStorage.clear();
    setUser(null);
    setTokenState(null);
    navigate("/login", { replace: true });
  };

  /* =========================================================
     ✅ ROLE HELPERS (🔥 FINAL FIX)
  ========================================================= */
  const isAuthenticated = () => !!token;

  const isAdmin = () => user?.role === "admin";

  const isInstructor = () => {
    if (!user) return false;

    return (
      user.role === "instructor" &&
      user.isInstructorActive === true &&
      user.approvedByAdmin === true &&
      (
        !user.permissionExpiry || // ✅ FIXED
        new Date(user.permissionExpiry) > new Date()
      )
    );
  };

  const isStudent = () => user?.role === "student";

  /* =========================================================
     🚀 PROVIDER
  ========================================================= */
  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        setUser,
        login,
        logout,
        refreshUser,
        isAuthenticated,
        isAdmin,
        isInstructor,
        isStudent,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

/* =========================================================
   🎯 HOOK
========================================================= */
export const useAuth = () => useContext(AuthContext);
