/**
 * =========================================================
 * 🎓 MY COURSES PAGE (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/payment/pages/MyCourses.jsx
 *
 * Shows all courses the student has purchased or enrolled in.
 * =========================================================
 */

import React, { useState, useMemo } from "react";
import { Link }                  from "react-router-dom";
import {
  GraduationCap,
  BookOpen,
  Clock,
  AlertCircle,
  Loader2,
  Search,
  Calendar,
  ChevronRight,
  RefreshCw,
  Gift,
  ShoppingCart,
} from "lucide-react";
import { useGetPaymentMyCoursesQuery }   from "../../../core/api/endpoints/paymentApi";
import Navbar from "../../../design-system/layouts/Navbar";

/* ─────────────────────────────────────────
   ACCESS TYPE BADGE
───────────────────────────────────────── */
const AccessBadge = ({ type }) => {
  const map = {
    purchased:     { label: "Purchased",     classes: "bg-indigo-100 text-indigo-700 border-indigo-200" },
    free:          { label: "Free",          classes: "bg-emerald-100 text-emerald-700 border-emerald-200" },
    admin_granted: { label: "Admin Access",  classes: "bg-amber-100 text-amber-700 border-amber-200" },
    admin_grant:   { label: "Admin Access",  classes: "bg-amber-100 text-amber-700 border-amber-200" },
    instructor:    { label: "Teaching",      classes: "bg-sky-100 text-sky-700 border-sky-200" },
  };
  const cfg = map[type] || map.purchased;
  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-[10px] font-black uppercase tracking-widest ${cfg.classes}`}>
      {type === "free" && <Gift size={9} />}
      {cfg.label}
    </span>
  );
};

/* ─────────────────────────────────────────
   COURSE CARD
───────────────────────────────────────── */
const CourseCard = ({ purchase }) => {
  const course     = purchase.courseId;
  const isExpired  = purchase.isExpired;
  const isActive   = purchase.isActive && !isExpired;

  const expiryDate = purchase.expiryDate
    ? new Date(purchase.expiryDate).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      })
    : null;

  const daysLeft = purchase.daysRemaining;

  if (!course) return null;

  return (
    <div className={`bg-white rounded-3xl border shadow-sm hover:shadow-lg transition-all overflow-hidden group ${
      isExpired ? "border-red-100 opacity-80" : "border-slate-100"
    }`}>

      {/* Thumbnail */}
      <div className="relative h-44 overflow-hidden bg-slate-100">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <BookOpen className="text-slate-300 h-12 w-12" />
          </div>
        )}

        {/* Expired overlay */}
        {isExpired && (
          <div className="absolute inset-0 bg-slate-900/60 flex items-center justify-center">
            <div className="text-center">
              <p className="text-white font-black text-sm uppercase tracking-widest">Expired</p>
              <p className="text-slate-300 text-xs font-bold mt-1">Renew to continue</p>
            </div>
          </div>
        )}

        {/* Days remaining badge */}
        {isActive && daysLeft != null && daysLeft <= 30 && (
          <div className="absolute top-3 right-3">
            <span className="bg-amber-500 text-white text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-xl">
              {daysLeft}d left
            </span>
          </div>
        )}

        {/* Access type badge */}
        <div className="absolute top-3 left-3">
          <AccessBadge type={purchase.accessType} />
        </div>
      </div>

      {/* Content */}
      <div className="p-5 space-y-3">
        <h3 className="font-extrabold text-slate-900 text-base leading-snug line-clamp-2 group-hover:text-indigo-700 transition-colors">
          {course.title}
        </h3>

        {/* Meta */}
        <div className="flex flex-wrap gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400">
          {course.level && (
            <span className="flex items-center gap-1 bg-slate-50 px-2 py-1 rounded-lg border border-slate-100">
              <BookOpen size={9} /> {course.level}
            </span>
          )}
          {expiryDate && (
            <span className={`flex items-center gap-1 px-2 py-1 rounded-lg border ${
              isExpired
                ? "bg-red-50 border-red-100 text-red-500"
                : daysLeft != null && daysLeft <= 30
                ? "bg-amber-50 border-amber-100 text-amber-600"
                : "bg-slate-50 border-slate-100"
            }`}>
              <Calendar size={9} />
              {isExpired ? `Expired ${expiryDate}` : `Until ${expiryDate}`}
            </span>
          )}
        </div>

        {/* CTA */}
        {isActive ? (
          <Link
            to={`/course/${course._id}`}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-indigo-600 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-indigo-700 shadow-md shadow-indigo-200 transition-all"
          >
            <BookOpen size={13} />
            Continue Learning
            <ChevronRight size={13} />
          </Link>
        ) : isExpired ? (
          <Link
            to={`/checkout/${course._id}`}
            className="w-full flex items-center justify-center gap-2 py-3.5 bg-amber-500 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-amber-600 transition-all"
          >
            <RefreshCw size={13} />
            Renew Access
          </Link>
        ) : (
          <div className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest cursor-not-allowed">
            <Clock size={13} />
            Access Inactive
          </div>
        )}
      </div>
    </div>
  );
};

/* ─────────────────────────────────────────
   EMPTY STATE
───────────────────────────────────────── */
const EmptyState = () => (
  <div className="text-center py-20 px-8">
    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-5">
      <GraduationCap className="text-indigo-400 h-10 w-10" />
    </div>
    <h3 className="text-xl font-black text-slate-800 mb-2">No Courses Yet</h3>
    <p className="text-slate-500 font-medium mb-6 max-w-xs mx-auto">
      You haven't enrolled in any courses. Start your learning journey today!
    </p>
    <Link
      to="/courses"
      className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl font-black text-sm hover:bg-indigo-700 transition-all"
    >
      <ShoppingCart size={16} /> Browse Courses
    </Link>
  </div>
);

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function MyCourses() {
  const [search,     setSearch]     = useState("");
  const [tabFilter,  setTabFilter]  = useState("all"); // all | active | expired

  const {
    data:      coursesRes,
    isLoading,
    isError,
    refetch,
  } = useGetPaymentMyCoursesQuery();

  const purchases = useMemo(() => coursesRes?.data || coursesRes || [], [coursesRes]);

  /* Summary counts */
  const activeCount  = purchases.filter((p) => p.isActive && !p.isExpired).length;
  const expiredCount = purchases.filter((p) => p.isExpired).length;

  /* Filtered list */
  const filtered = useMemo(() => {
    return purchases
      .filter((p) => {
        if (tabFilter === "active")  return p.isActive && !p.isExpired;
        if (tabFilter === "expired") return p.isExpired;
        return true;
      })
      .filter((p) => {
        if (!search.trim()) return true;
        const title = p.courseId?.title || "";
        return title.toLowerCase().includes(search.toLowerCase());
      });
  }, [purchases, tabFilter, search]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans">
      <Navbar />

      <main className="mx-auto max-w-[1340px] px-5 pb-14 pt-28 sm:px-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            My Courses
          </h1>
          <p className="text-sm font-bold text-slate-500">
            Continue learning from your active courses.
          </p>
        </div>

        <div className="mt-8 space-y-6">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <GraduationCap size={22} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-950">My Courses</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                All enrolled and purchased courses.
              </p>
            </div>
          </div>

        {/* ── Summary ── */}
        {!isLoading && purchases.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {[
              { label: "Total Courses",   value: purchases.length, color: "indigo"  },
              { label: "Active Access",   value: activeCount,      color: "emerald" },
              { label: "Expired",         value: expiredCount,     color: expiredCount > 0 ? "red" : "slate" },
            ].map(({ label, value, color }) => {
              const cls = {
                indigo:  "bg-indigo-50  border-indigo-100  text-indigo-700",
                emerald: "bg-emerald-50 border-emerald-100 text-emerald-700",
                red:     "bg-red-50     border-red-100     text-red-700",
                slate:   "bg-slate-50   border-slate-100   text-slate-600",
              }[color];
              return (
                <div key={label} className={`rounded-2xl border p-4 text-center ${cls}`}>
                  <p className="text-xl font-black">{value}</p>
                  <p className="text-[10px] font-black uppercase tracking-widest mt-0.5 opacity-70">{label}</p>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Tab + Search bar ── */}
        {!isLoading && purchases.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Tabs */}
            <div className="flex bg-white border border-slate-200 rounded-2xl p-1 gap-1 self-start">
              {[
                { key: "all",     label: `All (${purchases.length})` },
                { key: "active",  label: `Active (${activeCount})` },
                { key: "expired", label: `Expired (${expiredCount})` },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setTabFilter(key)}
                  className={`px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                    tabFilter === key
                      ? "bg-indigo-600 text-white shadow-md"
                      : "text-slate-500 hover:text-slate-700"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search your courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-5 py-3 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 text-sm outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 transition-all"
              />
            </div>
          </div>
        )}

        {/* ── Loading ── */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin text-indigo-600 h-10 w-10" />
          </div>
        )}

        {/* ── Error ── */}
        {isError && (
          <div className="text-center py-20">
            <AlertCircle className="text-red-400 h-12 w-12 mx-auto mb-4" />
            <p className="text-slate-600 font-bold mb-4">Failed to load courses</p>
            <button
              onClick={refetch}
              className="px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold hover:bg-indigo-700 transition-all"
            >
              Retry
            </button>
          </div>
        )}

        {/* ── Empty ── */}
        {!isLoading && !isError && purchases.length === 0 && <EmptyState />}

        {/* ── No results from filter ── */}
        {!isLoading && purchases.length > 0 && filtered.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-400 font-bold">No courses found for this filter.</p>
          </div>
        )}

        {/* ── Course grid ── */}
        {!isLoading && !isError && filtered.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((purchase) => (
              <CourseCard key={purchase._id} purchase={purchase} />
            ))}
          </div>
        )}

        {/* ── Browse more CTA ── */}
        {!isLoading && purchases.length > 0 && (
          <div className="text-center pt-4">
            <Link
              to="/courses"
              className="inline-flex items-center gap-2 px-6 py-3 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold text-sm hover:border-indigo-300 hover:text-indigo-600 transition-all"
            >
              <ShoppingCart size={16} /> Browse More Courses
            </Link>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
