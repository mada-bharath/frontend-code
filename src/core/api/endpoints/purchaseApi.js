/**
 * 📚 PURCHASE API
 */

import { baseApi } from "../baseApi";

export const purchaseApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getPurchasedCourses: builder.query({
      query: () => "/purchases/my-courses",
      providesTags: ["Courses"],
    }),
  }),
});

export const { useGetPurchasedCoursesQuery } = purchaseApi;
