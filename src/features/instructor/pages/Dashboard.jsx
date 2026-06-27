import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetInstructorDashboardQuery,
  useSubmitInstructorCourseMutation,
} from "../../../core/api/endpoints/instructorApi";
import {
  AlertCircle,
  BookOpen,
  CheckCircle,
  ChevronRight,
  Clock,
  FileText,
  Loader2,
  ShieldCheck,
  Sparkles,
  Tag,
  Upload,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";

const STATUS = {
  approved: {
    label: "Approved",
    badge: "border-emerald-200 bg-emerald-50 text-emerald-700",
    Icon: CheckCircle,
  },
  published: {
    label: "Published",
    badge: "border-indigo-200 bg-indigo-50 text-indigo-700",
    Icon: CheckCircle,
  },
  pending: {
    label: "Pending",
    badge: "border-amber-200 bg-amber-50 text-amber-700",
    Icon: Clock,
  },
  rejected: {
    label: "Rejected",
    badge: "border-rose-200 bg-rose-50 text-rose-700",
    Icon: XCircle,
  },
  draft: {
    label: "Draft",
    badge: "border-slate-200 bg-slate-100 text-slate-600",
    Icon: FileText,
  },
};

const EMPTY_STATS = {
  total: 0,
  approved: 0,
  pending: 0,
  rejected: 0,
  draft: 0,
};

const STAT_TONES = {
  indigo: "border-indigo-100 bg-indigo-50 text-indigo-700",
  emerald: "border-emerald-100 bg-emerald-50 text-emerald-700",
  amber: "border-amber-100 bg-amber-50 text-amber-700",
  slate: "border-slate-200 bg-slate-100 text-slate-600",
};

const getStatus = (status) => STATUS[status] || STATUS.draft;
const getCourseId = (course) => course?._id || course?.id;
const toArray = (value) => (Array.isArray(value) ? value : []);

const toNumber = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const formatPrice = (course) => {
  const finalPrice = toNumber(course?.finalPrice, 0);
  if (course?.isFree || finalPrice <= 0) return "Free";
  return `Rs. ${finalPrice.toLocaleString("en-IN")}`;
};

const getDaysLeft = (expiry) => {
  if (!expiry) return null;
  const expiryDate = new Date(expiry);
  if (Number.isNaN(expiryDate.getTime())) return null;
  return Math.max(0, Math.ceil((expiryDate - new Date()) / 86400000));
};

const getAccessState = (user) => {
  if (!user) {
    return {
      allowed: false,
      message: "Instructor profile was not returned. Please login again.",
    };
  }

  if (user.role !== "instructor") {
    return {
      allowed: false,
      message: "Instructor access is required for this page.",
    };
  }

  if (user.isInstructorActive !== true) {
    return {
      allowed: false,
      message: "Your instructor access is currently inactive. Contact admin to activate.",
    };
  }

  if (user.permissionExpiry) {
    const expiryDate = new Date(user.permissionExpiry);
    if (!Number.isNaN(expiryDate.getTime()) && expiryDate <= new Date()) {
      return {
        allowed: false,
        message: "Your instructor permission has expired. Contact admin to renew.",
      };
    }
  }

  return { allowed: true, message: "" };
};

function StatCard({ label, value, icon: Icon, tone = "slate", sub }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm transition hover:border-slate-300">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
            {label}
          </p>
          <p className="mt-3 text-3xl font-black tracking-tight text-slate-950">
            {value}
          </p>
          {sub && <p className="mt-1 text-sm text-slate-500">{sub}</p>}
        </div>
        <div
          className={`flex h-10 w-10 items-center justify-center rounded-lg border ${
            STAT_TONES[tone] || STAT_TONES.slate
          }`}
        >
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function CourseMetric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={13} />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="mt-1 text-sm font-bold text-slate-950">{value}</p>
    </div>
  );
}

function CourseCard({ course, onSubmit, onUpload, navigate, submittingCourseId }) {
  const courseId = getCourseId(course);
  const status = getStatus(course.status);
  const StatusIcon = status.Icon;
  const sections = toArray(course.sections);
  const totalSections = sections.length;
  const totalVideos = sections.reduce(
    (sum, section) => sum + toArray(section.videos).length,
    0
  );
  const isThisSubmitting = submittingCourseId === courseId;
  const canUpload = course.canUpload !== false && Boolean(courseId);

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="relative h-48 overflow-hidden bg-slate-100">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title || "Course thumbnail"}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <BookOpen size={38} className="text-slate-300" />
          </div>
        )}

        <div className="absolute left-3 top-3 flex flex-wrap gap-2">
          <span
            className={`inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${status.badge}`}
          >
            <StatusIcon size={12} />
            {status.label}
          </span>

          {course.isAssignedToMe && !course.isCreatedByMe && (
            <span className="inline-flex items-center gap-1.5 rounded-md border border-sky-200 bg-sky-50 px-2.5 py-1 text-xs font-bold text-sky-700">
              <ShieldCheck size={12} />
              Assigned
            </span>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="min-w-0">
            <h3 className="line-clamp-2 text-lg font-black leading-tight text-slate-950">
              {course.title || "Untitled Course"}
            </h3>
            <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-slate-500">
              {course.description || "No description provided."}
            </p>
          </div>

          <p className="shrink-0 text-sm font-black text-emerald-600">
            {formatPrice(course)}
          </p>
        </div>

        {course.myModule && (
          <div className="mt-4 inline-flex max-w-full items-center gap-1.5 rounded-md border border-indigo-100 bg-indigo-50 px-2.5 py-1 text-xs font-bold text-indigo-700">
            <Tag size={11} />
            <span className="truncate">{course.myModule}</span>
          </div>
        )}

        <div className="mt-4 grid grid-cols-3 gap-2">
          <CourseMetric
            icon={Video}
            label="Videos"
            value={totalVideos}
          />
          <CourseMetric
            icon={BookOpen}
            label="Sections"
            value={totalSections}
          />
          <CourseMetric
            icon={Users}
            label="Students"
            value={toNumber(course.totalStudents, 0)}
          />
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={() => onUpload(courseId)}
            disabled={!canUpload}
            className="flex flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-45"
          >
            <Upload size={15} />
            Upload Video
          </button>

          {course.isCreatedByMe && course.status === "draft" && (
            <button
              onClick={() => onSubmit(courseId)}
              disabled={isThisSubmitting || !courseId}
              className="flex items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isThisSubmitting ? (
                <Loader2 size={15} className="animate-spin" />
              ) : (
                <ChevronRight size={15} />
              )}
              Submit
            </button>
          )}

          {(course.status === "approved" || course.status === "published") && (
            <button
              onClick={() => navigate(`/course/${courseId}`)}
              disabled={!courseId}
              className="rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-45"
            >
              View
            </button>
          )}
        </div>

        {course.status === "rejected" && (
          <div className="mt-4 rounded-lg border border-rose-200 bg-rose-50 px-3 py-2">
            <p className="text-sm font-semibold text-rose-700">
              Rejected by admin. Fix issues and resubmit.
            </p>
          </div>
        )}
      </div>
    </article>
  );
}

export default function InstructorDashboard() {
  const navigate = useNavigate();
  const [submittingCourseId, setSubmittingCourseId] = useState(null);

  const {
    data,
    error,
    isLoading,
    isError,
    refetch,
  } = useGetInstructorDashboardQuery();
  const [submitCourse] = useSubmitInstructorCourseMutation();

  const user = data?.user || data?.data?.user || null;
  const courses = useMemo(
    () => toArray(data?.data?.courses || data?.courses),
    [data]
  );

  const fallbackStats = useMemo(() => ({
    total: courses.length,
    approved: courses.filter((course) =>
      ["approved", "published"].includes(course.status)
    ).length,
    pending: courses.filter((course) => course.status === "pending").length,
    rejected: courses.filter((course) => course.status === "rejected").length,
    draft: courses.filter((course) => course.status === "draft").length,
  }), [courses]);

  const stats = data?.data?.stats || data?.stats || fallbackStats || EMPTY_STATS;
  const access = useMemo(() => getAccessState(user), [user]);
  const daysLeft = useMemo(
    () => getDaysLeft(user?.permissionExpiry),
    [user?.permissionExpiry]
  );

  const createdCount = useMemo(
    () => courses.filter((course) => course.isCreatedByMe && !course.isAssignedToMe).length,
    [courses]
  );

  const assignedCount = useMemo(
    () => courses.filter((course) => !course.isCreatedByMe && course.isAssignedToMe).length,
    [courses]
  );

  const handleSubmit = useCallback(async (courseId) => {
    if (!courseId) return;

    try {
      setSubmittingCourseId(courseId);
      await submitCourse(courseId).unwrap();
      toast.success("Course submitted for review.");
      refetch();
    } catch (err) {
      toast.error(err?.data?.message || "Failed to submit course");
    } finally {
      setSubmittingCourseId(null);
    }
  }, [refetch, submitCourse]);

  const handleUpload = useCallback((courseId) => {
    if (!courseId) return;
    navigate(`/instructor/upload-video?courseId=${courseId}`);
  }, [navigate]);

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="text-center">
          <Loader2 size={34} className="mx-auto mb-4 animate-spin text-indigo-600" />
          <p className="text-sm font-semibold text-slate-500">Loading instructor workspace...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    const message = error?.data?.message || error?.error || "Failed to load dashboard";

    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <Toaster position="top-right" />
        <div className="max-w-sm rounded-lg border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <AlertCircle size={34} className="mx-auto mb-4 text-rose-500" />
          <p className="mb-4 text-sm font-semibold text-slate-600">{message}</p>
          <button
            onClick={refetch}
            className="rounded-md bg-slate-950 px-5 py-2 text-sm font-bold text-white transition hover:bg-slate-800"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!access.allowed) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <Toaster position="top-right" />
        <div className="max-w-sm rounded-lg border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <AlertCircle size={34} className="mx-auto mb-4 text-rose-500" />
          <h2 className="mb-2 text-xl font-black text-slate-950">Access Restricted</h2>
          <p className="text-sm leading-relaxed text-slate-500">{access.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-950">
      <Toaster position="top-right" />

      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 md:px-6">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="flex items-center gap-2 text-sm font-black uppercase tracking-wider text-indigo-600">
                <Sparkles size={15} />
                Instructor Workspace
              </div>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                Welcome back, {user?.name?.split(" ")[0] || "Instructor"}
              </h1>
              <div className="mt-4 flex flex-wrap items-center gap-2">
                <span className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-1 text-sm font-bold text-emerald-700">
                  Active
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                  {daysLeft !== null ? `${daysLeft} days remaining` : "Unlimited access"}
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                  {assignedCount} assigned by admin
                </span>
                <span className="rounded-md border border-slate-200 bg-slate-50 px-3 py-1 text-sm font-semibold text-slate-600">
                  {createdCount} created
                </span>
              </div>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={() => navigate("/instructor/my-courses")}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-800 shadow-sm transition hover:bg-slate-50"
              >
                <BookOpen size={16} />
                My Courses
              </button>
              <button
                onClick={() => navigate("/instructor/upload-video")}
                className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-bold text-white shadow-sm transition hover:bg-slate-800"
              >
                <Upload size={16} />
                Upload Video
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Total Courses"
            value={stats.total || 0}
            icon={BookOpen}
            tone="indigo"
          />
          <StatCard
            label="Approved"
            value={stats.approved || 0}
            icon={CheckCircle}
            tone="emerald"
            sub="Live courses"
          />
          <StatCard
            label="Pending"
            value={stats.pending || 0}
            icon={Clock}
            tone="amber"
            sub="Awaiting review"
          />
          <StatCard
            label="Draft"
            value={stats.draft || 0}
            icon={FileText}
            tone="slate"
            sub="Not submitted"
          />
        </div>

        {daysLeft !== null && daysLeft <= 7 && daysLeft > 0 && (
          <div className="mt-6 flex items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
            <Clock size={18} className="shrink-0 text-amber-700" />
            <p className="text-sm font-semibold text-amber-800">
              Your instructor permission expires in <strong>{daysLeft} days</strong>. Contact admin to renew.
            </p>
          </div>
        )}

        <div className="mt-8 flex items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-950">Assigned Courses</h2>
            <p className="mt-1 text-sm text-slate-500">
              {courses.length} course{courses.length !== 1 ? "s" : ""} available for teaching
            </p>
          </div>
          {courses.length > 0 && (
            <button
              onClick={() => navigate("/instructor/my-courses")}
              className="rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              View All
            </button>
          )}
        </div>

        {courses.length === 0 ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <BookOpen size={38} className="mb-4 text-slate-300" />
            <h3 className="text-lg font-black text-slate-950">No courses assigned yet</h3>
            <p className="mt-2 max-w-md text-sm text-slate-500">
              Assigned courses will appear here when admin grants teaching access.
            </p>
          </div>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard
                key={getCourseId(course)}
                course={course}
                onSubmit={handleSubmit}
                onUpload={handleUpload}
                submittingCourseId={submittingCourseId}
                navigate={navigate}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
