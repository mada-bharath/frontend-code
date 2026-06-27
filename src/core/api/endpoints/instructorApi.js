/**
 * =========================================================
 * INSTRUCTOR API (RTK QUERY - FINAL PRODUCTION)
 * =========================================================
 * Path: src/core/api/endpoints/instructorApi.js
 *
 * Backend mount: /api/instructor
 *
 * Supported backend routes:
 * - GET  /api/instructor/dashboard
 * - GET  /api/instructor/courses?page=1&limit=12&status=all
 * - GET  /api/instructor/analytics
 * - PUT  /api/instructor/submit/:courseId
 * - POST /api/instructor/courses/:courseId/sections
 * - POST /api/instructor/courses/:courseId/sections/:sectionId/videos
 *
 * Important:
 * S3 direct-upload APIs are intentionally kept in uploadApi.js:
 * - POST /api/upload/presigned-url
 * - POST /api/upload/confirm
 * This prevents duplicate RTK endpoint names and wrong /media/* calls.
 * =========================================================
 */

import { baseApi } from "../baseApi";

export const instructorApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    /* Dashboard */
    getInstructorDashboard: builder.query({
      query: () => "/instructor/dashboard",
      providesTags: ["InstructorDashboard", "Courses"],
    }),

    /* My courses */
    getInstructorMyCourses: builder.query({
      query: ({ page = 1, limit = 12, status } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (status && status !== "all") {
          params.set("status", status);
        }

        return `/instructor/courses?${params.toString()}`;
      },
      providesTags: ["Courses"],
    }),

    /* Instructor analytics */
    getInstructorAnalytics: builder.query({
      query: () => "/instructor/analytics",
      providesTags: ["InstructorDashboard", "Courses"],
    }),

    /* Submit course for approval */
    submitInstructorCourse: builder.mutation({
      query: (courseId) => ({
        url: `/instructor/submit/${courseId}`,
        method: "PUT",
      }),
      invalidatesTags: ["InstructorDashboard", "Courses"],
    }),

    /* Add section */
    addInstructorSection: builder.mutation({
      query: ({ courseId, title, description = "" }) => ({
        url: `/instructor/courses/${courseId}/sections`,
        method: "POST",
        body: { title, description },
      }),
      invalidatesTags: ["InstructorDashboard", "Courses"],
    }),

    /* Add video through backend-handled multipart upload */
    addInstructorVideo: builder.mutation({
      query: ({ courseId, sectionId, formData }) => ({
        url: `/instructor/courses/${courseId}/sections/${sectionId}/videos`,
        method: "POST",
        body: formData,
      }),
      invalidatesTags: ["InstructorDashboard", "Courses"],
    }),
  }),
});

export const {
  useGetInstructorDashboardQuery,
  useGetInstructorMyCoursesQuery,
  useGetInstructorAnalyticsQuery,
  useSubmitInstructorCourseMutation,
  useAddInstructorSectionMutation,
  useAddInstructorVideoMutation,
} = instructorApi;
