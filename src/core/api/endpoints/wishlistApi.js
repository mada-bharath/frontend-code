import { baseApi } from "../baseApi";

export const wishlistApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getWishlist: builder.query({
      query: (params = {}) => ({
        url: "/wishlist",
        method: "GET",
        params,
      }),
      providesTags: (result) =>
        result?.data?.items
          ? [
              ...result.data.items.map((item) => ({
                type: "Wishlist",
                id: item.courseId,
              })),
              { type: "Wishlist", id: "LIST" },
            ]
          : [{ type: "Wishlist", id: "LIST" }],
    }),

    addToWishlist: builder.mutation({
      query: ({ courseId, ...body }) => ({
        url: `/wishlist/${courseId}`,
        method: "POST",
        body,
      }),
      invalidatesTags: [{ type: "Wishlist", id: "LIST" }],
    }),

    removeFromWishlist: builder.mutation({
      query: (courseId) => ({
        url: `/wishlist/${courseId}`,
        method: "DELETE",
      }),
      invalidatesTags: (result, error, courseId) => [
        { type: "Wishlist", id: courseId },
        { type: "Wishlist", id: "LIST" },
      ],
    }),

    clearWishlist: builder.mutation({
      query: () => ({
        url: "/wishlist",
        method: "DELETE",
      }),
      invalidatesTags: [{ type: "Wishlist", id: "LIST" }],
    }),

    checkWishlist: builder.query({
      query: (courseId) => ({
        url: `/wishlist/check/${courseId}`,
        method: "GET",
      }),
      providesTags: (result, error, courseId) => [
        { type: "Wishlist", id: courseId },
      ],
    }),

    updateWishlistItem: builder.mutation({
      query: ({ courseId, ...body }) => ({
        url: `/wishlist/${courseId}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: (result, error, { courseId }) => [
        { type: "Wishlist", id: courseId },
        { type: "Wishlist", id: "LIST" },
      ],
    }),

    updateWishlistSettings: builder.mutation({
      query: (body) => ({
        url: "/wishlist/settings",
        method: "PATCH",
        body,
      }),
      invalidatesTags: [{ type: "Wishlist", id: "LIST" }],
    }),

    bulkAddWishlistToCart: builder.mutation({
      query: () => ({
        url: "/wishlist/bulk/cart",
        method: "POST",
      }),
    }),

    getPublicWishlist: builder.query({
      query: (slug) => ({
        url: `/wishlist/public/${slug}`,
        method: "GET",
      }),
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetWishlistQuery,
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
  useClearWishlistMutation,
  useCheckWishlistQuery,
  useUpdateWishlistItemMutation,
  useUpdateWishlistSettingsMutation,
  useBulkAddWishlistToCartMutation,
  useGetPublicWishlistQuery,
} = wishlistApi;
