/**
 * =========================================================
 * 🎓 INSTRUCTORS PAGE (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/admin/pages/Instructors.jsx
 *
 * Full instructor management page for admin dashboard.
 *
 * Features:
 * ✅ Real API — GET /api/admin/instructors (paginated)
 * ✅ Two tabs: Active Instructors | Inactive Instructors
 * ✅ Summary counts: total, active, inactive
 * ✅ Search by name or email
 * ✅ Accordion expand: bio, subjects, assigned courses, contact
 * ✅ Toggle active/inactive (PATCH /instructors/:id/toggle)
 * ✅ Extend time modal (PATCH /instructors/:id/extend)
 * ✅ Reactivate (POST /instructors/:id/reactivate)
 * ✅ Revoke access → demote to student
 * ✅ Days remaining counter with color coding
 * ✅ Extension history log visible in accordion
 * ✅ Loading skeleton + error state
 * ✅ Back button to Manage Users
 * =========================================================
 */

import React, { useState, useMemo } from "react";
import { useNavigate }               from "react-router-dom";
import toast, { Toaster }           from "react-hot-toast";
import {
  ArrowLeft,
  ShieldCheck,
  Search,
  BookOpen,
  Mail,
  Phone,
  ChevronDown,
  UserX,
  Star,
  Clock,
  AlertTriangle,
  Users,
  Activity,
  RefreshCw,
  UserCheck,
  ZapOff,
  Zap,
  Calendar,
  X,
} from "lucide-react";

import {
  useGetInstructorsQuery,
  useToggleInstructorMutation,
  useExtendInstructorMutation,
  useRevokeInstructorAccessMutation,
  useRenewInstructorMutation,
} from "../../../core/api/endpoints/adminApi";

/* ─────────────────────────────────────────
   HELPERS
───────────────────────────────────────── */

/** Days remaining until expiry (negative = expired) */
const getDaysRemaining = (expiryDate) => {
  if (!expiryDate) return null;
  const diffMs = new Date(expiryDate) - new Date();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
};

/** Color class based on days remaining */
const getDaysColor = (days) => {
  if (days === null) return "text-slate-400";
  if (days <= 0)     return "text-red-600";
  if (days <= 7)     return "text-orange-500";
  if (days <= 30)    return "text-yellow-600";
  return "text-emerald-600";
};

/* ─────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────── */
const TableSkeleton = () => (
  <tbody className="divide-y divide-slate-50">
    {[1, 2, 3].map((i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-8 py-5">
          <div className="flex items-center gap-4">
            <div className="h-10 w-10 rounded-full bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-32 bg-slate-200 rounded" />
              <div className="h-3 w-44 bg-slate-100 rounded" />
            </div>
          </div>
        </td>
        <td className="px-8 py-5">
          <div className="flex gap-2">
            <div className="h-5 w-16 bg-slate-200 rounded-full" />
            <div className="h-5 w-16 bg-slate-200 rounded-full" />
          </div>
        </td>
        <td className="px-8 py-5">
          <div className="h-4 w-20 bg-slate-200 rounded" />
        </td>
        <td className="px-8 py-5">
          <div className="flex gap-2">
            <div className="h-9 w-9 bg-slate-200 rounded-xl" />
            <div className="h-9 w-9 bg-slate-200 rounded-xl" />
          </div>
        </td>
      </tr>
    ))}
  </tbody>
);

/* ─────────────────────────────────────────
   EXTEND TIME MODAL
───────────────────────────────────────── */
const ExtendModal = ({ instructor, onClose, onConfirm }) => {
  const [days,   setDays]   = useState(30);
  const [reason, setReason] = useState("");

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-[32px] w-full max-w-md shadow-2xl border border-slate-100 overflow-hidden">
        {/* Modal Header */}
        <div className="p-8 bg-indigo-600 text-white flex justify-between items-center">
          <div>
            <h3 className="text-xl font-black">Extend Access</h3>
            <p className="text-indigo-100 text-xs font-bold mt-1">
              For: {instructor.name || instructor.email}
            </p>
          </div>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 p-2 rounded-xl transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-8 space-y-6">
          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
              Extension Days
            </label>
            {/* Quick select buttons */}
            <div className="flex gap-3 mb-3">
              {[7, 15, 30, 60, 90].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`flex-1 py-2 rounded-xl text-xs font-black transition-all ${
                    days === d
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {d}d
                </button>
              ))}
            </div>
            <input
              type="number"
              min="1"
              max="365"
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-black text-slate-700 text-center text-lg"
            />
            <p className="text-xs text-slate-400 mt-2 text-center">
              Max 365 days per extension
            </p>
          </div>

          <div>
            <label className="text-xs font-black text-slate-400 uppercase tracking-widest block mb-2">
              Reason (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g., Course not complete, extra time needed..."
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 font-semibold text-slate-700 placeholder:text-slate-300"
            />
          </div>

          {instructor.extensionHistory?.length > 0 && (
            <div className="p-4 bg-amber-50 rounded-2xl border border-amber-100">
              <p className="text-xs font-black text-amber-700 uppercase tracking-wider mb-1">
                Previous Extensions
              </p>
              <p className="text-xs text-amber-600 font-bold">
                {instructor.extensionHistory.length} extension
                {instructor.extensionHistory.length !== 1 ? "s" : ""} used of{" "}
                {instructor.maxExtensions || 20} max
              </p>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-8 bg-slate-50/50 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-4 text-slate-400 font-black text-xs uppercase hover:text-slate-600 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={() => onConfirm(days, reason)}
            className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase hover:bg-indigo-700 transition-all shadow-lg"
          >
            Extend Access
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const Instructors = () => {
  const navigate = useNavigate();

  /* ── UI State ── */
  const [activeTab,       setActiveTab]      = useState("all"); // 'all' | 'active' | 'inactive'
  const [search,          setSearch]         = useState("");
  const [expandedId,      setExpandedId]     = useState(null);
  const [extendTarget,    setExtendTarget]   = useState(null); // instructor being extended

  /* ── API: Fetch instructors ──
     Pass status filter to backend for efficient DB query */
  const statusParam = activeTab === "all" ? undefined : activeTab;

  const {
    data:      response,
    isLoading,
    isError,
    refetch,
  } = useGetInstructorsQuery({ status: statusParam, search });

  /* ── Normalize response ── */
  const instructors = useMemo(() => {
    if (!response)                      return [];
    if (Array.isArray(response))        return response;
    if (Array.isArray(response.data))   return response.data;
    return [];
  }, [response]);

  const summary = response?.summary || { total: 0, activeCount: 0, inactiveCount: 0 };

  /* ── API: Mutations ── */
  const [toggleInstructor]        = useToggleInstructorMutation();
  const [extendInstructor]        = useExtendInstructorMutation();
  const [revokeInstructorAccess]  = useRevokeInstructorAccessMutation();
  const [renewInstructor]         = useRenewInstructorMutation();

  /* ─────────────────────────────────────────
     TOGGLE ACTIVE / INACTIVE
  ───────────────────────────────────────── */
  const handleToggle = async (instructor) => {
    try {
      await toggleInstructor(instructor._id).unwrap();
      toast.success(
        instructor.isInstructorActive
          ? `${instructor.name} deactivated`
          : `${instructor.name} activated`
      );
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Toggle failed");
    }
  };

  /* ─────────────────────────────────────────
     EXTEND TIME
  ───────────────────────────────────────── */
  const handleExtendConfirm = async (days, reason) => {
    if (!extendTarget) return;
    try {
      await extendInstructor({
        id:     extendTarget._id,
        days,
        reason,
      }).unwrap();
      toast.success(`Extended by ${days} days 🔄`);
      setExtendTarget(null);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Extension failed");
    }
  };

  /* ─────────────────────────────────────────
     REACTIVATE (via renewInstructor with 30 days)
  ───────────────────────────────────────── */
  const handleReactivate = async (instructor) => {
    try {
      const newExpiry = new Date();
      newExpiry.setDate(newExpiry.getDate() + 30);

      await renewInstructor({
        email:            instructor.email,
        permissionExpiry: newExpiry.toISOString(),
      }).unwrap();

      toast.success(`${instructor.name} reactivated for 30 days ✅`);
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Reactivation failed");
    }
  };

  /* ─────────────────────────────────────────
     REVOKE → DEMOTE TO STUDENT
  ───────────────────────────────────────── */
  const handleRevoke = async (instructor) => {
    try {
      await revokeInstructorAccess({
        instructorId: instructor._id,
        email:        instructor.email,
      }).unwrap();
      toast.success(`${instructor.name} demoted to student`);
      refetch();
      setExpandedId(null);
    } catch (err) {
      toast.error(err?.data?.message || "Revoke failed");
    }
  };

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* Extend Time Modal */}
      {extendTarget && (
        <ExtendModal
          instructor={extendTarget}
          onClose={() => setExtendTarget(null)}
          onConfirm={handleExtendConfirm}
        />
      )}

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
            <ShieldCheck className="text-indigo-600 h-9 w-9" />
            Teaching Staff
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Manage instructor permissions, courses, and teaching profiles.
          </p>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4">
          <div className="bg-white border border-slate-100 px-5 py-4 rounded-2xl text-center shadow-sm">
            <p className="text-2xl font-black text-slate-900">{summary.total}</p>
            <p className="text-xs font-bold text-slate-400 uppercase">Total</p>
          </div>
          <div className="bg-emerald-50 border border-emerald-100 px-5 py-4 rounded-2xl text-center">
            <p className="text-2xl font-black text-emerald-700">
              {summary.activeCount}
            </p>
            <p className="text-xs font-bold text-emerald-500 uppercase">Active</p>
          </div>
          <div className="bg-red-50 border border-red-100 px-5 py-4 rounded-2xl text-center">
            <p className="text-2xl font-black text-red-600">
              {summary.inactiveCount}
            </p>
            <p className="text-xs font-bold text-red-400 uppercase">Inactive</p>
          </div>
        </div>
      </div>

      {/* ── Tabs: All | Active | Inactive ── */}
      <div className="flex gap-2 mb-6 bg-white border border-slate-100 p-2 rounded-2xl w-fit shadow-sm">
        {[
          { key: "all",      label: "All",      icon: Users    },
          { key: "active",   label: "Active",   icon: Activity },
          { key: "inactive", label: "Inactive", icon: ZapOff   },
        ].map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl font-black text-sm transition-all ${
              activeTab === key
                ? "bg-indigo-600 text-white shadow-md"
                : "text-slate-500 hover:text-slate-700 hover:bg-slate-50"
            }`}
          >
            <Icon size={16} />
            {label}
          </button>
        ))}
      </div>

      {/* ── Search Bar ── */}
      <div className="relative mb-8">
        <Search
          className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
          size={22}
        />
        <input
          type="text"
          placeholder="Search instructors by name or email..."
          className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[24px] shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none font-semibold text-slate-700 transition-all placeholder:text-slate-300"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* ── Data Table ── */}
      <div className="bg-white rounded-[32px] shadow-2xl shadow-slate-200/60 border border-slate-100 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50/50 border-b border-slate-100">
            <tr>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Instructor
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Subjects
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                Time Remaining
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
                      Failed to load instructors.
                    </p>
                    <button
                      onClick={refetch}
                      className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold"
                    >
                      Retry
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          )}

          {/* Empty */}
          {!isLoading && !isError && instructors.length === 0 && (
            <tbody>
              <tr>
                <td colSpan="4" className="px-8 py-20 text-center">
                  <ShieldCheck className="h-16 w-16 text-slate-200 mx-auto mb-4" />
                  <p className="text-slate-400 font-bold">
                    No {activeTab !== "all" ? activeTab : ""} instructors found.
                  </p>
                </td>
              </tr>
            </tbody>
          )}

          {/* Data Rows */}
          {!isLoading && !isError && instructors.length > 0 && (
            <tbody className="divide-y divide-slate-50">
              {instructors.map((inst) => {
                const daysLeft  = getDaysRemaining(inst.permissionExpiry);
                const daysColor = getDaysColor(daysLeft);
                const isActive  = inst.isInstructorActive;

                return (
                  <React.Fragment key={inst._id}>
                    {/* ── Main Row ── */}
                    <tr
                      className={`hover:bg-slate-50 transition-all cursor-pointer ${
                        expandedId === inst._id ? "bg-indigo-50/20" : ""
                      }`}
                      onClick={() =>
                        setExpandedId(expandedId === inst._id ? null : inst._id)
                      }
                    >
                      {/* Instructor identity */}
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-4">
                          <div
                            className={`h-11 w-11 rounded-full flex items-center justify-center text-white font-black text-base ${
                              isActive ? "bg-indigo-600" : "bg-slate-400"
                            }`}
                          >
                            {String(inst.name || inst.email)
                              .charAt(0)
                              .toUpperCase()}
                          </div>
                          <div>
                            <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                              {inst.name || "—"}
                              {/* Active/Inactive badge */}
                              <span
                                className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                                  isActive
                                    ? "bg-emerald-100 text-emerald-700"
                                    : "bg-red-100 text-red-600"
                                }`}
                              >
                                {isActive ? "Active" : "Inactive"}
                              </span>
                            </div>
                            <div className="text-xs text-slate-400 font-semibold">
                              {inst.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      {/* Subject tags */}
                      <td className="px-8 py-5">
                        <div className="flex flex-wrap gap-1">
                          {(inst.subjects || []).length > 0 ? (
                            inst.subjects.slice(0, 3).map((s, idx) => (
                              <span
                                key={idx}
                                className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-lg border border-indigo-100"
                              >
                                {s}
                              </span>
                            ))
                          ) : (
                            <span className="text-xs text-slate-300 font-bold italic">
                              No subjects assigned
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Time remaining */}
                      <td className="px-8 py-5">
                        {daysLeft === null ? (
                          <span className="text-sm font-bold text-slate-400">
                            Lifetime
                          </span>
                        ) : daysLeft <= 0 ? (
                          <span className="px-3 py-1 bg-red-50 text-red-600 text-xs font-black rounded-lg border border-red-100">
                            Expired
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Clock size={14} className={daysColor} />
                            <span className={`text-sm font-black ${daysColor}`}>
                              {daysLeft}d remaining
                            </span>
                          </div>
                        )}
                      </td>

                      {/* Action buttons */}
                      <td className="px-8 py-5">
                        <div
                          className="flex justify-center items-center gap-2"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {/* Toggle Active/Inactive */}
                          <button
                            onClick={() => handleToggle(inst)}
                            className={`p-2 rounded-xl transition-all ${
                              isActive
                                ? "text-emerald-600 bg-emerald-50 hover:bg-red-50 hover:text-red-500"
                                : "text-slate-400 bg-slate-50 hover:bg-emerald-50 hover:text-emerald-600"
                            }`}
                            title={isActive ? "Deactivate" : "Activate"}
                          >
                            {isActive ? <Zap size={18} /> : <ZapOff size={18} />}
                          </button>

                          {/* Extend time */}
                          <button
                            onClick={() => setExtendTarget(inst)}
                            className="p-2 text-indigo-500 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-all"
                            title="Extend Time"
                          >
                            <RefreshCw size={18} />
                          </button>

                          {/* Reactivate (only for inactive) */}
                          {!isActive && (
                            <button
                              onClick={() => handleReactivate(inst)}
                              className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-all"
                              title="Reactivate +30 Days"
                            >
                              <UserCheck size={18} />
                            </button>
                          )}

                          {/* Revoke */}
                          <button
                            onClick={() => handleRevoke(inst)}
                            className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"
                            title="Revoke Instructor Access"
                          >
                            <UserX size={18} />
                          </button>

                          {/* Expand arrow */}
                          <div
                            className={`text-slate-300 transition-transform duration-300 ${
                              expandedId === inst._id
                                ? "rotate-180 text-indigo-600"
                                : ""
                            }`}
                          >
                            <ChevronDown size={18} />
                          </div>
                        </div>
                      </td>
                    </tr>

                    {/* ── Accordion Detail Row ── */}
                    {expandedId === inst._id && (
                      <tr>
                        <td colSpan="4" className="px-8 py-0">
                          <div className="bg-white border-x border-b border-indigo-100 rounded-b-[32px] p-8 mb-4 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-8 animate-in slide-in-from-top-2 duration-300">
                            {/* Column 1: Bio + Contact */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                                <BookOpen size={14} className="text-indigo-500" />
                                Teaching Profile
                              </h4>
                              <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-4 rounded-2xl">
                                {inst.bio || "No bio provided yet."}
                              </p>
                              <div className="space-y-2">
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                  <Mail size={14} className="text-indigo-500" />
                                  <span className="text-xs font-bold text-slate-700">
                                    {inst.email}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-xl">
                                  <Phone size={14} className="text-indigo-500" />
                                  <span className="text-xs font-bold text-slate-700">
                                    {inst.phone || "No phone"}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Column 2: Permission Details */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                                <Calendar size={14} className="text-indigo-500" />
                                Permission Status
                              </h4>
                              <div className="space-y-3">
                                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                  <span className="text-xs text-slate-500 font-bold">
                                    Status
                                  </span>
                                  <span
                                    className={`text-xs font-black ${
                                      inst.isInstructorActive
                                        ? "text-emerald-600"
                                        : "text-red-500"
                                    }`}
                                  >
                                    {inst.isInstructorActive
                                      ? "✅ Active"
                                      : "❌ Inactive"}
                                  </span>
                                </div>
                                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                  <span className="text-xs text-slate-500 font-bold">
                                    Expiry
                                  </span>
                                  <span className="text-xs font-black text-slate-700">
                                    {inst.permissionExpiry
                                      ? new Date(
                                          inst.permissionExpiry
                                        ).toLocaleDateString("en-IN", {
                                          day:   "2-digit",
                                          month: "short",
                                          year:  "numeric",
                                        })
                                      : "Lifetime"}
                                  </span>
                                </div>
                                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                  <span className="text-xs text-slate-500 font-bold">
                                    Extensions Used
                                  </span>
                                  <span className="text-xs font-black text-indigo-600">
                                    {inst.extensionHistory?.length || 0} /{" "}
                                    {inst.maxExtensions || 20}
                                  </span>
                                </div>
                                <div className="flex justify-between p-3 bg-slate-50 rounded-xl">
                                  <span className="text-xs text-slate-500 font-bold">
                                    Permission Type
                                  </span>
                                  <span className="text-xs font-black text-slate-700">
                                    {inst.permissionType || "SINGLE"}
                                  </span>
                                </div>
                              </div>

                              {/* Assigned Subjects */}
                              {(inst.subjects || []).length > 0 && (
                                <div className="flex flex-wrap gap-2">
                                  {inst.subjects.map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1.5 bg-indigo-50 text-indigo-700 text-[10px] font-black rounded-xl border border-indigo-100"
                                    >
                                      {s}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>

                            {/* Column 3: Quick Actions */}
                            <div className="space-y-4">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px]">
                                Quick Actions
                              </h4>

                              {/* Toggle button */}
                              <button
                                onClick={() => handleToggle(inst)}
                                className={`w-full flex items-center justify-between p-4 rounded-2xl border font-black text-xs uppercase transition-all ${
                                  inst.isInstructorActive
                                    ? "bg-red-50 text-red-600 border-red-100 hover:bg-red-100"
                                    : "bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100"
                                }`}
                              >
                                <span>
                                  {inst.isInstructorActive
                                    ? "Deactivate"
                                    : "Activate"}
                                </span>
                                {inst.isInstructorActive ? (
                                  <ZapOff size={16} />
                                ) : (
                                  <Zap size={16} />
                                )}
                              </button>

                              {/* Extend time */}
                              <button
                                onClick={() => setExtendTarget(inst)}
                                className="w-full flex items-center justify-between p-4 bg-indigo-50 text-indigo-700 rounded-2xl border border-indigo-100 hover:bg-indigo-100 transition-all font-black text-xs uppercase"
                              >
                                <span>Extend Time</span>
                                <RefreshCw size={16} />
                              </button>

                              {/* Revoke */}
                              <button
                                onClick={() => handleRevoke(inst)}
                                className="w-full flex items-center justify-between p-4 bg-slate-50 text-slate-600 rounded-2xl border border-slate-100 hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-black text-xs uppercase"
                              >
                                <span>Revoke Access</span>
                                <UserX size={16} />
                              </button>

                              {/* Extension history snippet */}
                              {inst.extensionHistory &&
                                inst.extensionHistory.length > 0 && (
                                  <div className="p-3 bg-amber-50 rounded-2xl border border-amber-100">
                                    <p className="text-[10px] font-black text-amber-700 uppercase mb-2">
                                      Last Extension
                                    </p>
                                    <p className="text-xs text-amber-600 font-bold">
                                      +{inst.extensionHistory.at(-1)?.days} days
                                      •{" "}
                                      {inst.extensionHistory.at(-1)?.reason ||
                                        "No reason given"}
                                    </p>
                                  </div>
                                )}
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
    </div>
  );
};

export default Instructors;