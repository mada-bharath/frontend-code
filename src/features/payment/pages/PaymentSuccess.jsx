/**
 * =========================================================
 * ✅ PAYMENT SUCCESS PAGE (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/payment/pages/PaymentSuccess.jsx
 *
 * Shows after successful payment verification.
 * Handles both:
 *   - Normal flow:  ?courseId=xxx&paymentId=yyy
 *   - Free course:  ?courseId=xxx&free=true
 *   - Recovery:     ?courseId=xxx&recover=true
 * =========================================================
 */

import React, { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  CheckCircle2,
  BookOpen,
  Calendar,
  Clock,
  ChevronRight,
  Download,
  Share2,
  Sparkles,
} from "lucide-react";
import { useGetCourseByIdQuery }  from "../../../core/api/endpoints/courseApi";
import { useCheckCourseAccessQuery } from "../../../core/api/endpoints/paymentApi";
import { getMediaUrl } from "../../../utils/mediaUrl";

/* ─────────────────────────────────────────
   CONFETTI EFFECT (pure CSS + JS, no lib)
───────────────────────────────────────── */
const Confetti = () => {
  const colors = ["#4f46e5", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];
  const pieces = useMemo(
    () =>
      Array.from({ length: 40 }, (_, i) => ({
        left: `${(i * 37) % 100}%`,
        duration: 1.5 + ((i * 7) % 20) / 10,
        delay: ((i * 11) % 10) / 10,
        rotation: (i * 53) % 360,
      })),
    []
  );

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-10">
      {pieces.map((piece, i) => (
        <div
          key={i}
          className="absolute top-0 w-2.5 h-2.5 rounded-sm opacity-0"
          style={{
            left:             piece.left,
            backgroundColor:  colors[i % colors.length],
            animation:        `confettiFall ${piece.duration}s ease-in ${piece.delay}s forwards`,
            transform:        `rotate(${piece.rotation}deg)`,
          }}
        />
      ))}
      <style>{`
        @keyframes confettiFall {
          0%   { transform: translateY(-20px) rotate(0deg);    opacity: 1;   }
          100% { transform: translateY(100vh) rotate(720deg);  opacity: 0;   }
        }
      `}</style>
    </div>
  );
};

const extractCourse = (payload) =>
  payload?.data?.course || payload?.course || payload?.data || payload || null;

/* ─────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────── */
export default function PaymentSuccess() {
  const [searchParams]    = useSearchParams();
  const navigate          = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);

  const courseId   = searchParams.get("courseId");
  const paymentId  = searchParams.get("paymentId");
  const isFree     = searchParams.get("free") === "true";
  const isRecovered = searchParams.get("recover") === "true";
  const courseCount = Number(searchParams.get("courses") || 1);
  const isBulk = courseCount > 1;

  const { data: courseRes } = useGetCourseByIdQuery(courseId, { skip: !courseId });
  const { data: accessRes } = useCheckCourseAccessQuery(courseId,  { skip: !courseId });

  const course    = extractCourse(courseRes);
  const access    = accessRes?.data;

  /* Stop confetti after 3 seconds */
  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 3500);
    return () => clearTimeout(timer);
  }, []);

  const expiryDate = access?.expiryDate
    ? new Date(access.expiryDate).toLocaleDateString("en-IN", {
        day: "numeric", month: "long", year: "numeric",
      })
    : null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-emerald-50 flex items-center justify-center px-4 py-12 relative">

      {showConfetti && <Confetti />}

      <div className="max-w-lg w-full relative z-20">

        {/* ── Success card ── */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-indigo-100 border border-slate-100 overflow-hidden">

          {/* Green header strip */}
          <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-10 text-white text-center relative overflow-hidden">
            <div className="absolute inset-0 opacity-10"
              style={{ backgroundImage: "radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }}
            />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
                <CheckCircle2 className="text-white h-10 w-10" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">
                {isFree ? "Enrolled for Free! 🎓" : "Payment Successful! 🎉"}
              </h1>
              <p className="text-emerald-100 font-semibold mt-2 text-sm">
                {isRecovered
                  ? "Your access has been restored."
                  : isFree
                  ? "You now have full access to this course."
                  : "Your course access has been activated."}
              </p>
              {isBulk && (
                <p className="text-emerald-50 font-bold mt-2 text-xs">
                  {courseCount} wishlist courses are now available in My Courses.
                </p>
              )}
            </div>
          </div>

          {/* Course info */}
          <div className="p-8 space-y-6">

            {course && (
              <div className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                {course.thumbnail ? (
                  <img
                    src={getMediaUrl(course.thumbnail)}
                    alt={course.title}
                    className="w-16 h-12 rounded-xl object-cover shrink-0"
                  />
                ) : (
                  <div className="w-16 h-12 rounded-xl bg-indigo-100 flex items-center justify-center shrink-0">
                    <BookOpen className="text-indigo-600 h-6 w-6" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-black text-slate-900 text-sm line-clamp-2">{course.title}</p>
                  {course.level && (
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                      {course.level}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-4">
              {paymentId && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                    Payment ID
                  </p>
                  <p className="font-black text-slate-700 text-xs truncate">{paymentId}</p>
                </div>
              )}

              {expiryDate && (
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Calendar size={10} /> Access Until
                  </p>
                  <p className="font-black text-slate-700 text-xs">{expiryDate}</p>
                </div>
              )}

              {access?.daysRemaining != null && (
                <div className="bg-indigo-50 rounded-2xl p-4 border border-indigo-100">
                  <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Clock size={10} /> Days Remaining
                  </p>
                  <p className="font-black text-indigo-700 text-sm">
                    {access.daysRemaining} days
                  </p>
                </div>
              )}

              <div className="bg-emerald-50 rounded-2xl p-4 border border-emerald-100">
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                  <Sparkles size={10} /> Status
                </p>
                <p className="font-black text-emerald-700 text-sm">Active ✓</p>
              </div>
            </div>

            {/* CTA buttons */}
            <div className="space-y-3">
              <button
                onClick={() =>
                  isBulk
                    ? navigate("/my-courses")
                    : navigate(`/course/${courseId}`, {
                        state: { isPurchased: true },
                      })
                }
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3"
              >
                <BookOpen size={18} />
                {isBulk ? "View My Courses" : "Start Learning Now"}
                <ChevronRight size={18} />
              </button>

              <div className="grid grid-cols-2 gap-3">
                <Link
                  to="/billing"
                  className="py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <Download size={14} /> Billing
                </Link>
                <Link
                  to="/courses"
                  className="py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                >
                  <Share2 size={14} /> More Courses
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
