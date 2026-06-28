import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";

/**
 * 👑 ADMIN LAYOUT (FINAL - PRODUCTION READY 🔥)
 *
 * ✅ Supports React Router (Outlet)
 * ✅ Keeps backward compatibility (children)
 * ✅ Sidebar + Navbar + Logout
 * ✅ No breaking changes
 */

export default function AdminLayout({ children }) {
  const navigate = useNavigate();

  /* ================= LOGOUT ================= */
  const handleLogout = () => {
    try {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      sessionStorage.clear();

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">

      {/* ================= SIDEBAR ================= */}
      <div className="w-64 fixed top-0 left-0 h-full z-40 bg-black">
        <Sidebar />
      </div>

      {/* ================= MAIN ================= */}
      <div className="flex-1 ml-64 flex flex-col">

        {/* ================= NAVBAR ================= */}
        <div className="sticky top-0 z-30 bg-white shadow-sm flex justify-between items-center px-6 py-4">

          {/* LEFT */}
          <h1 className="text-xl font-semibold">
            Admin Panel
          </h1>

          {/* RIGHT */}
          <div className="flex items-center gap-4">

            {/* USER */}
            <span className="text-sm text-gray-600">
              {JSON.parse(localStorage.getItem("user"))?.email || "Admin"}
            </span>

            {/* LOGOUT */}
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm"
            >
              Logout
            </button>

          </div>
        </div>

        {/* ================= PAGE CONTENT ================= */}
        <main className="p-6 flex-1">

          {/* 🔥 THIS FIXES YOUR ISSUE */}
          {children || <Outlet />}

        </main>

      </div>
    </div>
  );
}
