import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import {
  AlertCircle,
  BookOpen,
  Calendar,
  CheckCircle2,
  Clock,
  CreditCard,
  Filter,
  IndianRupee,
  Loader2,
  Receipt,
  RefreshCw,
  Tag,
  Trash2,
  XCircle,
} from "lucide-react";

import Navbar from "../../../design-system/layouts/Navbar";
import {
  useDeleteFailedPaymentMutation,
  useGetMyPaymentHistoryQuery,
} from "../../../core/api/endpoints/paymentApi";
import AccountTabs from "../components/AccountTabs";

const LIMIT = 10;

const STATUS_CONFIG = {
  success: {
    label: "Success",
    Icon: CheckCircle2,
    classes: "bg-emerald-100 text-emerald-700 border-emerald-200",
    strip: "bg-emerald-500",
  },
  failed: {
    label: "Failed",
    Icon: XCircle,
    classes: "bg-red-100 text-red-700 border-red-200",
    strip: "bg-red-500",
  },
  refunded: {
    label: "Refunded",
    Icon: RefreshCw,
    classes: "bg-slate-100 text-slate-600 border-slate-200",
    strip: "bg-slate-400",
  },
  pending: {
    label: "Pending",
    Icon: Clock,
    classes: "bg-amber-100 text-amber-700 border-amber-200",
    strip: "bg-amber-500",
  },
};

const statusOptions = [
  { key: "all", label: "All" },
  { key: "success", label: "Success" },
  { key: "failed", label: "Failed" },
  { key: "refunded", label: "Refunded" },
];

const formatDate = (value) => {
  if (!value) return "Not available";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not available";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const formatMoney = (value) => Number(value || 0).toLocaleString("en-IN");

const getPaymentTitle = (payment) => {
  if (payment?.isBulk && payment?.items?.length) {
    return `${payment.items.length} courses`;
  }

  return (
    payment?.courseId?.title ||
    payment?.snapshot?.courseName ||
    payment?.items?.[0]?.courseName ||
    "Course purchase"
  );
};

const getPaymentSubtitle = (payment) => {
  if (payment?.isBulk && payment?.items?.length) {
    return payment.items
      .map((item) => item.courseName)
      .filter(Boolean)
      .slice(0, 3)
      .join(", ");
  }

  return payment?.razorpayPaymentId || payment?.razorpayOrderId || "Payment record";
};

const getFallbackSummary = (payments) => {
  const success = payments.filter((payment) => payment.status === "success");

  return {
    success: success.length,
    failed: payments.filter((payment) => payment.status === "failed").length,
    refunded: payments.filter((payment) => payment.status === "refunded").length,
    totalSpent: success.reduce((sum, payment) => sum + Number(payment.finalAmount || 0), 0),
  };
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.pending;
  const Icon = cfg.Icon;

  return (
    <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1 text-[10px] font-black uppercase tracking-widest ${cfg.classes}`}>
      <Icon size={11} />
      {cfg.label}
    </span>
  );
};

const EmptyState = () => (
  <div className="rounded-xl border border-slate-200 bg-white px-8 py-16 text-center shadow-sm">
    <div className="mx-auto mb-5 grid h-16 w-16 place-items-center rounded-full bg-slate-100">
      <Receipt className="h-8 w-8 text-slate-400" />
    </div>
    <h3 className="text-xl font-black text-slate-800">No Billing Records</h3>
    <p className="mx-auto mt-2 max-w-sm text-sm font-medium text-slate-500">
      Your course payments will appear here after checkout.
    </p>
    <Link
      to="/courses"
      className="mt-6 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-6 py-3 text-sm font-black text-white transition hover:bg-indigo-700"
    >
      <BookOpen size={16} />
      Browse Courses
    </Link>
  </div>
);

const BillingCard = ({ payment, onDeleteFailed, isDeleting }) => {
  const course = payment.courseId;
  const statusCfg = STATUS_CONFIG[payment.status] || STATUS_CONFIG.pending;
  const purchaseDate = formatDate(payment.purchaseDate || payment.createdAt);
  const expiryDate = payment.expiryDate ? formatDate(payment.expiryDate) : null;
  const isActive = payment.status === "success" && payment.isActive;
  const isExpired =
    payment.status === "success" &&
    payment.expiryDate &&
    new Date(payment.expiryDate) <= new Date();

  return (
    <article className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm transition hover:shadow-md">
      <div className={`h-1 w-full ${statusCfg.strip}`} />

      <div className="p-5 md:p-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          {course?.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title || "Course"}
              className="h-24 w-full rounded-lg object-cover sm:w-32"
            />
          ) : (
            <div className="grid h-24 w-full place-items-center rounded-lg bg-indigo-50 text-indigo-600 sm:w-32">
              <BookOpen size={28} />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <h3 className="text-lg font-black leading-snug text-slate-950">
                  {getPaymentTitle(payment)}
                </h3>
                <p className="mt-1 truncate text-xs font-bold text-slate-400">
                  {getPaymentSubtitle(payment)}
                </p>
              </div>
              <StatusBadge status={payment.status} />
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-sm font-black text-slate-800">
                <IndianRupee size={13} />
                {formatMoney(payment.finalAmount)}
              </span>

              <span className="inline-flex items-center gap-1.5 rounded-lg border border-slate-100 bg-slate-50 px-3 py-2 text-xs font-black text-slate-500">
                <Calendar size={12} />
                {purchaseDate}
              </span>

              {payment.couponCode && (
                <span className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-3 py-2 text-xs font-black text-indigo-700">
                  <Tag size={12} />
                  {payment.couponCode}
                </span>
              )}

              {Number(payment.discountAmount || 0) > 0 && (
                <span className="rounded-lg border border-emerald-100 bg-emerald-50 px-3 py-2 text-xs font-black text-emerald-700">
                  Rs. {formatMoney(payment.discountAmount)} saved
                </span>
              )}

              {expiryDate && (
                <span className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-black ${
                  isExpired
                    ? "border-red-100 bg-red-50 text-red-600"
                    : "border-emerald-100 bg-emerald-50 text-emerald-700"
                }`}>
                  <Clock size={12} />
                  {isExpired ? `Expired ${expiryDate}` : `Access until ${expiryDate}`}
                </span>
              )}
            </div>

            <div className="mt-5 flex flex-col gap-3 sm:flex-row">
              {isActive && course?._id && (
                <Link
                  to={`/course/${course._id}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-indigo-700"
                >
                  <BookOpen size={14} />
                  Continue Learning
                </Link>
              )}

              {payment.status === "failed" && course?._id && (
                <Link
                  to={`/checkout/${course._id}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-slate-900 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-slate-800"
                >
                  <RefreshCw size={14} />
                  Retry Payment
                </Link>
              )}

              {payment.status === "failed" && (
                <button
                  type="button"
                  onClick={() => onDeleteFailed(payment)}
                  disabled={isDeleting}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-xs font-black uppercase tracking-widest text-red-600 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <Trash2 size={14} />
                  {isDeleting ? "Deleting..." : "Delete Failed Record"}
                </button>
              )}

              {isExpired && course?._id && (
                <Link
                  to={`/checkout/${course._id}`}
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-amber-500 px-5 py-3 text-xs font-black uppercase tracking-widest text-white transition hover:bg-amber-600"
                >
                  <RefreshCw size={14} />
                  Renew Access
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </article>
  );
};

export default function Billing() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState("all");
  const [deletingPaymentId, setDeletingPaymentId] = useState(null);

  const {
    data: historyRes,
    isLoading,
    isError,
    refetch,
  } = useGetMyPaymentHistoryQuery({ page, limit: LIMIT, status: statusFilter });
  const [deleteFailedPayment] = useDeleteFailedPaymentMutation();

  const payments = historyRes?.data?.payments || [];
  const pagination = historyRes?.data?.pagination || {};
  const summary = useMemo(
    () => historyRes?.data?.summary || getFallbackSummary(payments),
    [historyRes, payments]
  );

  useEffect(() => {
    setPage(1);
  }, [statusFilter]);

  const handleDeleteFailedPayment = async (payment) => {
    if (!payment?._id || payment.status !== "failed") return;

    const confirmed = window.confirm("Delete this failed payment record?");
    if (!confirmed) return;

    setDeletingPaymentId(payment._id);

    try {
      await deleteFailedPayment(payment._id).unwrap();
      toast.success("Failed payment record deleted");

      if (payments.length === 1 && page > 1) {
        setPage((current) => Math.max(1, current - 1));
      }
    } catch (error) {
      toast.error(error?.data?.message || "Could not delete failed payment");
    } finally {
      setDeletingPaymentId(null);
    }
  };

  const summaryCards = [
    { label: "Successful", value: summary.success || 0, classes: "bg-indigo-50 border-indigo-100 text-indigo-700" },
    { label: "Total Spent", value: `Rs. ${formatMoney(summary.totalSpent)}`, classes: "bg-emerald-50 border-emerald-100 text-emerald-700" },
    { label: "Failed", value: summary.failed || 0, classes: "bg-red-50 border-red-100 text-red-700" },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-[1340px] px-5 pb-14 pt-28 sm:px-8 lg:px-10">
        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            My Account
          </h1>
          <p className="text-sm font-bold text-slate-500">
            Track payments, invoices and course access.
          </p>
        </div>

        <AccountTabs />

        <section className="mt-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                <CreditCard size={22} />
              </span>
              <div>
                <h2 className="text-2xl font-black text-slate-950">Billing</h2>
                <p className="mt-1 text-sm font-medium text-slate-500">
                  Purchase history from your account database.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={refetch}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600"
            >
              <RefreshCw size={16} />
              Refresh
            </button>
          </div>

          {!isLoading && !isError && (
            <div className="mb-6 grid gap-4 sm:grid-cols-3">
              {summaryCards.map((card) => (
                <div key={card.label} className={`rounded-xl border p-4 text-center ${card.classes}`}>
                  <p className="text-xl font-black">{card.value}</p>
                  <p className="mt-1 text-[10px] font-black uppercase tracking-widest opacity-70">
                    {card.label}
                  </p>
                </div>
              ))}
            </div>
          )}

          {!isLoading && !isError && (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              <Filter size={16} className="text-slate-400" />
              {statusOptions.map((option) => (
                <button
                  key={option.key}
                  type="button"
                  onClick={() => setStatusFilter(option.key)}
                  className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-widest transition ${
                    statusFilter === option.key
                      ? "bg-indigo-600 text-white shadow-sm"
                      : "border border-slate-200 bg-white text-slate-500 hover:border-indigo-200 hover:text-indigo-600"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}

          {isLoading && (
            <div className="flex items-center justify-center rounded-xl border border-slate-200 bg-white py-20 shadow-sm">
              <Loader2 className="h-10 w-10 animate-spin text-indigo-600" />
            </div>
          )}

          {isError && (
            <div className="rounded-xl border border-red-100 bg-white px-8 py-16 text-center shadow-sm">
              <AlertCircle className="mx-auto mb-4 h-12 w-12 text-red-400" />
              <p className="mb-4 font-bold text-slate-600">Failed to load billing history</p>
              <button
                type="button"
                onClick={refetch}
                className="rounded-lg bg-indigo-600 px-6 py-3 font-bold text-white transition hover:bg-indigo-700"
              >
                Retry
              </button>
            </div>
          )}

          {!isLoading && !isError && payments.length === 0 && <EmptyState />}

          {!isLoading && !isError && payments.length > 0 && (
            <div className="space-y-4">
              {payments.map((payment) => (
                <BillingCard
                  key={payment._id}
                  payment={payment}
                  onDeleteFailed={handleDeleteFailedPayment}
                  isDeleting={deletingPaymentId === payment._id}
                />
              ))}
            </div>
          )}

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-4">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40"
              >
                Previous
              </button>
              <span className="text-sm font-black text-slate-500">
                Page {page} of {pagination.totalPages}
              </span>
              <button
                type="button"
                onClick={() => setPage((current) => Math.min(pagination.totalPages, current + 1))}
                disabled={page === pagination.totalPages}
                className="rounded-lg border border-slate-200 bg-white px-5 py-2.5 text-sm font-bold text-slate-700 transition hover:border-indigo-200 hover:text-indigo-600 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
