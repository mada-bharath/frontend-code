/**
 * =========================================================
 * 👥 MANAGE USERS PAGE (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/admin/pages/ManageUsers.jsx
 *
 * FIXES IN THIS VERSION:
 * ─────────────────────────────────────────────────────────
 * FIX 1: handleRenewTime
 *   Old: sent { email, permissionExpiry: computedISOString }
 *        Backend received a date string, then called instructor.save()
 *        → triggered bcrypt pre-save hook → 500
 *
 *   New: sends { email, days: 30 }
 *        Backend uses findByIdAndUpdate (no save hook) → works perfectly
 *
 * FIX 2: API response shape normalisation
 *   Supports { data: [...] }, { users: [...] }, or direct array
 *   so any backend response shape works.
 *
 * No other logic changed. UI/UX is identical.
 * ─────────────────────────────────────────────────────────
 */

import React, { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Users,
  UserPlus,
  ShieldCheck,
  Gift,
  ChevronDown,
  Search,
  UserMinus,
  UserCheck,
  XCircle,
  Filter,
  Mail,
  Phone,
  RefreshCw,
  UserX,
  AlertTriangle,
} from "lucide-react";

import {
  useGetUsersQuery,
  useUpdateUserRoleMutation,
  useGiveFreeAccessMutation,
  useRevokeFreeAccessMutation,
  useRevokeInstructorAccessMutation,
  useRenewInstructorMutation,
} from "../../../core/api/endpoints/adminApi";

/* ─────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────── */
const TableSkeleton = () => (
  <tbody className="divide-y divide-slate-50">
    {[1, 2, 3].map((i) => (
      <tr key={i} className="animate-pulse">
        <td className="px-8 py-6">
          <div className="flex items-center gap-5">
            <div className="h-12 w-12 rounded-2xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-4 w-36 bg-slate-200 rounded-lg" />
              <div className="h-3 w-48 bg-slate-100 rounded-lg" />
            </div>
          </div>
        </td>
        <td className="px-8 py-6">
          <div className="h-6 w-20 bg-slate-200 rounded-lg" />
        </td>
        <td className="px-8 py-6">
          <div className="flex justify-center gap-3">
            <div className="h-10 w-10 bg-slate-200 rounded-2xl" />
            <div className="h-10 w-10 bg-slate-200 rounded-2xl" />
            <div className="h-10 w-10 bg-slate-200 rounded-2xl" />
          </div>
        </td>
      </tr>
    ))}
  </tbody>
);

/* ─────────────────────────────────────────
   ERROR STATE
───────────────────────────────────────── */
const ErrorState = ({ refetch }) => (
  <tbody>
    <tr>
      <td colSpan="3" className="px-8 py-20 text-center">
        <div className="flex flex-col items-center gap-4">
          <AlertTriangle className="text-red-400 h-12 w-12" />
          <p className="text-slate-500 font-bold">
            Failed to load users. Check your connection.
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
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
const ManageUsersContent = () => {
  const navigate = useNavigate();

  /* ── API: Fetch users ── */
  const {
    data:      usersResponse,
    isLoading,
    isError,
    refetch,
  } = useGetUsersQuery();

  /* ── Normalize API response shape ── */
  const dbUsers = useMemo(() => {
    if (!usersResponse)                        return [];
    if (Array.isArray(usersResponse))          return usersResponse;
    if (Array.isArray(usersResponse.data))     return usersResponse.data;
    if (Array.isArray(usersResponse.users))    return usersResponse.users;
    return [];
  }, [usersResponse]);

  /* ── API: Mutations ── */
  const [updateUserRole]         = useUpdateUserRoleMutation();
  const [giveFreeAccess]         = useGiveFreeAccessMutation();
  const [revokeFreeAccess]       = useRevokeFreeAccessMutation();
  const [revokeInstructorAccess] = useRevokeInstructorAccessMutation();
  const [renewInstructor]        = useRenewInstructorMutation();

  /* ── UI State ── */
  const [search,        setSearch]       = useState("");
  const [roleFilter,    setRoleFilter]   = useState("all");
  const [expandedId,    setExpandedId]   = useState(null);
  const [showAddModal,  setShowAddModal] = useState(false);
  const [manualUser,    setManualUser]   = useState({ email: "", phone: "" });

  /* ─────────────────────────────────────────
     PROMOTE TO INSTRUCTOR
  ───────────────────────────────────────── */
  const handleApproveInstructor = async (user) => {
    try {
      await updateUserRole({ id: user._id, role: "instructor" }).unwrap();
      toast.success("Promoted to Instructor ✅");
      refetch();
      setTimeout(() => navigate("/admin/instructors"), 1200);
    } catch (err) {
      toast.error(err?.data?.message || "Could not promote user");
    }
  };

  /* ─────────────────────────────────────────
     TOGGLE FREE ACCESS
  ───────────────────────────────────────── */
  const handleToggleFreeAccess = async (user) => {
    try {
      if (user.isFreeAccess) {
        await revokeFreeAccess({ userId: user._id, email: user.email }).unwrap();
        toast.success("Free Access Revoked ❌");
        refetch();
      } else {
        await giveFreeAccess({ userId: user._id, email: user.email }).unwrap();
        toast.success("Complimentary Access Granted 🎁");
        refetch();
        setTimeout(() => navigate("/admin/free-users"), 1200);
      }
    } catch (err) {
      toast.error(err?.data?.message || "Access update failed");
    }
  };

  /* ─────────────────────────────────────────
     REVOKE INSTRUCTOR → DEMOTE TO STUDENT
  ───────────────────────────────────────── */
  const handleRevokeAccess = async (user) => {
    try {
      await updateUserRole({ id: user._id, role: "student" }).unwrap();

      try {
        await revokeInstructorAccess({
          userId: user._id,
          email:  user.email,
        }).unwrap();
      } catch (_) {
        /* Silently ignore cleanup failure — role is already demoted */
      }

      toast.success("Demoted to Student ✅");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Could not revoke access");
    }
  };

  /* ─────────────────────────────────────────
     RENEW INSTRUCTOR +30 DAYS
     ✅ FIX: sends { email, days: 30 } NOT a computed ISO date string.
     Backend now uses findByIdAndUpdate (no bcrypt hook) so this works.
  ───────────────────────────────────────── */
  const handleRenewTime = async (user) => {
    try {
      await renewInstructor({
        email: user.email,
        days:  30,          // ✅ Simple number — backend calculates the date
      }).unwrap();

      toast.success("Renewed for 30 Days 🔄");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Renewal failed");
    }
  };

  /* ─────────────────────────────────────────
     MANUAL ADD (PRE-APPROVAL)
  ───────────────────────────────────────── */
  const handleManualAdd = async () => {
    if (!manualUser.email) return toast.error("Email is required");

    try {
      await giveFreeAccess({ email: manualUser.email }).unwrap();
      toast.success("User Pre-Approved ✅");
      setShowAddModal(false);
      setManualUser({ email: "", phone: "" });
      refetch();
      setTimeout(() => navigate("/admin/free-users"), 1200);
    } catch (err) {
      toast.error(err?.data?.message || "Could not provision user");
    }
  };

  /* ── Client-side filtering ── */
  const filteredData = useMemo(() => {
    return dbUsers.filter((u) => {
      const name  = String(u.name  || u.email || "");
      const email = String(u.email || "");
      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        email.toLowerCase().includes(search.toLowerCase());
      const matchesRole =
        roleFilter === "all" || u.role === roleFilter;
      return matchesSearch && matchesRole;
    });
  }, [dbUsers, search, roleFilter]);

  /* ─────────────────────────────────────────
     RENDER
  ───────────────────────────────────────── */
  return (
    <div className="p-8 bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* ── Header ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-10 gap-6">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <Users className="text-indigo-600 h-9 w-9" />
            Manage Users
          </h1>
          <p className="text-slate-500 font-medium mt-1">
            Enterprise dashboard for institutional role delegation.
          </p>
        </div>
        <div className="flex flex-wrap gap-4">
          <button
            onClick={() => navigate("/admin/instructors")}
            className="bg-indigo-50 text-indigo-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-indigo-100 hover:bg-indigo-100 transition-all shadow-sm"
          >
            <ShieldCheck size={20} /> Instructors List
          </button>
          <button
            onClick={() => navigate("/admin/free-users")}
            className="bg-emerald-50 text-emerald-700 px-6 py-3 rounded-2xl font-bold flex items-center gap-2 border border-emerald-100 hover:bg-emerald-100 transition-all shadow-sm"
          >
            <Gift size={20} /> Free Users
          </button>
          <button
            onClick={() => setShowAddModal(true)}
            className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-xl shadow-indigo-100 transition-all active:scale-95"
          >
            <UserPlus size={20} /> Manual Add
          </button>
        </div>
      </div>

      {/* ── Search + Filter ── */}
      <div className="flex flex-col md:flex-row gap-4 mb-8">
        <div className="flex-1 relative">
          <Search
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
            size={22}
          />
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            className="w-full pl-14 pr-6 py-5 bg-white border border-slate-200 rounded-[24px] shadow-sm focus:ring-4 focus:ring-indigo-500/10 outline-none font-semibold text-slate-700 transition-all placeholder:text-slate-300"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter
            className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400"
            size={18}
          />
          <select
            className="pl-12 pr-10 py-5 bg-white border border-slate-200 rounded-[24px] appearance-none focus:ring-4 focus:ring-indigo-500/10 outline-none shadow-sm font-black text-slate-700 min-w-[200px]"
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
          >
            <option value="all">All Roles</option>
            <option value="student">Students</option>
            <option value="instructor">Instructors</option>
            <option value="admin">Admins</option>
          </select>
        </div>
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
                Role & Permissions
              </th>
              <th className="px-8 py-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">
                Governance
              </th>
            </tr>
          </thead>

          {isLoading && <TableSkeleton />}
          {isError && !isLoading && <ErrorState refetch={refetch} />}

          {!isLoading && !isError && filteredData.length === 0 && (
            <tbody>
              <tr>
                <td colSpan="3" className="px-8 py-20 text-center text-slate-400 font-bold">
                  No users found.
                </td>
              </tr>
            </tbody>
          )}

          {!isLoading && !isError && filteredData.length > 0 && (
            <tbody className="divide-y divide-slate-50">
              {filteredData.map((user) => (
                <React.Fragment key={user._id}>
                  {/* ── Main row ── */}
                  <tr
                    className={`group hover:bg-slate-50 transition-all cursor-pointer ${
                      expandedId === user._id ? "bg-indigo-50/20" : ""
                    }`}
                    onClick={() =>
                      setExpandedId(expandedId === user._id ? null : user._id)
                    }
                  >
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-5">
                        <div
                          className={`h-12 w-12 rounded-2xl flex items-center justify-center text-white font-black text-lg shadow-inner ${
                            user.role === "admin" ? "bg-slate-900" : "bg-indigo-600"
                          }`}
                        >
                          {String(user.name || user.email).charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="font-extrabold text-slate-900 text-base">
                            {String(user.name || "—")}
                          </div>
                          <div className="text-xs text-slate-400 font-bold uppercase tracking-tighter">
                            {String(user.email)}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-8 py-6">
                      <div className="flex flex-col gap-1.5">
                        <span
                          className={`w-fit px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-tighter ${
                            user.role === "instructor"
                              ? "bg-indigo-100 text-indigo-700"
                              : user.role === "admin"
                              ? "bg-slate-900 text-white"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {String(user.role)}
                        </span>
                        {user.isFreeAccess && (
                          <span className="flex items-center gap-1 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                            <Gift size={12} /> Complimentary Access
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="px-8 py-6 text-center">
                      <div className="flex justify-center items-center gap-3">
                        {user.role !== "instructor" && user.role !== "admin" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleApproveInstructor(user); }}
                            className="p-3 text-indigo-600 hover:bg-indigo-100 rounded-2xl transition-all"
                            title="Promote to Instructor"
                          >
                            <UserCheck size={20} />
                          </button>
                        )}

                        <button
                          onClick={(e) => { e.stopPropagation(); handleToggleFreeAccess(user); }}
                          className={`p-3 rounded-2xl transition-all ${
                            user.isFreeAccess
                              ? "text-emerald-600 bg-emerald-50"
                              : "text-slate-300 hover:text-emerald-600 hover:bg-emerald-50"
                          }`}
                          title={user.isFreeAccess ? "Revoke Free Access" : "Give Free Access"}
                        >
                          <Gift size={20} />
                        </button>

                        {user.role === "instructor" && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRevokeAccess(user); }}
                            className="p-3 text-slate-300 hover:bg-red-50 hover:text-red-600 rounded-2xl transition-all"
                            title="Revoke Instructor Access"
                          >
                            <UserMinus size={20} />
                          </button>
                        )}

                        <div
                          className={`p-1.5 rounded-lg transition-transform duration-300 ${
                            expandedId === user._id
                              ? "rotate-180 text-indigo-600"
                              : "text-slate-300"
                          }`}
                        >
                          <ChevronDown size={20} />
                        </div>
                      </div>
                    </td>
                  </tr>

                  {/* ── Accordion Detail Row ── */}
                  {expandedId === user._id && (
                    <tr>
                      <td colSpan="3" className="px-8 py-0">
                        <div className="bg-white border-x border-b border-indigo-100 rounded-b-[40px] p-10 mb-6 shadow-inner grid grid-cols-1 md:grid-cols-3 gap-12 animate-in slide-in-from-top-2 duration-500">

                          {/* Column 1: Identity */}
                          <div className="space-y-5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] border-b border-slate-50 pb-2">
                              Identity & Records
                            </h4>
                            <div className="space-y-4">
                              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                  <Mail size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                  {String(user.email)}
                                </span>
                              </div>
                              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                                <div className="bg-indigo-100 p-2 rounded-lg text-indigo-600">
                                  <Phone size={18} />
                                </div>
                                <span className="text-sm font-bold text-slate-700">
                                  {user.phone || "No phone linked"}
                                </span>
                              </div>
                              <p className="text-[10px] text-slate-400 font-bold px-4 italic">
                                Institutional ID: {String(user._id)}
                              </p>
                            </div>
                          </div>

                          {/* Column 2: Instructor Governance */}
                          <div className="space-y-5">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] border-b border-slate-50 pb-2">
                              Instructor Governance
                            </h4>
                            {user.role === "instructor" ? (
                              <div className="space-y-5">
                                <div className="flex items-center justify-between p-4 bg-indigo-50/50 rounded-2xl border border-indigo-100">
                                  <span className="text-[10px] font-black text-indigo-700 uppercase tracking-widest">
                                    Permission Expiry
                                  </span>
                                  <span className="text-sm font-black text-indigo-700">
                                    {user.permissionExpiry
                                      ? new Date(user.permissionExpiry).toLocaleDateString()
                                      : "Lifetime"}
                                  </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                  {(user.subjects || []).map((s, idx) => (
                                    <span
                                      key={idx}
                                      className="px-3 py-1.5 bg-white text-indigo-600 text-[10px] font-black rounded-xl border border-indigo-100 shadow-sm"
                                    >
                                      {String(s)}
                                    </span>
                                  ))}
                                </div>
                                <p className="text-xs text-slate-400 font-medium italic leading-relaxed">
                                  "{user.bio || "Professional Platform Educator"}"
                                </p>
                              </div>
                            ) : (
                              <div className="p-10 border-2 border-dashed border-slate-100 rounded-[32px] flex items-center justify-center text-center">
                                <p className="text-[10px] text-slate-300 font-black uppercase tracking-widest italic">
                                  Standard Consumer Node
                                </p>
                              </div>
                            )}
                          </div>

                          {/* Column 3: Actions */}
                          <div className="flex flex-col justify-center space-y-4">
                            <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] border-b border-slate-50 pb-2">
                              Administrative Actions
                            </h4>

                            {user.role === "instructor" && (
                              <button
                                onClick={() => handleRevokeAccess(user)}
                                className="w-full flex items-center justify-between p-5 bg-red-50 text-red-600 rounded-[24px] border border-red-100 hover:bg-red-100 transition-all font-black text-xs uppercase"
                              >
                                <span>Demote to Student</span>
                                <UserX size={18} />
                              </button>
                            )}

                            {/* ✅ FIXED: sends { email, days: 30 } not ISO date */}
                            <button
                              onClick={() => handleRenewTime(user)}
                              className="w-full bg-slate-900 text-white py-4 rounded-[24px] text-xs font-black hover:bg-slate-800 transition-all flex items-center justify-center gap-3 shadow-lg uppercase tracking-widest"
                            >
                              <RefreshCw size={16} /> Renew 30 Days
                            </button>

                            <button
                              onClick={() => navigate("/admin/free-users")}
                              className="w-full bg-emerald-50 text-emerald-700 py-4 rounded-[24px] text-xs font-black hover:bg-emerald-100 transition-all flex items-center justify-center gap-3 border border-emerald-100 uppercase tracking-widest"
                            >
                              <Gift size={16} /> View Free Users
                            </button>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          )}
        </table>
      </div>

      {/* ── Manual Add Modal ── */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in">
          <div className="bg-white rounded-[40px] w-full max-w-lg shadow-2xl overflow-hidden border border-slate-100">
            <div className="p-10 border-b border-slate-50 flex justify-between items-center bg-indigo-600 text-white">
              <div>
                <h3 className="text-2xl font-black">Provision Member</h3>
                <p className="text-indigo-100 text-xs font-bold mt-1 uppercase tracking-widest">
                  Manual Pre-Approval Entry
                </p>
              </div>
              <button
                onClick={() => setShowAddModal(false)}
                className="bg-white/10 hover:bg-white/20 p-3 rounded-2xl transition-colors shadow-inner"
              >
                <XCircle />
              </button>
            </div>

            <div className="p-10 space-y-6">
              <input
                type="email"
                className="w-full px-6 py-5 bg-slate-50 border-none rounded-[24px] outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all"
                placeholder="Institutional Email"
                value={manualUser.email}
                onChange={(e) => setManualUser({ ...manualUser, email: e.target.value })}
              />
              <input
                type="tel"
                className="w-full px-6 py-5 bg-slate-50 border-none rounded-[24px] outline-none focus:ring-4 focus:ring-indigo-500/10 font-bold text-slate-700 transition-all"
                placeholder="Phone Number (optional)"
                value={manualUser.phone}
                onChange={(e) => setManualUser({ ...manualUser, phone: e.target.value })}
              />
              <div className="p-6 bg-amber-50 rounded-[32px] border border-amber-100 font-bold text-[10px] text-amber-700 uppercase tracking-tighter leading-relaxed">
                Note: Pre-approving a user grants instant COMPLIMENTARY access
                when they register. They will see a welcome popup on login.
              </div>
            </div>

            <div className="p-10 bg-slate-50/50 flex gap-4">
              <button
                onClick={() => setShowAddModal(false)}
                className="flex-1 py-5 text-slate-400 font-black uppercase text-xs tracking-widest hover:text-slate-600 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAdd}
                className="flex-1 py-5 bg-indigo-600 text-white rounded-[24px] font-black hover:bg-indigo-700 shadow-xl shadow-indigo-100 uppercase text-xs tracking-widest transition-all"
              >
                Assign & Invite
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ManageUsersContent;