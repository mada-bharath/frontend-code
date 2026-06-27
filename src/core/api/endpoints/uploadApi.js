/**
 * =========================================================
 * 📤 UPLOAD API (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/core/api/endpoints/uploadApi.js
 *
 * ✅ getPresignedUrl   — get S3 upload URL before upload
 * ✅ confirmUpload     — save video to DB after S3 upload
 * ✅ deleteVideo       — delete from S3 + DB
 * ✅ getCourseVideos   — list all videos for a course
 * =========================================================
 */

import { baseApi } from "../baseApi";

export const uploadApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    /* ── Get presigned S3 URL ── */
    getPresignedUrl: builder.mutation({
      query: (data) => ({
        url:    "/upload/presigned-url",
        method: "POST",
        body:   data,
      }),
    }),

    /* ── Confirm upload + save to DB ── */
    confirmUpload: builder.mutation({
      query: (data) => ({
        url:    "/upload/confirm",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Courses", "InstructorDashboard"],
    }),

    /* ── Delete video ── */
    deleteUploadedVideo: builder.mutation({
      query: ({ courseId, sectionId, videoId }) => ({
        url:    `/upload/video/${courseId}/${sectionId}/${videoId}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Courses", "InstructorDashboard"],
    }),

    /* ── Get all videos for a course ── */
    getCourseVideos: builder.query({
      query: (courseId) => `/upload/courses/${courseId}/videos`,
      providesTags: ["Courses"],
    }),

  }),
});

export const {
  useGetPresignedUrlMutation,
  useConfirmUploadMutation,
  useDeleteUploadedVideoMutation,
  useGetCourseVideosQuery,
} = uploadApi; 