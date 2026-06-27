import { useEffect, useMemo, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Save,
  Search,
  Shield,
  ShieldCheck,
  UserCog,
  UserX,
  XCircle,
} from "lucide-react";

import {
  useGetAdminAccessOptionsQuery,
  useGetAdminAccessUsersQuery,
  useRevokeAdminAccessMutation,
  useUpdateAdminAccessMutation,
} from "../../../core/api/endpoints/adminApi";
import { useAuth } from "../../../core/providers/AuthProvider";
import { ADMIN_PAGES } from "../../../constants/adminPages";

const getUsers = (response) => {
  if (!response) return [];
  if (Array.isArray(response)) return response;
  if (Array.isArray(response.data)) return response.data;
  if (Array.isArray(response.users)) return response.users;
  return [];
};

const getInitialPages = (user) =>
  Array.isArray(user?.adminAccess?.pages) ? user.adminAccess.pages : [];

const roleBadgeClass = (role) => {
  if (role === "admin") return "bg-slate-900 text-white border-slate-900";
  if (role === "instructor") return "bg-indigo-50 text-indigo-700 border-indigo-100";
  return "bg-slate-50 text-slate-600 border-slate-200";
};

function AccessRow({
  user,
  pageOptions,
  currentUserId,
  onSave,
  onRevoke,
  saving,
  revoking,
}) {
  const [fullAccess, setFullAccess] = useState(Boolean(user?.adminAccess?.fullAccess));
  const [pages, setPages] = useState(getInitialPages(user));

  useEffect(() => {
    setFullAccess(Boolean(user?.adminAccess?.fullAccess));
    setPages(getInitialPages(user));
  }, [user]);

  const isSelf = String(user?._id) === String(currentUserId);
  const isAdmin = user?.role === "admin";
  const selectedCount = fullAccess ? pageOptions.length : pages.length;

  const togglePage = (pageKey) => {
    setFullAccess(false);
    setPages((current) =>
      current.includes(pageKey)
        ? current.filter((item) => item !== pageKey)
        : [...current, pageKey]
    );
  };

  const selectAll = () => {
    setFullAccess(false);
    setPages(pageOptions.map((page) => page.key));
  };

  const clearAll = () => {
    setFullAccess(false);
    setPages([]);
  };

  const save = () => {
    if (!fullAccess && pages.length === 0) {
      toast.error("Select at least one page or Full Access");
      return;
    }

    onSave({
      id: user._id,
      fullAccess,
      pages,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-lg shadow-sm">
      <div className="grid grid-cols-1 xl:grid-cols-[300px_1fr_220px] gap-6 p-5">
        <div className="min-w-0">
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-lg bg-indigo-50 text-indigo-700 flex items-center justify-center font-black text-lg shrink-0">
              {String(user?.name || user?.email || "A").charAt(0).toUpperCase()}
            </div>
            <div className="min-w-0">
              <p className="font-black text-slate-900 truncate">
                {user?.name || "Unnamed User"}
              </p>
              <p className="text-xs font-semibold text-slate-500 truncate">
                {user?.email || "No email"}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <span
                  className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider border ${roleBadgeClass(user?.role)}`}
                >
                  {user?.role || "student"}
                </span>
                {isSelf && (
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-100">
                    Current User
                  </span>
                )}
                {isAdmin && (
                  <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-100">
                    {selectedCount} Page{selectedCount === 1 ? "" : "s"}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => {
                setFullAccess(true);
                setPages([]);
              }}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-black border transition-all ${
                fullAccess
                  ? "bg-slate-900 text-white border-slate-900"
                  : "bg-white text-slate-600 border-slate-200 hover:border-slate-400"
              }`}
            >
              <ShieldCheck size={16} />
              Full Access
            </button>
            <button
              type="button"
              onClick={selectAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-black border border-indigo-100 bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-all"
            >
              <CheckCircle2 size={16} />
              Select All
            </button>
            <button
              type="button"
              onClick={clearAll}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-md text-xs font-black border border-slate-200 bg-white text-slate-500 hover:bg-slate-50 transition-all"
            >
              <XCircle size={16} />
              Clear
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 2xl:grid-cols-3 gap-2">
            {pageOptions.map((page) => {
              const active = fullAccess || pages.includes(page.key);

              return (
                <button
                  key={page.key}
                  type="button"
                  onClick={() => togglePage(page.key)}
                  className={`text-left p-3 rounded-md border transition-all min-h-[74px] ${
                    active
                      ? "bg-emerald-50 border-emerald-200 text-emerald-800"
                      : "bg-white border-slate-200 text-slate-600 hover:border-indigo-200 hover:bg-indigo-50"
                  }`}
                >
                  <span className="flex items-center justify-between gap-3">
                    <span className="font-black text-sm">{page.label}</span>
                    {active ? <CheckCircle2 size={16} /> : <Shield size={16} />}
                  </span>
                  <span className="mt-1 block text-[11px] font-semibold opacity-70">
                    {page.description}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <div className="flex xl:flex-col gap-3 xl:justify-center">
          <button
            type="button"
            onClick={save}
            disabled={saving || isSelf}
            className="flex-1 xl:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {saving ? <RefreshCw size={16} className="animate-spin" /> : <Save size={16} />}
            Save Access
          </button>

          {isAdmin && (
            <button
              type="button"
              onClick={() => onRevoke(user)}
              disabled={revoking || isSelf}
              className="flex-1 xl:flex-none inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-red-50 text-red-600 border border-red-100 text-xs font-black hover:bg-red-100 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {revoking ? <RefreshCw size={16} className="animate-spin" /> : <UserX size={16} />}
              Remove Admin
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function AdminAccess() {
  const { user: currentUser } = useAuth();
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [savingId, setSavingId] = useState(null);
  const [revokingId, setRevokingId] = useState(null);

  const { data: optionsResponse } = useGetAdminAccessOptionsQuery();
  const {
    data: usersResponse,
    isLoading,
    isError,
    refetch,
  } = useGetAdminAccessUsersQuery({
    search,
    role: roleFilter,
    limit: 100,
  });

  const [updateAdminAccess] = useUpdateAdminAccessMutation();
  const [revokeAdminAccess] = useRevokeAdminAccessMutation();

  const pageOptions = useMemo(() => {
    if (Array.isArray(optionsResponse?.data) && optionsResponse.data.length > 0) {
      return optionsResponse.data;
    }

    return ADMIN_PAGES;
  }, [optionsResponse]);

  const users = useMemo(() => getUsers(usersResponse), [usersResponse]);
  const pagination = usersResponse?.pagination;

  const saveAccess = async ({ id, fullAccess, pages }) => {
    setSavingId(id);
    try {
      await updateAdminAccess({ id, fullAccess, pages }).unwrap();
      toast.success("Admin access saved");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Could not save admin access");
    } finally {
      setSavingId(null);
    }
  };

  const revokeAccess = async (targetUser) => {
    if (!window.confirm(`Remove admin access for ${targetUser.email}?`)) return;

    setRevokingId(targetUser._id);
    try {
      await revokeAdminAccess(targetUser._id).unwrap();
      toast.success("Admin access removed");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Could not remove admin access");
    } finally {
      setRevokingId(null);
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen text-slate-900">
      <Toaster position="top-right" />

      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5 mb-8">
        <div>
          <h1 className="text-3xl font-black tracking-tight flex items-center gap-3">
            <UserCog className="h-8 w-8 text-indigo-600" />
            Admin Access
          </h1>
          <p className="text-slate-500 font-semibold mt-1">
            {pagination?.total ?? users.length} users
          </p>
        </div>

        <button
          type="button"
          onClick={refetch}
          className="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-md bg-white border border-slate-200 text-slate-700 text-xs font-black hover:bg-slate-100 transition-all"
        >
          <RefreshCw size={16} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[1fr_220px] gap-3 mb-6">
        <div className="relative">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search name, email, or phone"
            className="w-full pl-11 pr-4 py-3 rounded-md border border-slate-200 bg-white text-sm font-semibold outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300"
          />
        </div>

        <select
          value={roleFilter}
          onChange={(event) => setRoleFilter(event.target.value)}
          className="px-4 py-3 rounded-md border border-slate-200 bg-white text-sm font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-300"
        >
          <option value="all">All Roles</option>
          <option value="student">Students</option>
          <option value="instructor">Instructors</option>
          <option value="admin">Admins</option>
        </select>
      </div>

      {isLoading && (
        <div className="space-y-3">
          {[1, 2, 3].map((item) => (
            <div
              key={item}
              className="h-44 rounded-lg border border-slate-200 bg-white animate-pulse"
            />
          ))}
        </div>
      )}

      {isError && !isLoading && (
        <div className="bg-white border border-red-100 rounded-lg p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="font-black text-slate-600 mb-4">Failed to load admin access</p>
          <button
            type="button"
            onClick={refetch}
            className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-md bg-indigo-600 text-white text-xs font-black hover:bg-indigo-700"
          >
            <RefreshCw size={16} />
            Retry
          </button>
        </div>
      )}

      {!isLoading && !isError && users.length === 0 && (
        <div className="bg-white border border-slate-200 rounded-lg p-10 text-center">
          <Shield className="h-12 w-12 text-slate-300 mx-auto mb-4" />
          <p className="font-black text-slate-500">No users found</p>
        </div>
      )}

      {!isLoading && !isError && users.length > 0 && (
        <div className="space-y-3">
          {users.map((targetUser) => (
            <AccessRow
              key={targetUser._id}
              user={targetUser}
              pageOptions={pageOptions}
              currentUserId={currentUser?._id}
              onSave={saveAccess}
              onRevoke={revokeAccess}
              saving={savingId === targetUser._id}
              revoking={revokingId === targetUser._id}
            />
          ))}
        </div>
      )}
    </div>
  );
}
