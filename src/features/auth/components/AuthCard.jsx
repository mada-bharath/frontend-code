import React from "react";

/**
 * 🎨 PREMIUM AUTH CARD (GRAPHY STYLE - FINAL)
 * Features:
 * - Glassmorphism UI
 * - BV Logo support
 * - Title + Subtitle
 * - Trusted users section (with avatars)
 * - Fully reusable (Login / Signup / OTP)
 * - Mobile responsive
 */

export default function AuthCard({ children, title, subtitle }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-600 via-purple-600 to-blue-600 px-4">

      {/* Card Container */}
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-8 rounded-2xl shadow-2xl w-full max-w-md">

        {/* 🔷 Logo */}
        <div className="flex justify-center mb-4">
          <img
            src="/assets/logo.svg" // ✅ your BV logo
            alt="BV Logo"
            className="w-12 h-12"
          />
        </div>

        {/* 🔷 Title */}
        <h2 className="text-2xl font-bold text-white text-center">
          {title}
        </h2>

        {/* 🔷 Subtitle */}
        {subtitle && (
          <p className="text-gray-300 text-center mt-1 mb-6 text-sm">
            {subtitle}
          </p>
        )}

        {/* 🔷 Form Content */}
        <div className="space-y-4">
          {children}
        </div>

        {/* 🔷 Trusted Section */}
        <div className="mt-8 text-center">

          {/* Avatars */}
          <div className="flex justify-center -space-x-2 mb-2">
            <img
              src="https://i.pravatar.cc/40?img=1"
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <img
              src="https://i.pravatar.cc/40?img=2"
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <img
              src="https://i.pravatar.cc/40?img=3"
              className="w-8 h-8 rounded-full border-2 border-white"
            />
            <img
              src="https://i.pravatar.cc/40?img=4"
              className="w-8 h-8 rounded-full border-2 border-white"
            />
          </div>

          {/* Text */}
          <p className="text-gray-300 text-sm">
            Trusted by{" "}
            <span className="font-semibold text-white">
              20,000+ students
            </span>{" "}
            ⭐
          </p>
        </div>

      </div>
    </div>
  );
}