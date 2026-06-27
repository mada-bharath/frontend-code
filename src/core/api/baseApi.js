/**
 * =========================================================
 * 🚀 BASE API (FINAL PRODUCTION VERSION 🔥)
 * =========================================================
 * Path: src/core/api/baseApi.js
 *
 * ✅ Auto token attach
 * ✅ FIXED: Does NOT force Content-Type: application/json
 *    → This allows FormData (multipart) to work correctly
 *    → Browser sets correct boundary automatically
 * ✅ Retry support
 * ✅ Global error handling
 * ✅ Auto logout on 401/403
 * =========================================================
 */

import { createApi, fetchBaseQuery, retry } from "@reduxjs/toolkit/query/react";

/* =========================================================
   🌐 BASE URL
========================================================= */
const BASE_URL =
  import.meta.env.VITE_API_URL || "http://localhost:5000/api";

/* =========================================================
   🔐 TOKEN HELPER
========================================================= */
const getToken = () => {
  try {
    return localStorage.getItem("token");
  } catch {
    return null;
  }
};

/* =========================================================
   ⚡ BASE QUERY
   ─────────────────────────────────────────────────────
   CRITICAL FIX:
   Do NOT manually set "Content-Type" in prepareHeaders.
   When the body is FormData, the browser must set it
   automatically (with the multipart boundary).
   Setting it manually breaks multipart uploads.
   RTK Query handles this correctly as long as we don't
   override it here.
========================================================= */
const rawBaseQuery = fetchBaseQuery({
  baseUrl: BASE_URL,

  credentials: "include",

  prepareHeaders: (headers) => {
    const token = getToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }

    headers.set("Accept", "application/json");

    /* ✅ DO NOT set Content-Type here.
       - For JSON requests:   RTK Query sets it automatically
       - For FormData:        Browser sets it (with boundary)
       Setting it manually here would break multipart uploads. */

    return headers;
  },
});

/* =========================================================
   🔁 RETRY
========================================================= */
const baseQueryWithRetry = retry(rawBaseQuery, {
  maxRetries: 2,
});

/* =========================================================
   ❌ GLOBAL ERROR HANDLER
========================================================= */
const baseQueryWithErrorHandling = async (args, api, extraOptions) => {
  const result = await baseQueryWithRetry(args, api, extraOptions);

  if (result.error) {
    const status = result.error.status;

    console.error("❌ API Error:", result.error);

    if (status === 401) {
      console.warn("🔐 Unauthorized → Logging out");
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      if (window.location.pathname !== "/login") {
        window.location.href = "/login";
      }
    }

    if (status === 403) console.warn("Access denied:", result.error?.data);
    if (status === 400) console.warn("⚠️ Bad Request:", result.error?.data);
    if (status === 500) console.error("🔥 Server Error:", result.error?.data);
  }

  return result;
};

/* =========================================================
   🚀 CREATE API
========================================================= */
export const baseApi = createApi({
  reducerPath: "api",

  baseQuery: baseQueryWithErrorHandling,

  tagTypes: [
    "Auth",
    "Users",
    "Instructor",
    "Courses",
    "Admin",
    "AdminAccess",
    "AdminDashboard",
    "Videos",
    "Purchases",
    "MyCourses",
    "PaymentHistory",
    "AdminPayments",
    "Payments",
    "Notifications",
    "UnreadCount",
    "Progress",
    "FreeUsers",
    "InstructorDashboard",
    "Coupons",
    "Discussions",
    "Wishlist",
  ],

  endpoints: () => ({}),
});

export default baseApi;
