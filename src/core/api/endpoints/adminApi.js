import { baseApi } from "../baseApi";

const TAGS = {
  DASHBOARD: "AdminDashboard",
  USERS: "Users",
  COURSES: "Courses",
  INSTRUCTOR: "Instructor",
  COUPONS: "Coupons",
  FREE_USERS: "FreeUsers",
  NOTIFICATIONS: "Notifications",
  ADMIN_ACCESS: "AdminAccess",
};

export const adminApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getDashboard: builder.query({
      query: () => "/admin/stats",
      providesTags: [TAGS.DASHBOARD],
    }),

    getPendingCourses: builder.query({
      query: () => ({
        url: "/admin/courses",
        method: "GET",
        params: { status: "pending", limit: 100 },
      }),
      providesTags: [TAGS.COURSES],
    }),

    getUsers: builder.query({
      query: () => "/admin/users",
      providesTags: [TAGS.USERS],
    }),

    getAdminAccessOptions: builder.query({
      query: () => "/admin/admin-access/options",
      providesTags: [TAGS.ADMIN_ACCESS],
    }),

    getAdminAccessUsers: builder.query({
      query: (params = {}) => ({
        url: "/admin/admin-access/users",
        method: "GET",
        params,
      }),
      providesTags: [TAGS.ADMIN_ACCESS, TAGS.USERS],
    }),

    updateAdminAccess: builder.mutation({
      query: ({ id, fullAccess, pages }) => ({
        url: `/admin/admin-access/users/${id}`,
        method: "PUT",
        body: { fullAccess, pages },
      }),
      invalidatesTags: [TAGS.ADMIN_ACCESS, TAGS.USERS, "Auth"],
    }),

    revokeAdminAccess: builder.mutation({
      query: (id) => ({
        url: `/admin/admin-access/users/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TAGS.ADMIN_ACCESS, TAGS.USERS, "Auth"],
    }),

    updateUserRole: builder.mutation({
      query: ({ id, role }) => ({
        url: `/admin/users/${id}/role`,
        method: "PUT",
        body: { role },
      }),
      invalidatesTags: [TAGS.USERS, TAGS.INSTRUCTOR],
    }),

    toggleUserBlock: builder.mutation({
      query: ({ id, isBlocked }) => ({
        url: `/admin/users/${id}/block`,
        method: "PUT",
        body: { isBlocked },
      }),
      invalidatesTags: [TAGS.USERS],
    }),

    getFreeUsers: builder.query({
      query: () => "/admin/free-users",
      providesTags: [TAGS.FREE_USERS],
    }),

    giveFreeAccess: builder.mutation({
      query: (data) => ({
        url: "/admin/free-access",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [TAGS.USERS, TAGS.FREE_USERS],
    }),

    revokeFreeAccess: builder.mutation({
      query: (data) => ({
        url: "/admin/revoke-access",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [TAGS.USERS, TAGS.FREE_USERS],
    }),

    getInstructors: builder.query({
      query: (params = {}) => ({
        url: "/admin/instructors",
        method: "GET",
        params,
      }),
      providesTags: [TAGS.INSTRUCTOR],
    }),

    toggleInstructor: builder.mutation({
      query: (id) => ({
        url: `/admin/instructors/${id}/toggle`,
        method: "PATCH",
      }),
      invalidatesTags: [TAGS.INSTRUCTOR],
    }),

    extendInstructor: builder.mutation({
      query: ({ id, days }) => ({
        url: `/admin/instructors/${id}/extend`,
        method: "PATCH",
        body: { days },
      }),
      invalidatesTags: [TAGS.INSTRUCTOR],
    }),

    assignModule: builder.mutation({
      query: ({ id, data }) => ({
        url: `/admin/instructors/${id}/assign`,
        method: "POST",
        body: data,
      }),
      invalidatesTags: [TAGS.INSTRUCTOR],
    }),

    inviteInstructor: builder.mutation({
      query: ({ email, permissionExpiry }) => ({
        url: "/admin/instructors/invite",
        method: "POST",
        body: { email, permissionExpiry },
      }),
      invalidatesTags: [TAGS.INSTRUCTOR],
    }),

    updateInstructorStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/instructors/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: [TAGS.INSTRUCTOR],
    }),

    assignCourse: builder.mutation({
      query: ({ instructorId, courseId, moduleName, sectionId }) => ({
        url: "/admin/instructors/assign-course",
        method: "POST",
        body: {
          instructorId,
          courseId,
          ...(moduleName && { moduleName }),
          ...(sectionId && { sectionId }),
        },
      }),
      invalidatesTags: [TAGS.INSTRUCTOR, TAGS.COURSES],
    }),

    revokeInstructorAccess: builder.mutation({
      query: (data) => ({
        url: "/admin/instructors/revoke",
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [TAGS.INSTRUCTOR, TAGS.USERS],
    }),

    renewInstructor: builder.mutation({
      query: ({ email, permissionExpiry, instructorId, days }) => ({
        url: "/admin/instructors/renew",
        method: "POST",
        body: {
          ...(email && { email }),
          ...(instructorId && { instructorId }),
          ...(days && { days }),
          ...(permissionExpiry && { permissionExpiry }),
        },
      }),
      invalidatesTags: [TAGS.INSTRUCTOR],
    }),

    grantInstructor: builder.mutation({
      query: (id) => ({
        url: `/admin/instructors/${id}/grant`,
        method: "PUT",
      }),
      invalidatesTags: [TAGS.INSTRUCTOR, TAGS.USERS],
    }),

    getAdminCourseList: builder.query({
      query: () => "/admin/courses",
      providesTags: [TAGS.COURSES],
    }),

    getAdminCourseById: builder.query({
      query: (id) => `/admin/courses/${id}`,
      providesTags: [TAGS.COURSES],
    }),

    createAdminCourse: builder.mutation({
      query: (formData) => ({
        url: "/admin/courses",
        method: "POST",
        body: formData,
        formData: true,
      }),
      invalidatesTags: [TAGS.COURSES, TAGS.INSTRUCTOR],
    }),

    updateAdminCourse: builder.mutation({
      query: ({ id, data }) => ({
        url: `/admin/courses/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [TAGS.COURSES],
    }),

    deleteAdminCourse: builder.mutation({
      query: (id) => ({
        url: `/admin/courses/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TAGS.COURSES],
    }),

    deleteAdminCourseVideo: builder.mutation({
      query: ({ courseId, sectionId, videoId }) => ({
        url: `/admin/courses/${courseId}/sections/${sectionId}/videos/${videoId}`,
        method: "DELETE",
      }),
      invalidatesTags: [TAGS.COURSES],
    }),

    updateAdminCourseStatus: builder.mutation({
      query: ({ id, status }) => ({
        url: `/admin/courses/${id}/status`,
        method: "PUT",
        body: { status },
      }),
      invalidatesTags: [TAGS.COURSES],
    }),

    giveAccess: builder.mutation({
      query: (data) => ({
        url: "/admin/give-access",
        method: "POST",
        body: data,
      }),
    }),

    getCoupons: builder.query({
      query: () => "/admin/coupons",
      providesTags: [TAGS.COUPONS],
    }),

    createCoupon: builder.mutation({
      query: (data) => ({
        url: "/admin/coupons",
        method: "POST",
        body: data,
      }),
      invalidatesTags: [TAGS.COUPONS],
    }),

    updateCoupon: builder.mutation({
      query: ({ id, data }) => ({
        url: `/admin/coupons/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: [TAGS.COUPONS],
    }),

    deleteCoupon: builder.mutation({
      query: (id) => ({
        url: `/admin/coupons/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TAGS.COUPONS],
    }),

    sendNotification: builder.mutation({
      query: ({ title, message, target = "all", type = "info" }) => ({
        url: "/admin/notify-all",
        method: "POST",
        body: { title, message, target, type },
      }),
      invalidatesTags: [TAGS.NOTIFICATIONS],
    }),

    cleanupNotifications: builder.mutation({
      query: ({ days }) => ({
        url: "/admin/notifications/cleanup",
        method: "DELETE",
        body: { days },
      }),
      invalidatesTags: [TAGS.NOTIFICATIONS, "UnreadCount"],
    }),

    getNotifications: builder.query({
      query: ({ page = 1, limit = 20 } = {}) =>
        `/notifications/my?page=${page}&limit=${limit}`,
      providesTags: [TAGS.NOTIFICATIONS],
    }),
  }),
});

export const {
  useGetDashboardQuery,
  useGetPendingCoursesQuery,
  useGetUsersQuery,
  useGetAdminAccessOptionsQuery,
  useGetAdminAccessUsersQuery,
  useUpdateAdminAccessMutation,
  useRevokeAdminAccessMutation,
  useUpdateUserRoleMutation,
  useToggleUserBlockMutation,
  useGetFreeUsersQuery,
  useGiveFreeAccessMutation,
  useRevokeFreeAccessMutation,
  useGetInstructorsQuery,
  useToggleInstructorMutation,
  useExtendInstructorMutation,
  useAssignModuleMutation,
  useInviteInstructorMutation,
  useUpdateInstructorStatusMutation,
  useAssignCourseMutation,
  useRevokeInstructorAccessMutation,
  useRenewInstructorMutation,
  useGrantInstructorMutation,
  useGetAdminCourseListQuery,
  useGetAdminCourseByIdQuery,
  useCreateAdminCourseMutation,
  useUpdateAdminCourseMutation,
  useDeleteAdminCourseMutation,
  useDeleteAdminCourseVideoMutation,
  useUpdateAdminCourseStatusMutation,
  useGiveAccessMutation,
  useGetCouponsQuery,
  useCreateCouponMutation,
  useUpdateCouponMutation,
  useDeleteCouponMutation,
  useSendNotificationMutation,
  useCleanupNotificationsMutation,
  useGetNotificationsQuery,
} = adminApi;
