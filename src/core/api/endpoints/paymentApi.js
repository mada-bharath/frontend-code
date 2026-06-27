/**
 * =========================================================
 * 💳 PAYMENT API — RTK QUERY (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/core/api/endpoints/paymentApi.js
 * =========================================================
 */

import { baseApi } from "../baseApi";

export const paymentApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    /* ── Validate coupon before payment ── */
    validateCoupon: builder.mutation({
      query: ({ code, courseId }) => ({
        url:    "/payments/validate-coupon",
        method: "POST",
        body:   { code, courseId },
      }),
    }),

    /* ── STEP 1: Create Razorpay order ── */
    createOrder: builder.mutation({
      query: ({ courseId, couponCode }) => ({
        url:    "/payments/create-order",
        method: "POST",
        body:   { courseId, couponCode },
      }),
    }),

    /* Create one Razorpay order for all selected wishlist courses */
    createWishlistOrder: builder.mutation({
      query: ({ courseIds }) => ({
        url:    "/payments/create-wishlist-order",
        method: "POST",
        body:   { courseIds },
      }),
    }),

    /* ── STEP 2: Verify payment signature ── */
    verifyPayment: builder.mutation({
      query: (data) => ({
        url:    "/payments/verify",
        method: "POST",
        body:   data,
      }),
      invalidatesTags: ["Purchases", "MyCourses"],
    }),

    /* ── Handle failure ── */
    handlePaymentFailure: builder.mutation({
      query: (data) => ({
        url:    "/payments/failed",
        method: "POST",
        body:   data,
      }),
    }),

    /* ── Recovery ── */
    recoverPayment: builder.mutation({
      query: ({ razorpayPaymentId }) => ({
        url:    "/payments/recover",
        method: "POST",
        body:   { razorpayPaymentId },
      }),
      invalidatesTags: ["Purchases", "MyCourses"],
    }),

    /* ── Check order status (page refresh) ── */
    checkPaymentStatus: builder.query({
      query: (orderId) => `/payments/status/${orderId}`,
    }),

    /* ── User payment history ── */
    getMyPaymentHistory: builder.query({
      query: ({ page = 1, limit = 10, status = "all" } = {}) => {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (status && status !== "all") {
          params.set("status", status);
        }

        return `/payments/my-history?${params.toString()}`;
      },
      providesTags: ["PaymentHistory"],
    }),

    /* ── User's purchased courses ── */
    deleteFailedPayment: builder.mutation({
      query: (id) => ({
        url:    `/payments/failed/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["PaymentHistory", "MyCourses", "Purchases"],
    }),

    getPaymentMyCourses: builder.query({
      query: () => "/payments/my-courses",
      providesTags: ["MyCourses", "Purchases"],
    }),

    /* ── Check access to a course ── */
    checkCourseAccess: builder.query({
      query: (courseId) => `/payments/access/${courseId}`,
      providesTags: (result, error, courseId) => [{ type: "Purchases", id: courseId }],
    }),

    /* ── Admin: all payments ── */
    adminGetAllPayments: builder.query({
      query: ({ page = 1, limit = 20, status = "all" } = {}) =>
        `/payments/admin/all?page=${page}&limit=${limit}&status=${status}`,
      providesTags: ["AdminPayments"],
    }),

  }),
});

export const {
  useValidateCouponMutation,
  useCreateOrderMutation,
  useCreateWishlistOrderMutation,
  useVerifyPaymentMutation,
  useHandlePaymentFailureMutation,
  useRecoverPaymentMutation,
  useCheckPaymentStatusQuery,
  useGetMyPaymentHistoryQuery,
  useDeleteFailedPaymentMutation,
  useGetPaymentMyCoursesQuery,
  useCheckCourseAccessQuery,
  useAdminGetAllPaymentsQuery,
} = paymentApi;
