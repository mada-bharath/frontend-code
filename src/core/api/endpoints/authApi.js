/**
 * =========================================================
 * 🔐 AUTH API (FINAL PRODUCTION READY)
 * =========================================================
 * ✔ Signup
 * ✔ Login
 * ✔ Phone OTP (SNS)
 * ✔ Forgot password
 * ✔ Clean RTK Query setup
 */

import { baseApi } from "../baseApi";

export const authApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getAuthMe: builder.query({
      query: () => "/auth/me",
      providesTags: ["Auth", "Users"],
    }),

    /**
     * 🟢 SIGNUP
     */
    signup: builder.mutation({
      query: (data) => ({
        url: "/auth/signup",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * 🔐 LOGIN (EMAIL/PASSWORD)
     */
    login: builder.mutation({
      query: (data) => ({
        url: "/auth/login",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * 📱 SEND OTP (PHONE - SNS)
     */
    sendOtp: builder.mutation({
      query: (data) => ({
        url: "/auth/send-otp",
        method: "POST",
        body: data, // { phone }
      }),
    }),

    /**
     * ✅ VERIFY OTP (PHONE LOGIN)
     */
    verifyOtp: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-otp",
        method: "POST",
        body: data, // { phone, otp }
      }),
    }),

    /**
     * 📧 FORGOT PASSWORD (EMAIL)
     */
    forgotPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/forgot-password",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * 🔁 RESEND OTP (EMAIL)
     */
    resendOtp: builder.mutation({
      query: (data) => ({
        url: "/auth/resend-otp",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * ✅ VERIFY RESET OTP (EMAIL)
     */
    verifyResetOtp: builder.mutation({
      query: (data) => ({
        url: "/auth/verify-reset-otp",
        method: "POST",
        body: data,
      }),
    }),

    /**
     * 🔐 RESET PASSWORD
     */
    resetPassword: builder.mutation({
      query: (data) => ({
        url: "/auth/reset-password",
        method: "POST",
        body: data,
      }),
    }),

  }),

  overrideExisting: false,
});

/**
 * =========================================================
 * 📦 EXPORT HOOKS (AUTO GENERATED)
 * =========================================================
 */
export const {
  useGetAuthMeQuery,
  useLazyGetAuthMeQuery,
  useSignupMutation,
  useLoginMutation,
  useSendOtpMutation,
  useVerifyOtpMutation,
  useForgotPasswordMutation,
  useResendOtpMutation,
  useVerifyResetOtpMutation,
  useResetPasswordMutation,
} = authApi;
