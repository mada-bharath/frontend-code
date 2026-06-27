import { baseApi } from "../baseApi";

export const progressApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCourseProgress: builder.query({
      query: (courseId) => `/progress/${courseId}`,
      providesTags: (result, error, courseId) => [
        { type: "Progress", id: courseId },
      ],
    }),

    saveProgress: builder.mutation({
      query: (body) => ({
        url: "/progress",
        method: "POST",
        body,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Progress", id: courseId },
      ],
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetCourseProgressQuery,
  useLazyGetCourseProgressQuery,
  useSaveProgressMutation,
} = progressApi;
