import { baseApi } from "../baseApi";

export const userApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getMe: builder.query({
      query: () => "/users/me",
      providesTags: ["Users"],
    }),

    updateMe: builder.mutation({
      query: (data) => ({
        url: "/users/me",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Users", "Auth"],
    }),

    changePassword: builder.mutation({
      query: (data) => ({
        url: "/users/me/password",
        method: "PUT",
        body: data,
      }),
    }),
  }),

  overrideExisting: false,
});

export const {
  useGetMeQuery,
  useUpdateMeMutation,
  useChangePasswordMutation,
} = userApi;
