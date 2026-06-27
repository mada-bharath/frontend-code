/**
 * =========================================================
 * ❌ PAYMENT FAILED PAGE (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/payment/pages/PaymentFailed.jsx
 *
 * Handles:
 *   - Normal failure:  ?courseId=xxx&orderId=yyy
 *   - Error message:   ?error=description
 *   - Retry payment flow
 *   - Recovery option (if payment captured but DB failed)
 * =========================================================
 */

import React, { useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import {
  XCircle,
  RefreshCw,
  ArrowLeft,
  BookOpen,
  AlertTriangle,
  ShieldCheck,
  Loader2,
  HelpCircle,
  Phone,
} from "lucide-react";
import { useRecoverPaymentMutation } from "../../../core/api/endpoints/paymentApi";
import { useGetCourseByIdQuery }     from "../../../core/api/endpoints/courseApi";
import { getMediaUrl }               from "../../../utils/mediaUrl";
import toast, { Toaster }            from "react-hot-toast";

const extractCourse = (payload) =>
  payload?.data?.course || payload?.course || payload?.data || payload || null;

export default function PaymentFailed() {
  const [searchParams]  = useSearchParams();
  const navigate        = useNavigate();
  const [recoverInput,  setRecoverInput]  = useState("");
  const [showRecover,   setShowRecover]   = useState(false);
  const [isRecovering,  setIsRecovering]  = useState(false);

  const courseId  = searchParams.get("courseId");
  const errorMsg  = searchParams.get("error");
  const source    = searchParams.get("source");

  const { data: courseRes } = useGetCourseByIdQuery(courseId, { skip: !courseId });
  const [recoverPayment]    = useRecoverPaymentMutation();

  const course = extractCourse(courseRes);

  /* ── Determine display error message ── */
  const displayError = errorMsg
    ? decodeURIComponent(errorMsg)
    : "Your payment could not be processed. No amount has been deducted.";

  /* ── Common failure reasons ── */
  const reasons = [
    "Bank declined the transaction",
    "Insufficient funds or daily limit exceeded",
    "Payment session expired",
    "Network interruption during payment",
  ];

  /* ═══════════════════════════════════════
     RETRY — go back to checkout
  ═══════════════════════════════════════ */
  const handleRetry = () => {
    navigate(source === "wishlist" ? "/wishlist" : `/checkout/${courseId}`);
  };

  /* ═══════════════════════════════════════
     RECOVERY — user has a Razorpay payment ID
     but our DB didn't record the success
  ═══════════════════════════════════════ */
  const handleRecover = async () => {
    if (!recoverInput.trim()) {
      toast.error("Please enter your Razorpay Payment ID");
      return;
    }
    setIsRecovering(true);
    try {
      await recoverPayment({
        razorpayPaymentId: recoverInput.trim(),
      }).unwrap();

      toast.success("✅ Payment recovered! Access restored.");
      navigate(
        `/payment/success?courseId=${courseId}&recover=true&paymentId=${recoverInput.trim()}`
      );
    } catch (err) {
      toast.error(err?.data?.message || "Recovery failed. Please contact support.");
    } finally {
      setIsRecovering(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-slate-50 flex items-center justify-center px-4 py-12">
      <Toaster position="top-right" />

      <div className="max-w-lg w-full space-y-5">

        {/* ── Main failed card ── */}
        <div className="bg-white rounded-[40px] shadow-2xl shadow-red-100 border border-slate-100 overflow-hidden">

          {/* Red header */}
          <div className="bg-gradient-to-br from-red-500 to-rose-600 p-10 text-white text-center relative overflow-hidden">
            <div
              className="absolute inset-0 opacity-10"
              style={{
                backgroundImage:
                  "repeating-linear-gradient(45deg, white 0, white 1px, transparent 0, transparent 50%)",
                backgroundSize: "10px 10px",
              }}
            />
            <div className="relative z-10">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 ring-4 ring-white/30">
                <XCircle className="text-white h-10 w-10" />
              </div>
              <h1 className="text-3xl font-black tracking-tight">Payment Failed</h1>
              <p className="text-red-100 font-semibold mt-2 text-sm">
                Don't worry — no amount has been deducted.
              </p>
            </div>
          </div>

          {/* Body */}
          <div className="p-8 space-y-6">

            {/* Error message */}
            <div className="flex items-start gap-3 bg-red-50 border border-red-100 rounded-2xl p-4">
              <AlertTriangle className="text-red-500 shrink-0 mt-0.5" size={18} />
              <p className="text-sm text-red-700 font-semibold leading-relaxed">
                {displayError}
              </p>
            </div>

            {/* Course info */}
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
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                    Course
                  </p>
                  <p className="font-black text-slate-900 text-sm line-clamp-2 mt-0.5">
                    {course.title}
                  </p>
                </div>
              </div>
            )}

            {/* Common reasons */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                Common Reasons
              </p>
              <div className="space-y-2">
                {reasons.map((r) => (
                  <div
                    key={r}
                    className="flex items-center gap-3 text-sm text-slate-500 font-medium"
                  >
                    <div className="w-1.5 h-1.5 rounded-full bg-red-400 shrink-0" />
                    {r}
                  </div>
                ))}
              </div>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              <button
                onClick={handleRetry}
                className="w-full py-5 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all flex items-center justify-center gap-3"
              >
                <RefreshCw size={18} />
                Try Payment Again
              </button>

              <button
                onClick={() => navigate(`/courses/${courseId}`)}
                className="w-full py-4 bg-slate-100 text-slate-700 rounded-2xl font-bold text-sm hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
              >
                <ArrowLeft size={16} />
                Back to Course
              </button>
            </div>
          </div>
        </div>

        {/* ── Security notice ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center gap-4">
          <div className="w-10 h-10 bg-emerald-100 rounded-2xl flex items-center justify-center shrink-0">
            <ShieldCheck className="text-emerald-600 h-5 w-5" />
          </div>
          <p className="text-xs text-slate-500 font-semibold leading-relaxed">
            Your payment information is secure. We use 256-bit SSL encryption
            and Razorpay's PCI-DSS compliant gateway.
          </p>
        </div>

        {/* ── Recovery section ── */}
        <div className="bg-white rounded-3xl border border-amber-100 shadow-sm p-6">
          <button
            onClick={() => setShowRecover(!showRecover)}
            className="w-full flex items-center justify-between"
          >
            <div className="flex items-center gap-3">
              <HelpCircle className="text-amber-500 h-5 w-5" />
              <div className="text-left">
                <p className="font-black text-slate-800 text-sm">
                  Money deducted but not enrolled?
                </p>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">
                  Use Payment ID to recover access instantly
                </p>
              </div>
            </div>
            <span className="text-amber-500 text-lg font-black">
              {showRecover ? "−" : "+"}
            </span>
          </button>

          {showRecover && (
            <div className="mt-5 space-y-4 pt-5 border-t border-amber-100">
              <p className="text-xs text-slate-500 font-semibold">
                Enter the Razorpay Payment ID from your bank SMS/email (starts with "pay_")
              </p>
              <div className="flex gap-3">
                <input
                  type="text"
                  placeholder="pay_XXXXXXXXXX"
                  value={recoverInput}
                  onChange={(e) => setRecoverInput(e.target.value)}
                  className="flex-1 px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 text-sm outline-none focus:ring-4 focus:ring-amber-500/10 focus:border-amber-400 transition-all"
                />
                <button
                  onClick={handleRecover}
                  disabled={isRecovering || !recoverInput.trim()}
                  className="px-5 py-3.5 bg-amber-500 text-white rounded-2xl font-black text-sm hover:bg-amber-600 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  {isRecovering ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Recover"
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Support ── */}
        <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Phone className="text-indigo-500 h-5 w-5" />
            <div>
              <p className="font-black text-slate-800 text-sm">Need Help?</p>
              <p className="text-xs text-slate-400 font-semibold">support@bharathvidya.in</p>
            </div>
          </div>
          <a
            href="mailto:support@bharathvidya.in"
            className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-xl font-bold text-xs hover:bg-indigo-100 transition-all"
          >
            Contact Us
          </a>
        </div>

      </div>
    </div>
  );
}
