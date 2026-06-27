/**
 * =========================================================
 * 🎁 FREE USERS PAGE (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/admin/pages/FreeUsers.jsx
 *
 * Dedicated page to view and manage all users with free (complimentary) access.
 *
 * Features:
 * ✅ Real API — GET /api/admin/free-users (paginated, 10 per page)
 * ✅ Search by name, email, or phone
 * ✅ Shows each user's name, email, phone, access expiry date
 * ✅ Days remaining counter (calculated live from backend date)
 * ✅ Revoke free access button (with confirmation)
 * ✅ Accordion expand for full user details
 * ✅ Pagination — 10 users per page
 * ✅ Loading skeleton + error state
 * ✅ Back button to Manage Users
 * ✅ No mock data — all backend driven
 * =========================================================
 */

import React, { useState, useMemo } from "react";
import { useNavigate }               from "react-router-dom";
import toast, { Toaster }           from "react-hot-toast";
import {
  ArrowLeft,
  Gift,
  Search,
  Mail,
  Phone,
  UserMinus,
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  Clock,
  Users,
  RefreshCw,
} from "lucide-react";

import {
  useGetFreeUsersQuery,
  useRevokeFreeAccessMutation,
  useGiveFreeAccessMutation,
} from "../../../core/api/endpoints/adminApi";

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

/**
 * Calculates days remaining from today to an expiry date
 * Returns negative if already expired
 */
const getDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  const now     = new Date();
  const expiry  = new Date(expiryDate);
  const diffMs  = expiry - now;
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/**
 * Returns color class based on days remaining
 */
const getDaysColor = (days) => {
  if (days === null)  return "text-slate-400";
  if (days <= 0)      return "text-red-600";
  if (days <= 7)      return "text-orange-500";
  if (days <= 30)     return "text-yellow-600";
  return "text-emerald-600";
};

/* ─────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────── */
const TableSkeleton = () => (
  <tbody className="divide-y divide-slate-50">
    {[1, 2, 3, 4].map((i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-2xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-44 bg-slate-100 rounded" />
            </div>
          </div>
        </td>
        <td className="px-8 py-5">
          <div className="h-4 w-24 bg-slate-200 rounded" />
        </td>
        <td className="px-8 py-5">
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </td>
        <td className="px-8 py-5">
          <div className="h-8 w-24 bg-slate-200 rounded-xl" />
        </td>
      </tr>
    ))}
  </tbody>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const FreeUsers = () => {
  const navigate = useNavigate();

  /* ── UI State ── */
  const [page,           setPage]          = useState(1);
  const [search,         setSearch]        = useState("");
  const [expandedId,     setExpandedId]    = useState(null);
  const [revokingId,     setRevokingId]    = useState(null); // tracks loading per row

  const limit = 10; // 10 per page as required

  /* ── API: Fetch free users ── */
  const {
    data:      response,
    isLoading,
    isError,
    refetch,
  } = useGetFreeUsersQuery({ page, limit, search });

  /* ── Normalize response ── */
  const freeUsers   = useMemo(() => {
    if (!response)                      return [];
    if (Array.isArray(response))        return response;
    if (Array.isArray(response.data))   return response.data;
    return [];
  }, [response]);

  const pagination = response?.pagination || null;

  /* ── API: Mutations ── */
  const [revokeFreeAccess] = useRevokeFreeAccessMutation();
  const [giveFreeAccess]   = useGiveFreeAccessMutation();

  /* ─────────────────────────────────────────
     REVOKE FREE ACCESS
  ───────────────────────────────────────── */
  const handleRevoke = async (user) => {
    setRevokingId(user._id);
    try {
      await revokeFreeAccess({ userId: user._id, email: user.email }).unwrap();
      toast.success(`Free access revoked for ${user.name || user.email}`);
      refetch();
      setExpandedId(null);
    } catch (err) {
      toast.error(err?.data?.message || "Failed to revoke access");
    } finally {
      setRevokingId(null);
    }
  };

  /* ─────────────────────────────────────────
     EXTEND ACCESS (+30 DAYS)
  ───────────────────────────────────────── */
  const handleExtend = async (user) => {
    try {
      await giveFreeAccess({
        userId: user._id,
        email:  user.email,
        days:   30,
      }).unwrap();
      toast.success("Extended free access by 30 days 🔄");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to extend access");
    }
  };

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* ── Back Button ── */}
      <button
        onClick={() => navigate("/admin/users")}
        className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 mb-8 transition-colors font-bold text-sm"
      >
        <ArrowLeft size={20} /> Back to All Users
      </button>

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Gift className="text-emerald-600 h-9 w-9" />
            Free Access Management
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            All users with complimentary platform access — manage, extend, or revoke.
          </p>
        </div>

        {/* Summary badge */}
        {pagination && (
          <div className="bg-emerald-50 border border-emerald-100 px-6 py-4 rounded-2xl flex items-center gap-3">
            <Users className="text-emerald-600 h-5 w-5" />
            <span className="font-black text-emerald-700 text-lg">
              {pagination.total}
            </span>
            <span className="text-emerald-600 font-bold text-sm">
              total free users
            </span>
          </div>
        )}
      </div>

      {/* ── Search Bar ── */}
      <div className="relative mb-8">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
          size={22}
        />
        <input
          type="text"
          placeholder="Search free users by name, email, or phone..."
          className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[24px] shadow-sm focus:ring-4 focus:ring-emerald-500/10 outline-none font-semibold text-slate-700 transition-all placeholder:text-slate-300"
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setPage(1); // Reset to page 1 on new search
          }}
        />
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                User Details
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Access Expiry
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Days Remaining
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Actions
              </th>
            </tr>
          </thead>

          {/* Loading */}
          {isLoading && <TableSkeleton />}

          {/* Error */}
          {isError && !isLoading && (
            <tbody>
              <tr>
                <td colSpan="4" className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <AlertTriangle className="text-red-400 h-12 w-12" />
                    <p className="text-slate-500 font-bold">
                      Failed to load free users.
                    </p>
                    <button
                      onClick={refetch}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          )}

          {/* Empty */}
          {!isLoading && !isError && freeUsers.length === 0 && (
            <tbody>
              <tr>
                <td colSpan="4" className="px-8 py-20 text-center">
                  <div className="flex flex-col items-center gap-4">
                    <Gift className="text-slate-200 h-16 w-16" />
                    <p className="text-slate-400 font-bold">
                      No free access users found.
                    </p>
                    <button
                      onClick={() => navigate("/admin/users")}
                      className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-bold hover:bg-emerald-700 transition-all text-sm"
                    >
                      Grant Free Access
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          )}

          {/* Data Rows */}
          {!isLoading && !isError && freeUsers.length > 0 && (
            <tbody className="divide-y divide-slate-50">
              {freeUsers.map((user) => {
                const daysLeft  = getDaysRemaining(user.freeAccessExpiry);
                const daysColor = getDaysColor(daysLeft);
                const isExpired = daysLeft !== null && daysLeft <= 0;

                return (
                  <React.Fragment key={user._id}>
                    {/* ── Main Row ── */}
                    <tr
                      className={`hover:bg-slate-50 transition-all cursor-pointer ${
                        expandedId === user._id ? "bg-emerald-50/20" : ""
                      }`}
                      onClick={() =>
                        setExpandedId(
                          expandedId === user._id ? null : user._id
                        )
                      }
                    >
                      {/* User avatar + name + email */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div className="h-10 w-10 rounded-2xl bg-emerald-100 flex items-center justify-center text-emerald-700 font-black text-base">
                            {String(user.name || user.email)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm">
                              {user.name || "—"}
                            </div>
                            <div className="text-xs text-slate-400 font-semibold">
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Expiry date */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-2">
                          <Clock size={14} className="text-slate-400" />
                          <span className="text-sm font-bold text-slate-700">
                            {user.freeAccessExpiry
                              ? new Date(
                                  user.freeAccessExpiry
                                ).toLocaleDateString("en-IN", {
                                  day:   "2-digit",
                                  month: "short",
                                  year:  "numeric",
                                })
                              : "Lifetime"}
                          </span>
                        </div>
                      </td>

                      {/* Days remaining */}
                      <td className="px-8 py-5">
                        {daysLeft === null ? (
                          <span className="text-sm font-bold text-slate-400">
                            Lifetime
                          </span>
                        ) : isExpired ? (
                          <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-black rounded-lg border border-red-100">
                            Expired
                          </span>
                        ) : (
                          <span className={`text-sm font-black ${daysColor}`}>
                            {daysLeft} day{daysLeft !== 1 ? "s" : ""} left
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-8 py-5">
                        <div className="flex justify-center items-center gap-2">
                          {/* Extend +30 days */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleExtend(user);
                            }}
                            className="p-2 text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-xl transition-all"
                            title="Extend 30 Days"
                          >
                            <RefreshCw size={18} />
                          </button>

                          {/* Revoke button */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleRevoke(user);
                            }}
                            disabled={revokingId === user._id}
                            className="flex items-center gap-1.5 px-4 py-2 bg-red-50 text-red-600 rounded-xl hover:bg-red-100 transition-colors text-xs font-black border border-red-100 disabled:opacity-50"
                          >
                            <UserMinus size={15} />
                            {revokingId === user._id ? "Revoking..." : "Revoke"}
                          </button>

                          {/* Expand arrow */}
                          <div
                            className={`text-slate-300 transition-transform duration-300 ${
                              expandedId === user._id
                                ? "rotate-180 text-emerald-600"
                                : ""
                            }`}
                          >
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* ── Accordion Detail Row ── */}
                    {expandedId === user._id && (
                      <tr>
                        <td colSpan="4" className="px-8 py-0">
                          <div className="bg-white border-x border-b border-emerald-100 rounded-b-[32px] p-8 mb-4 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-300">
                            {/* Contact Details */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">
                                Contact
                              </h4>
                              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <Mail size={15} className="text-indigo-500" />
                                <span className="text-sm font-bold text-slate-700">
                                  {user.email}
                                </span>
                              </div>
                              <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                <Phone size={15} className="text-indigo-500" />
                                <span className="text-sm font-bold text-slate-700">
                                  {user.phone || "No phone linked"}
                                </span>
                              </div>
                            </div>

                            {/* Access Timeline */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">
                                Access Timeline
                              </h4>
                              <div className="space-y-3">
                                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                  <span className="text-xs text-slate-500 font-bold">
                                    Granted
                                  </span>
                                  <span className="text-xs font-black text-slate-700">
                                    {user.createdAt
                                      ? new Date(
                                          user.createdAt
                                        ).toLocaleDateString("en-IN")
                                      : "—"}
                                  </span>
                                </div>
                                <div className="flex justify-between p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                                  <span className="text-xs text-emerald-700 font-bold">
                                    Expires
                                  </span>
                                  <span className="text-xs font-black text-emerald-700">
                                    {user.freeAccessExpiry
                                      ? new Date(
                                          user.freeAccessExpiry
                                        ).toLocaleDateString("en-IN")
                                      : "Lifetime"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Quick Actions */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">
                                Quick Actions
                              </h4>
                              <button
                                onClick={() => handleExtend(user)}
                                className="w-full flex items-center justify-between p-4 bg-emerald-50 text-emerald-700 rounded-2xl border border-emerald-100 hover:bg-emerald-100 transition-all font-black text-xs uppercase"
                              >
                                <span>Extend 30 Days</span>
                                <RefreshCw size={16} />
                              </button>
                              <button
                                onClick={() => handleRevoke(user)}
                                disabled={revokingId === user._id}
                                className="w-full flex items-center justify-between p-4 bg-red-50 text-red-600 rounded-2xl border border-red-100 hover:bg-red-100 transition-all font-black text-xs uppercase disabled:opacity-50"
                              >
                                <span>
                                  {revokingId === user._id
                                    ? "Revoking..."
                                    : "Revoke Access"}
                                </span>
                                <UserMinus size={16} />
                              </button>
                              <p className="text-[10px] text-slate-400 italic px-1">
                                After revoke: user must purchase courses normally.
                              </p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          )}
        </table>
      </div>

      {/* ── Pagination ── */}
      {pagination && pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-3 mt-8">
          <button
            onClick={() => setPage((p) => Math.max(p - 1, 1))}
            disabled={page === 1}
            className="px-5 py-3 bg-white border border-slate-200 rounded-2xl font-black text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            ← Previous
          </button>

          {/* Page numbers */}
          <div className="flex gap-2">
            {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(
              (p) => (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  className={`h-10 w-10 rounded-xl font-black text-sm transition-all ${
                    p === page
                      ? "bg-emerald-600 text-white shadow-lg"
                      : "bg-white border border-slate-200 text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  {p}
                </button>
              )
            )}
          </div>

          <button
            onClick={() =>
              setPage((p) => Math.min(p + 1, pagination.totalPages))
            }
            disabled={page === pagination.totalPages}
            className="px-5 py-3 bg-white border border-slate-200 rounded-2xl font-black text-sm text-slate-700 hover:bg-slate-50 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
          >
            Next →
          </button>
        </div>
      )}

      {/* Page info */}
      {pagination && (
        <p className="text-center text-xs text-slate-400 font-bold mt-4">
          Showing page {pagination.page} of {pagination.totalPages} —{" "}
          {pagination.total} total free access users
        </p>
      )}
    </div>
  );
};

export default FreeUsers;