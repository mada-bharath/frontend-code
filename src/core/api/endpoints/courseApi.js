import { baseApi } from "../baseApi";

export const courseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    /* =====================================================
       🌍 GET PUBLIC COURSES
    ===================================================== */
    getCourses: builder.query({
      query: ({
        search = "",
        scope = "course",
        filter = "all",
        level = "all",
        language = "all",
        tag = "allcourses",
        page = 1,
        limit = 12,
      } = {}) => ({
        url: `/courses`,
        method: "GET",
        params: { search, scope, type: filter, level, language, tag, page, limit },
      }),

      providesTags: (result) =>
        result?.data
          ? [
              ...result.data.map((course) => ({
                type: "Courses",
                id: course._id,
              })),
              { type: "Courses", id: "LIST" },
            ]
          : [{ type: "Courses", id: "LIST" }],
    }),

    /* =====================================================
       📘 GET COURSE BY ID
    ===================================================== */
    getCourseById: builder.query({
      query: (id) => `/courses/${id}`,

      providesTags: (result, error, id) => [
        { type: "Courses", id },
      ],
    }),

    getCoursePlayer: builder.query({
      query: (id) => `/media/course/${id}`,

      providesTags: (result, error, id) => [
        { type: "Courses", id },
        { type: "Progress", id },
      ],
    }),

    getCourseLanguages: builder.query({
      query: () => ({
        url: `/courses/languages`,
        method: "GET",
      }),

      providesTags: [{ type: "Courses", id: "LANGUAGES" }],
    }),

    getCourseTags: builder.query({
      query: () => ({
        url: `/courses/tags`,
        method: "GET",
      }),

      providesTags: [{ type: "Courses", id: "TAGS" }],
    }),

    rateCourse: builder.mutation({
      query: ({ id, rating }) => ({
        url: `/courses/${id}/rating`,
        method: "POST",
        body: { rating },
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Courses", id },
        { type: "Courses", id: "LIST" },
      ],
    }),

    /* =====================================================
       👑 ADMIN COURSES
    ===================================================== */
    getAdminCourses: builder.query({
      query: (params = {}) => ({
        url: `/courses/admin/all`,
        method: "GET",
        params,
      }),

      providesTags: [{ type: "Courses", id: "LIST" }],
    }),

    /* =====================================================
       ➕ CREATE COURSE
    ===================================================== */
    createCourse: builder.mutation({
      query: (formData) => ({
        url: `/courses/admin/create`,
        method: "POST",
        body: formData,
      }),

      invalidatesTags: [{ type: "Courses", id: "LIST" }],
    }),

    /* =====================================================
       ✏️ UPDATE COURSE
    ===================================================== */
    updateCourse: builder.mutation({
      query: ({ id, data }) => ({
        url: `/courses/admin/update/${id}`,
        method: "PUT",
        body: data,
      }),

      invalidatesTags: (result, error, { id }) => [
        { type: "Courses", id },
        { type: "Courses", id: "LIST" },
      ],
    }),

    /* =====================================================
       ❌ DELETE COURSE
    ===================================================== */
    deleteCourse: builder.mutation({
      query: (id) => ({
        url: `/courses/${id}`,
        method: "DELETE",
      }),

      invalidatesTags: [{ type: "Courses", id: "LIST" }],
    }),

    /* =====================================================
       🎓 INSTRUCTOR COURSES
    ===================================================== */
    getInstructorCourses: builder.query({
      query: () => ({
        url: `/courses/instructor`,
        method: "GET",
      }),

      providesTags: [{ type: "Courses", id: "LIST" }],
    }),

    /* =====================================================
       📤 SUBMIT COURSE
    ===================================================== */
    submitCourse: builder.mutation({
      query: (id) => ({
        url: `/courses/submit/${id}`,
        method: "PUT",
      }),

      invalidatesTags: [{ type: "Courses", id: "LIST" }],
    }),

    /* =====================================================
       📚 ADD SECTION
    ===================================================== */
    addSection: builder.mutation({
      query: ({ courseId, data }) => ({
        url: `/courses/${courseId}/section`,
        method: "POST",
        body: data,
      }),

      invalidatesTags: (result, error, { courseId }) => [
        { type: "Courses", id: courseId },
      ],
    }),

    /* =====================================================
       🎬 ADD VIDEO (FIXED 🔥)
    ===================================================== */
    addVideo: builder.mutation({
      query: ({ courseId, sectionId, data }) => ({
        url: `/courses/${courseId}/section/${sectionId}/video`,
        method: "POST",
        body: data,
      }),

      // ✅ FIXED (THIS WAS YOUR CRASH)
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Courses", id: courseId },
      ],
    }),

    /* =====================================================
       🛑 DELETE VIDEO (FIXED 🔥)
    ===================================================== */
    deleteVideo: builder.mutation({
      query: ({ courseId, sectionId, videoId }) => ({
        url: `/courses/admin/video/${courseId}/${sectionId}/${videoId}`,
        method: "DELETE",
      }),

      // ✅ FIXED (THIS WAS YOUR CRASH)
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Courses", id: courseId },
      ],
    }),

  }),

  overrideExisting: false,
});

/* =========================================================
   ✅ EXPORT HOOKS
========================================================= */
export const {
  useGetCoursesQuery,
  useGetCourseLanguagesQuery,
  useGetCourseTagsQuery,
  useGetCourseByIdQuery,
  useGetCoursePlayerQuery,
  useRateCourseMutation,
  useGetAdminCoursesQuery,
  useCreateCourseMutation,
  useUpdateCourseMutation,
  useDeleteCourseMutation,
  useGetInstructorCoursesQuery,
  useSubmitCourseMutation,
  useAddSectionMutation,
  useAddVideoMutation,
  useDeleteVideoMutation,
} = courseApi;
