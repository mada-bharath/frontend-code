/**
 * =========================================================
 * 🔔 ADMIN NOTIFICATIONS PAGE (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/admin/pages/Notifications.jsx
 *
 * CHANGES FROM PREVIOUS VERSION:
 * ✅ Removed ALL mock data — uses real RTK Query hooks
 * ✅ Fetches live notifications from GET /api/notifications/my
 * ✅ Send broadcast → POST /api/admin/notify-all
 * ✅ Delete button works → DELETE /api/notifications/:id
 *    Admin deletes any notification; it is HARD deleted from DB
 * ✅ Mark All as Read → PATCH /api/notifications/read-all
 * ✅ Pagination — Previous / Next buttons with real page state
 * ✅ Real-time refresh after send / delete / mark-read
 * ✅ Loading skeleton while fetching
 * ✅ Empty state when no notifications exist
 * =========================================================
 */

import React, { useState, useMemo } from "react";
import {
  Bell,
  Send,
  Trash2,
  Users,
  GraduationCap,
  Info,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Megaphone,
  History,
  RefreshCcw,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

/* ─────────────────────────────────────────
   RTK QUERY HOOKS
   Real API — no mock fallback
───────────────────────────────────────── */
import {
  useSendNotificationMutation,
  useCleanupNotificationsMutation,
  useGetNotificationsQuery,
} from "../../../core/api/endpoints/adminApi";

import {
  useMarkAllNotificationsReadMutation,
  useDeleteNotificationMutation,
} from "../../../core/api/endpoints/notificationApi";

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const LIMIT = 10; // notifications per page

/* ─────────────────────────────────────────
   HELPER: colour config per notification type
───────────────────────────────────────── */
const typeConfig = {
  warning: {
    bar:    "bg-amber-500",
    icon:   "bg-amber-50 text-amber-600",
    badge:  "bg-amber-50 text-amber-600 border border-amber-100",
  },
  success: {
    bar:    "bg-emerald-500",
    icon:   "bg-emerald-50 text-emerald-600",
    badge:  "bg-emerald-50 text-emerald-600 border border-emerald-100",
  },
  info: {
    bar:    "bg-indigo-500",
    icon:   "bg-indigo-50 text-indigo-600",
    badge:  "bg-indigo-50 text-indigo-600 border border-indigo-100",
  },
  admin: {
    bar:    "bg-indigo-500",
    icon:   "bg-indigo-50 text-indigo-600",
    badge:  "bg-indigo-50 text-indigo-600 border border-indigo-100",
  },
  system: {
    bar:    "bg-slate-500",
    icon:   "bg-slate-50 text-slate-600",
    badge:  "bg-slate-50 text-slate-600 border border-slate-100",
  },
};

const getTypeConfig = (type) => typeConfig[type] || typeConfig.info;

/* ─────────────────────────────────────────
   SKELETON CARD (loading state)
───────────────────────────────────────── */
const SkeletonCard = () => (
  <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-sm animate-pulse flex gap-6">
    <div className="h-16 w-16 shrink-0 rounded-[20px] bg-slate-100" />
    <div className="flex-1 space-y-3">
      <div className="h-4 bg-slate-100 rounded-xl w-2/3" />
      <div className="h-3 bg-slate-100 rounded-xl w-1/3" />
      <div className="h-3 bg-slate-100 rounded-xl w-full" />
      <div className="h-3 bg-slate-100 rounded-xl w-4/5" />
    </div>
  </div>
);

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
const Notifications = () => {

  /* ── Pagination state ── */
  const [page, setPage] = useState(1);

  /* ── Form state ── */
  const [form, setForm] = useState({
    title:   "",
    message: "",
    target:  "all",
    type:    "info",
  });

  /* ── Delete confirmation state ── */
  const [retentionDays, setRetentionDays] = useState(10);
  const [deletingId, setDeletingId] = useState(null);

  /* ── API: fetch notifications (REAL DB DATA) ── */
  const {
    data:       notifyRes,
    isLoading:  isFetching,
    isFetching: isRefetching,
    refetch,
  } = useGetNotificationsQuery({ page, limit: LIMIT });

  /* ── API: send broadcast ── */
  const [sendNotify, { isLoading: isSending }] = useSendNotificationMutation();
  const [cleanupNotifications, { isLoading: isCleaning }] = useCleanupNotificationsMutation();

  /* ── API: mark all read ── */
  const [markAllRead, { isLoading: isMarkingAll }] = useMarkAllNotificationsReadMutation();

  /* ── API: delete one notification ── */
  const [deleteNotif] = useDeleteNotificationMutation();

  /* ── Derived data ── */
  const notifications = useMemo(
    () => notifyRes?.data || [],
    [notifyRes]
  );

  const pagination = useMemo(
    () => notifyRes?.pagination || { page: 1, totalPages: 1, total: 0 },
    [notifyRes]
  );

  /* ─────────────────────────────────────────
     HANDLERS
  ───────────────────────────────────────── */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!form.title.trim())   return toast.error("Please enter a broadcast title");
    if (!form.message.trim()) return toast.error("Please enter a message");
    if (form.message.trim().length < 5) return toast.error("Message must be at least 5 characters");

    try {
      await sendNotify({
        title:   form.title.trim(),
        message: form.message.trim(),
        target:  form.target,
        type:    form.type,
      }).unwrap();

      toast.success("Broadcast dispatched successfully 🚀");
      setForm({ title: "", message: "", target: "all", type: "info" });
      setPage(1);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to send notification");
    }
  };

  const handleMarkAllRead = async () => {
    try {
      const result = await markAllRead().unwrap();
      toast.success(result?.message || "All notifications marked as read");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to mark all as read");
    }
  };

  const handleDelete = async (id) => {
    setDeletingId(id);
    try {
      await deleteNotif(id).unwrap();
      toast.success("Notification deleted");
      /* If last item on page > 1, go back one page */
      if (notifications.length === 1 && page > 1) {
        setPage((p) => p - 1);
      } else {
        refetch();
      }
    } catch (err) {
      toast.error(err?.data?.message || "Failed to delete notification");
    } finally {
      setDeletingId(null);
    }
  };

  const handleCleanup = async () => {
    const days = Number(retentionDays);

    if (!Number.isInteger(days) || days < 1 || days > 365) {
      return toast.error("Enter days between 1 and 365");
    }

    const confirmed = window.confirm(
      `Delete all notifications older than ${days} day${days === 1 ? "" : "s"}?`
    );

    if (!confirmed) return;

    try {
      const result = await cleanupNotifications({ days }).unwrap();
      const deleted = result?.deletedCount || 0;
      toast.success(`${deleted} old notification${deleted === 1 ? "" : "s"} deleted`);
      setPage(1);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to clean old notifications");
    }
  };

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 font-sans text-slate-900 bg-[#f8fafc] min-h-screen">
      <Toaster position="top-right" />

      {/* ── HEADER ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Bell className="text-indigo-600 h-9 w-9" />
            System Broadcasts
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Dispatch global alerts or targeted messages to your institution.
          </p>
        </div>
        <div className="flex gap-3 items-center">
          {/* Live indicator */}
          <div className="bg-white px-5 py-2.5 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3">
            <div className={`h-2 w-2 rounded-full ${isRefetching ? "bg-amber-400 animate-ping" : "bg-emerald-500 animate-pulse"}`} />
            <span className="text-xs font-black uppercase tracking-widest text-slate-500">
              {isRefetching ? "Syncing..." : "Service Online"}
            </span>
          </div>
          {/* Refresh button */}
          <button
            onClick={() => refetch()}
            disabled={isRefetching}
            className="p-2.5 bg-white border border-slate-100 rounded-2xl shadow-sm text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all active:scale-95 disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCcw size={18} className={isRefetching ? "animate-spin" : ""} />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">

        {/* ════════════════════════════════
            LEFT: BROADCAST ENGINE
        ════════════════════════════════ */}
        <div className="xl:col-span-5">
          <div className="bg-white p-8 rounded-[40px] border border-slate-100 shadow-sm sticky top-24">

            <div className="flex items-center gap-3 mb-8">
              <div className="h-12 w-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center shadow-inner">
                <Megaphone size={24} />
              </div>
              <h2 className="text-xl font-black tracking-tight uppercase">Broadcast Engine</h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">

              {/* TARGET AUDIENCE */}
              <div className="space-y-3">
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
                  Target Audience
                </label>
                <div className="grid grid-cols-3 gap-3">
                  {["all", "instructors", "students"].map((t) => (
                    <button
                      key={t}
                      type="button"
                      onClick={() => setForm((prev) => ({ ...prev, target: t }))}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${
                        form.target === t
                          ? "bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100"
                          : "bg-slate-50 border-slate-100 text-slate-400 hover:bg-white"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* TITLE */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Broadcast Title
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Server Maintenance Notice"
                  maxLength={100}
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all"
                />
              </div>

              {/* MESSAGE */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 px-1">
                  Message Content
                </label>
                <textarea
                  name="message"
                  value={form.message}
                  onChange={handleInputChange}
                  rows="5"
                  maxLength={500}
                  placeholder="Draft your announcement here..."
                  className="w-full px-6 py-4 bg-slate-50 border-none rounded-2xl font-medium text-slate-600 outline-none focus:ring-4 focus:ring-indigo-500/10 transition-all resize-none"
                />
                <div className="flex justify-end mt-2">
                  <span className={`text-[10px] font-black uppercase ${form.message.length > 400 ? "text-amber-500" : "text-slate-300"}`}>
                    {form.message.length}/500 characters
                  </span>
                </div>
              </div>

              {/* URGENCY / TYPE */}
              <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-[24px] border border-slate-100">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Urgency</span>
                <div className="flex gap-3 flex-1 justify-end">
                  {[
                    { key: "info",    Icon: Info,           bg: "bg-indigo-500"  },
                    { key: "warning", Icon: AlertTriangle,  bg: "bg-amber-500"   },
                    { key: "success", Icon: CheckCircle2,   bg: "bg-emerald-500" },
                  ].map(({ key, Icon, bg }) => (
                    <button
                      key={key}
                      type="button"
                      title={key}
                      onClick={() => setForm((prev) => ({ ...prev, type: key }))}
                      className={`h-10 w-10 rounded-full flex items-center justify-center transition-all shadow-sm ${bg} ${
                        form.type === key
                          ? "ring-4 ring-indigo-500/10 scale-110 opacity-100"
                          : "opacity-40 grayscale hover:opacity-100 hover:grayscale-0"
                      }`}
                    >
                      <Icon size={18} color="white" />
                    </button>
                  ))}
                </div>
              </div>

              {/* SUBMIT */}
              <button
                type="submit"
                disabled={isSending}
                className="w-full py-6 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-[3px] hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSending
                  ? <><RefreshCcw className="animate-spin" size={18} /> Sending...</>
                  : <><Send size={18} /> Dispatch Broadcast</>
                }
              </button>

            </form>
          </div>
        </div>

        {/* ════════════════════════════════
            RIGHT: AUDIT LOG (REAL DB DATA)
        ════════════════════════════════ */}
        <div className="xl:col-span-7 space-y-6">

          {/* Section header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between px-1 gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white rounded-xl shadow-sm border border-slate-100">
                <History className="text-indigo-600" size={20} />
              </div>
              <div>
                <h3 className="font-black text-sm uppercase tracking-widest text-slate-500">
                  Audit Log
                </h3>
                {pagination.total > 0 && (
                  <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                    {pagination.total} notification{pagination.total !== 1 ? "s" : ""} total
                  </p>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 sm:items-center">
              {notifications.length > 0 && (
                <button
                  onClick={handleMarkAllRead}
                  disabled={isMarkingAll}
                  className="text-[10px] font-black text-indigo-600 uppercase tracking-widest hover:underline bg-white px-4 py-2 rounded-xl border border-slate-100 shadow-sm transition-all active:scale-95 disabled:opacity-50"
                >
                  {isMarkingAll ? "Marking..." : "Mark All as Read"}
                </button>
              )}

              <div className="flex items-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                {[10, 20].map((days) => (
                  <button
                    key={days}
                    type="button"
                    onClick={() => setRetentionDays(days)}
                    className={`h-9 px-3 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${
                      Number(retentionDays) === days
                        ? "bg-slate-900 text-white"
                        : "bg-slate-50 text-slate-400 hover:text-slate-700"
                    }`}
                  >
                    {days}d
                  </button>
                ))}
                <input
                  type="number"
                  min="1"
                  max="365"
                  value={retentionDays}
                  onChange={(e) => setRetentionDays(e.target.value)}
                  className="h-9 w-16 rounded-lg bg-slate-50 px-2 text-center text-xs font-black text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500/20"
                  title="Retention days"
                />
                <button
                  type="button"
                  onClick={handleCleanup}
                  disabled={isCleaning}
                  title="Delete notifications older than selected days"
                  className="h-9 w-9 rounded-lg bg-red-50 text-red-500 flex items-center justify-center hover:bg-red-100 transition-all active:scale-95 disabled:opacity-50"
                >
                  {isCleaning
                    ? <RefreshCcw size={15} className="animate-spin" />
                    : <Trash2 size={15} />
                  }
                </button>
              </div>
            </div>
          </div>

          {/* ── Loading skeletons ── */}
          {isFetching && !isRefetching && (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => <SkeletonCard key={i} />)}
            </div>
          )}

          {/* ── Notification cards (REAL DATA) ── */}
          {!isFetching && (
            <div className="space-y-4">
              {notifications.length > 0
                ? notifications.map((notif) => {
                    const cfg        = getTypeConfig(notif.type);
                    const isDeleting = deletingId === notif._id;
                    const audience   = (notif.target || "ALL").toLowerCase();

                    return (
                      <div
                        key={notif._id}
                        className={`bg-white p-6 rounded-[32px] border shadow-sm hover:shadow-md transition-all group flex gap-6 relative overflow-hidden ${
                          !notif.isRead ? "border-indigo-100" : "border-slate-100"
                        } ${isDeleting ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        {/* Unread indicator dot */}
                        {!notif.isRead && (
                          <div className="absolute top-5 right-16 h-2 w-2 rounded-full bg-indigo-500" />
                        )}

                        {/* Left colour bar */}
                        <div className={`absolute left-0 top-0 h-full w-1.5 ${cfg.bar}`} />

                        {/* Icon */}
                        <div className={`h-16 w-16 shrink-0 rounded-[20px] flex items-center justify-center shadow-inner ${cfg.icon}`}>
                          {audience === "instructors"
                            ? <GraduationCap size={28} />
                            : <Users size={28} />
                          }
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-start mb-2">
                            <div>
                              <h4 className="font-black text-xl tracking-tight text-slate-800 leading-none mb-1 group-hover:text-indigo-600 transition-colors">
                                {notif.title}
                              </h4>
                              <div className="flex items-center gap-2 text-slate-400">
                                <Clock size={12} />
                                <span className="text-[10px] font-bold uppercase tracking-tighter">
                                  {new Date(notif.createdAt).toLocaleString(undefined, {
                                    dateStyle: "medium",
                                    timeStyle: "short",
                                  })}
                                </span>
                              </div>
                            </div>
                          </div>

                          <p className="text-sm text-slate-500 font-medium leading-relaxed mb-5">
                            {notif.message}
                          </p>

                          {/* Footer: badges + delete button */}
                          <div className="flex items-center justify-between pt-5 border-t border-slate-50">
                            <div className="flex gap-2 flex-wrap">
                              <span className="px-3 py-1.5 bg-slate-50 border border-slate-100 rounded-xl text-[9px] font-black text-slate-400 uppercase tracking-widest">
                                Audience: {audience}
                              </span>
                              <span className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest ${cfg.badge}`}>
                                {notif.type || "info"}
                              </span>
                              {!notif.isRead && (
                                <span className="px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl text-[9px] font-black text-indigo-500 uppercase tracking-widest">
                                  Unread
                                </span>
                              )}
                            </div>

                            {/* ✅ DELETE BUTTON — hard deletes from DB */}
                            <button
                              onClick={() => handleDelete(notif._id)}
                              disabled={isDeleting}
                              title="Delete this notification"
                              className="p-2.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all active:scale-90 disabled:opacity-50 group/del"
                            >
                              {isDeleting
                                ? <RefreshCcw size={18} className="animate-spin text-slate-400" />
                                : <Trash2 size={18} className="group-hover/del:scale-110 transition-transform" />
                              }
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })
                : (
                  /* ── Empty state ── */
                  <div className="py-24 flex flex-col items-center justify-center bg-white rounded-[48px] border-2 border-dashed border-slate-100">
                    <div className="p-10 bg-slate-50 rounded-full mb-6 shadow-inner">
                      <Bell className="text-slate-200 h-16 w-16" />
                    </div>
                    <h3 className="text-2xl font-black text-slate-400 uppercase tracking-[4px]">
                      Logs Clear
                    </h3>
                    <p className="text-slate-300 font-bold text-sm mt-2 max-w-xs text-center">
                      No broadcasts sent yet. Use the engine on the left to dispatch your first notification.
                    </p>
                  </div>
                )
              }
            </div>
          )}

          {/* ── PAGINATION ── */}
          {!isFetching && pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-6 pt-8 pb-10">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl font-black text-xs text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft size={16} /> Previous
              </button>

              <div className="px-5 py-2.5 bg-indigo-50 rounded-xl">
                <span className="font-black text-xs text-indigo-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
              </div>

              <button
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page >= pagination.totalPages}
                className="flex items-center gap-2 px-6 py-3 bg-white border border-slate-100 rounded-2xl font-black text-xs text-slate-400 hover:bg-slate-50 transition-all uppercase tracking-widest shadow-sm active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};

export default Notifications;
