/**
 * =========================================================
 * 💰 PRICE CARD COMPONENT (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/payment/components/PriceCard.jsx
 *
 * Reusable card shown on Course Detail page.
 * Shows price, discount, features, and Buy/Enroll button.
 * Checks if user already has access before showing Buy.
 * =========================================================
 */

import React from "react";
import { useNavigate }           from "react-router-dom";
import { useAuth }               from "../../../core/providers/AuthProvider";
import { useCheckCourseAccessQuery } from "../../../core/api/endpoints/paymentApi";
import {
  IndianRupee,
  Clock,
  BookOpen,
  ShieldCheck,
  CheckCircle,
  ChevronRight,
  Gift,
  Users,
  Loader2,
  Lock,
} from "lucide-react";

/* ─────────────────────────────────────────
   PROPS:
   course — the full course object from DB
───────────────────────────────────────── */
export default function PriceCard({ course }) {
  const navigate          = useNavigate();
  const { isAuthenticated } = useAuth();

  const { data: accessRes, isLoading: checkingAccess } = useCheckCourseAccessQuery(
    course?._id,
    { skip: !course?._id || !isAuthenticated() }
  );

  const accessData   = accessRes?.data;
  const hasAccess    = accessData?.hasAccess || false;
  const isExpired    = accessData?.reason === "expired";
  const daysLeft     = accessData?.daysRemaining;

  const originalPrice = course?.originalPrice || 0;
  const finalPrice    = course?.finalPrice    || originalPrice;
  const discount      = originalPrice > finalPrice
    ? Math.round(((originalPrice - finalPrice) / originalPrice) * 100)
    : 0;
  const savings       = originalPrice - finalPrice;

  const handleAction = () => {
    if (!isAuthenticated()) {
      navigate(`/login?redirect=/checkout/${course._id}`);
      return;
    }
    if (hasAccess && !isExpired) {
      navigate(`/courses/${course._id}/learn`);
      return;
    }
    navigate(`/checkout/${course._id}`);
  };

  const features = [
    { icon: Clock,       text: "2 Years Full Access" },
    { icon: BookOpen,    text: "All Course Content"  },
    { icon: ShieldCheck, text: "Secure Payment"      },
    { icon: CheckCircle, text: "Access on Any Device" },
    { icon: Users,       text: `${(course?.totalStudents || 0).toLocaleString("en-IN")} Students Enrolled` },
  ];

  return (
    <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50 overflow-hidden sticky top-6">

      {/* Thumbnail preview */}
      {course?.thumbnail && (
        <div className="relative h-44 overflow-hidden">
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 to-transparent" />
          {discount > 0 && (
            <div className="absolute top-3 right-3 bg-red-500 text-white text-xs font-black px-3 py-1 rounded-xl">
              {discount}% OFF
            </div>
          )}
        </div>
      )}

      <div className="p-6 space-y-5">

        {/* ── Active access ── */}
        {hasAccess && !isExpired ? (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
              <CheckCircle className="text-emerald-600 h-8 w-8 mx-auto mb-2" />
              <p className="font-black text-emerald-800 text-base">You Own This Course</p>
              {daysLeft != null && (
                <p className="text-xs font-bold text-emerald-600 mt-1">
                  {daysLeft} days of access remaining
                </p>
              )}
            </div>
            <button
              onClick={handleAction}
              className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-2"
            >
              <BookOpen size={18} />
              Continue Learning
              <ChevronRight size={18} />
            </button>
          </div>
        ) : (
          <>
            {/* Price display */}
            <div>
              {course?.isFree || finalPrice === 0 ? (
                <div className="flex items-center gap-3">
                  <span className="text-4xl font-black text-emerald-600 flex items-center gap-1">
                    <Gift size={28} />
                    FREE
                  </span>
                </div>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-end gap-3">
                    <span className="text-4xl font-black text-slate-900 flex items-center">
                      <IndianRupee size={24} className="mb-1" />
                      {finalPrice.toLocaleString("en-IN")}
                    </span>
                    {originalPrice > finalPrice && (
                      <span className="text-xl font-bold text-slate-400 line-through mb-1">
                        ₹{originalPrice.toLocaleString("en-IN")}
                      </span>
                    )}
                  </div>
                  {savings > 0 && (
                    <p className="text-sm font-black text-emerald-600">
                      🎉 You save ₹{savings.toLocaleString("en-IN")}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Expired banner */}
            {isExpired && (
              <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 text-center">
                <p className="text-amber-800 font-black text-sm">
                  ⏰ Your access has expired
                </p>
                <p className="text-amber-600 text-xs font-bold mt-0.5">
                  Re-purchase to continue learning
                </p>
              </div>
            )}

            {/* CTA button */}
            {checkingAccess ? (
              <div className="w-full py-5 bg-slate-100 rounded-2xl flex items-center justify-center">
                <Loader2 className="animate-spin text-slate-400 h-5 w-5" />
              </div>
            ) : (
              <button
                onClick={handleAction}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
              >
                <Lock size={16} />
                {!isAuthenticated()
                  ? "Login to Enroll"
                  : course?.isFree || finalPrice === 0
                  ? "Enroll for Free"
                  : isExpired
                  ? "Renew Access"
                  : "Buy Now"}
                <ChevronRight size={16} />
              </button>
            )}
          </>
        )}

        {/* Security note */}
        <p className="text-[10px] text-slate-400 text-center font-bold uppercase tracking-widest flex items-center justify-center gap-2">
          <ShieldCheck size={11} />
          Secure payment · 256-bit SSL
        </p>

        {/* Features list */}
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
            This Course Includes:
          </p>
          {features.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 text-sm text-slate-600 font-semibold">
              <Icon size={15} className="text-indigo-500 shrink-0" />
              {text}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}