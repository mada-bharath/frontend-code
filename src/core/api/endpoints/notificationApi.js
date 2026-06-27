/**
 * =========================================================
 * 🔔 NOTIFICATION API (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/core/api/endpoints/notificationApi.js
 *
 * Exports hooks for:
 * ✅ Admin: send broadcast notifications
 * ✅ User:  get my notifications (paginated)
 * ✅ User:  get unread count (bell badge)
 * ✅ User:  mark one as read
 * ✅ User:  mark all as read
 * ✅ User:  delete a notification
 *
 * Route map (must match backend notification.routes.js):
 *   POST  /notifications/send-all      → admin broadcast
 *   GET   /notifications/my            → user's notifications
 *   GET   /notifications/unread-count  → unread badge count
 *   PATCH /notifications/:id/read      → mark one read
 *   PATCH /notifications/read-all      → mark all read
 *   DELETE /notifications/:id          → delete one
 * =========================================================
 */

import { baseApi } from "../baseApi";

/* ─────────────────────────────────────────
   TAG TYPES
───────────────────────────────────────── */
const TAGS = {
  NOTIFICATIONS: "Notifications",
  UNREAD_COUNT:  "UnreadCount",
};

/* ─────────────────────────────────────────
   INJECT ENDPOINTS INTO BASE API
───────────────────────────────────────── */
export const notificationApi = baseApi.injectEndpoints({
  endpoints: (builder) => ({

    /* ═══════════════════════════════════════
       📡 ADMIN: SEND BROADCAST NOTIFICATION
       POST /api/notifications/send-all
       Body: { title, message, type?, target? }
       Called by: Notifications.jsx (admin page)
    ═══════════════════════════════════════ */
    sendNotificationToAll: builder.mutation({
      query: ({ title, message, type = "admin", target = "ALL" }) => ({
        url:    "/notifications/send-all",
        method: "POST",
        body:   { title, message, type, target },
      }),
      /* Refresh the notification list after sending */
      invalidatesTags: [TAGS.NOTIFICATIONS],
    }),

    /* ═══════════════════════════════════════
       📋 GET MY NOTIFICATIONS (PAGINATED)
       GET /api/notifications/my?page=1&limit=10
       Called by: NotificationList.jsx, Notifications.jsx
    ═══════════════════════════════════════ */
    getMyNotifications: builder.query({
      query: ({ page = 1, limit = 10 } = {}) =>
        `/notifications/my?page=${page}&limit=${limit}`,
      providesTags: [TAGS.NOTIFICATIONS],
      /* Keep previous data while fetching next page (smooth UX) */
      keepUnusedDataFor: 30,
    }),

    /* ═══════════════════════════════════════
       🔢 GET UNREAD COUNT (BELL BADGE)
       GET /api/notifications/unread-count
       Called by: Navbar bell icon
    ═══════════════════════════════════════ */
    getUnreadCount: builder.query({
      query: () => "/notifications/unread-count",
      providesTags: [TAGS.UNREAD_COUNT],
      /* Poll every 60 seconds to keep badge fresh */
      pollingInterval: 60_000,
    }),

    /* ═══════════════════════════════════════
       ✅ MARK ONE NOTIFICATION AS READ
       PATCH /api/notifications/:id/read
    ═══════════════════════════════════════ */
    markNotificationRead: builder.mutation({
      query: (id) => ({
        url:    `/notifications/${id}/read`,
        method: "PATCH",
      }),
      invalidatesTags: [TAGS.NOTIFICATIONS, TAGS.UNREAD_COUNT],
    }),

    /* ═══════════════════════════════════════
       ✅ MARK ALL NOTIFICATIONS AS READ
       PATCH /api/notifications/read-all
    ═══════════════════════════════════════ */
    markAllNotificationsRead: builder.mutation({
      query: () => ({
        url:    "/notifications/read-all",
        method: "PATCH",
      }),
      invalidatesTags: [TAGS.NOTIFICATIONS, TAGS.UNREAD_COUNT],
    }),

    /* ═══════════════════════════════════════
       ❌ DELETE ONE NOTIFICATION
       DELETE /api/notifications/:id
    ═══════════════════════════════════════ */
    deleteNotification: builder.mutation({
      query: (id) => ({
        url:    `/notifications/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: [TAGS.NOTIFICATIONS, TAGS.UNREAD_COUNT],
    }),

  }),
});

/* ─────────────────────────────────────────
   EXPORT HOOKS
───────────────────────────────────────── */
export const {
  /* Admin */
  useSendNotificationToAllMutation,

  /* User */
  useGetMyNotificationsQuery,
  useGetUnreadCountQuery,
  useMarkNotificationReadMutation,
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} = notificationApi;