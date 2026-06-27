import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  useGetInstructorDashboardQuery,
  useSubmitInstructorCourseMutation,
} from "../../../core/api/endpoints/instructorApi";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  Clock,
  FileText,
  Loader2,
  Play,
  Search,
  Send,
  Upload,
  Users,
  Video,
  XCircle,
} from "lucide-react";

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

const STATUS_FILTERS = ["all", "approved", "pending", "draft", "rejected"];

const getStatus = (status) => STATUS[status] || STATUS.draft;
const toArray = (value) => (Array.isArray(value) ? value : []);

const fmtDuration = (sec = 0) => {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
};

const formatPrice = (course) => {
  const finalPrice = Number(course?.finalPrice || 0);
  if (course?.isFree || finalPrice <= 0) return "Free";
  return `Rs. ${finalPrice.toLocaleString("en-IN")}`;
};

function VideoBadge({ status = "approved" }) {
  const tone = {
    approved: "border-emerald-200 bg-emerald-50 text-emerald-700",
    pending: "border-amber-200 bg-amber-50 text-amber-700",
    processing: "border-sky-200 bg-sky-50 text-sky-700",
    rejected: "border-rose-200 bg-rose-50 text-rose-700",
    draft: "border-slate-200 bg-slate-100 text-slate-600",
  }[status] || "border-slate-200 bg-slate-100 text-slate-600";

  return (
    <span className={`rounded-md border px-2 py-1 text-xs font-bold capitalize ${tone}`}>
      {status}
    </span>
  );
}

function SectionRow({ section, courseId, navigate }) {
  const [open, setOpen] = useState(false);
  const videos = toArray(section.videos);
  const studyMaterials = toArray(section.studyMaterials);
  const projects = toArray(section.projects);
  const internships = toArray(section.virtualInternships);
  const interviews = toArray(section.interviews);

  return (
    <div className="border-t border-slate-200 first:border-t-0">
      <div
        role="button"
        tabIndex={0}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            setOpen((value) => !value);
          }
        }}
        className="flex w-full items-center gap-3 px-4 py-3 text-left transition hover:bg-slate-50"
      >
        <ChevronDown
          size={15}
          className={`shrink-0 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`}
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-bold text-slate-950">
            {section.title || "Untitled section"}
          </p>
          <p className="text-xs text-slate-500">
            {videos.length} video{videos.length !== 1 ? "s" : ""} / {studyMaterials.length} material{studyMaterials.length !== 1 ? "s" : ""} / {projects.length} project{projects.length !== 1 ? "s" : ""} / {internships.length} internship{internships.length !== 1 ? "s" : ""} / {interviews.length} interview{interviews.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap justify-end gap-2">
          {[
            ["video", "Video"],
            ["material", "Material"],
            ["project", "Project"],
            ["internship", "Internship"],
            ["interview", "Interview"],
          ].map(([type, label]) => (
            <button
              key={type}
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/instructor/upload-video?courseId=${courseId}&sectionId=${section._id}&type=${type}`);
              }}
              className="inline-flex items-center gap-1.5 rounded-md bg-slate-950 px-3 py-2 text-xs font-bold text-white transition hover:bg-slate-800"
            >
              <Upload size={13} />
              {label}
            </button>
          ))}
        </div>
      </div>

      {open && (
        <div className="bg-slate-50 px-4 py-3">
          {videos.length === 0 ? (
            <p className="text-sm text-slate-500">No videos yet.</p>
          ) : (
            <div className="space-y-2">
              {videos.map((video) => (
                <div
                  key={video._id}
                  className="flex items-center gap-3 rounded-md border border-slate-200 bg-white px-3 py-2"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-slate-100 text-slate-500">
                    <Play size={12} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                    {video.title || "Untitled video"}
                  </p>
                  {video.duration > 0 && (
                    <span className="text-xs font-semibold text-slate-500">
                      {fmtDuration(video.duration)}
                    </span>
                  )}
                  <VideoBadge status={video.uploadStatus || "approved"} />
                </div>
              ))}
            </div>
          )}
          {studyMaterials.length > 0 && (
            <div className="mt-3 space-y-2">
              {studyMaterials.map((material) => (
                <div
                  key={material._id}
                  className="flex items-center gap-3 rounded-md border border-teal-100 bg-white px-3 py-2"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-teal-50 text-teal-700">
                    <FileText size={12} />
                  </span>
                  <p className="min-w-0 flex-1 truncate text-sm font-semibold text-slate-700">
                    {material.title || "Untitled material"}
                  </p>
                  <span className="rounded-md border border-teal-100 bg-teal-50 px-2 py-1 text-xs font-bold capitalize text-teal-700">
                    {String(material.category || "material").replace(/-/g, " ")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Metric({ icon: Icon, label, value }) {
  return (
    <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2">
      <div className="flex items-center gap-2 text-slate-500">
        <Icon size={13} />
        <span className="text-xs font-semibold">{label}</span>
      </div>
      <p className="mt-1 text-sm font-black text-slate-950">{value}</p>
    </div>
  );
}

function CourseCard({ course, onSubmit, navigate, isSubmitting }) {
  const [expanded, setExpanded] = useState(false);
  const status = getStatus(course.status);
  const StatusIcon = status.Icon;
  const sections = toArray(course.sections);
  const totalVideos = sections.reduce(
    (sum, section) => sum + toArray(section.videos).length,
    0
  );
  const totalDuration = sections.reduce(
    (sum, section) =>
      sum + toArray(section.videos).reduce((total, video) => total + (video.duration || 0), 0),
    0
  );
  const totalProjects = sections.reduce(
    (sum, section) => sum + toArray(section.projects).length,
    0
  );
  const totalMaterials = sections.reduce(
    (sum, section) => sum + toArray(section.studyMaterials).length,
    0
  );
  const totalInternships = sections.reduce(
    (sum, section) => sum + toArray(section.virtualInternships).length,
    0
  );
  const totalInterviews = sections.reduce(
    (sum, section) => sum + toArray(section.interviews).length,
    0
  );

  return (
    <article className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="grid gap-0 md:grid-cols-[220px_1fr]">
        <div className="relative h-52 bg-slate-100 md:h-full">
          {course.thumbnail ? (
            <img
              src={course.thumbnail}
              alt={course.title || "Course thumbnail"}
              className="h-full w-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center">
              <BookOpen size={36} className="text-slate-300" />
            </div>
          )}
          <span
            className={`absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md border px-2.5 py-1 text-xs font-bold ${status.badge}`}
          >
            <StatusIcon size={12} />
            {status.label}
          </span>
        </div>

        <div className="p-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="min-w-0">
              <h3 className="text-xl font-black leading-tight text-slate-950">
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

          <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-3 xl:grid-cols-7">
            <Metric icon={Video} label="Videos" value={totalVideos} />
            <Metric icon={BookOpen} label="Sections" value={sections.length} />
            <Metric icon={FileText} label="Materials" value={totalMaterials} />
            <Metric icon={FileText} label="Projects" value={totalProjects} />
            <Metric icon={FileText} label="Internships" value={totalInternships} />
            <Metric icon={FileText} label="Interviews" value={totalInterviews} />
            <Metric icon={Users} label="Students" value={course.totalStudents || 0} />
            <Metric icon={Clock} label="Duration" value={totalDuration > 0 ? fmtDuration(totalDuration) : "0m"} />
          </div>

          <div className="mt-5 flex flex-col gap-2 sm:flex-row">
            <button
              onClick={() => navigate(`/instructor/upload-video?courseId=${course._id}`)}
              className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Upload size={15} />
              Upload Video
            </button>

            {course.status === "draft" && (
              <button
                onClick={() => onSubmit(course._id)}
                disabled={isSubmitting}
                className="inline-flex items-center justify-center gap-2 rounded-md border border-amber-200 bg-amber-50 px-4 py-2.5 text-sm font-bold text-amber-700 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
                Submit
              </button>
            )}

            <button
              onClick={() => setExpanded((value) => !value)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              Sections
              <ChevronDown
                size={15}
                className={`transition-transform ${expanded ? "rotate-180" : ""}`}
              />
            </button>
          </div>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200">
          {sections.length > 0 ? (
            sections.map((section) => (
              <SectionRow
                key={section._id}
                section={section}
                courseId={course._id}
                navigate={navigate}
              />
            ))
          ) : (
            <div className="px-5 py-6 text-sm text-slate-500">
              No sections available.
            </div>
          )}
        </div>
      )}
    </article>
  );
}

export default function MyCourses() {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");

  const { data, isLoading, isError, refetch } = useGetInstructorDashboardQuery();
  const [submitCourse, { isLoading: isSubmitting }] = useSubmitInstructorCourseMutation();

  const allCourses = data?.data?.courses || [];
  const courses = useMemo(() => {
    return allCourses.filter((course) => {
      const matchSearch =
        search.trim() === "" ||
        course.title?.toLowerCase().includes(search.trim().toLowerCase());
      const matchStatus = statusFilter === "all" || course.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [allCourses, search, statusFilter]);

  const counts = useMemo(() => {
    return {
      total: allCourses.length,
      approved: allCourses.filter((course) => ["approved", "published"].includes(course.status)).length,
      pending: allCourses.filter((course) => course.status === "pending").length,
      draft: allCourses.filter((course) => course.status === "draft").length,
      rejected: allCourses.filter((course) => course.status === "rejected").length,
    };
  }, [allCourses]);

  const handleSubmit = async (courseId) => {
    try {
      await submitCourse(courseId).unwrap();
      refetch();
    } catch (error) {
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <div className="rounded-lg border border-slate-200 bg-white px-6 py-8 text-center shadow-sm">
          <AlertCircle size={32} className="mx-auto mb-3 text-rose-500" />
          <p className="mb-4 text-sm font-semibold text-slate-600">Failed to load courses</p>
          <button
            onClick={refetch}
            className="rounded-md bg-slate-950 px-5 py-2 text-sm font-bold text-white"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 md:px-6">
          <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
            <div>
              <button
                onClick={() => navigate("/instructor/dashboard")}
                className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
              >
                <ArrowLeft size={15} />
                Dashboard
              </button>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                Upload Course
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                {counts.total} total / {counts.approved} approved / {counts.pending} pending
              </p>
            </div>
            <button
              onClick={() => navigate("/instructor/upload-video")}
              className="inline-flex items-center justify-center gap-2 rounded-md bg-slate-950 px-4 py-3 text-sm font-bold text-white transition hover:bg-slate-800"
            >
              <Upload size={16} />
              Upload Video
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-7xl px-4 py-7 md:px-6">
        <div className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-center">
          <div className="relative">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search assigned courses"
              className="w-full rounded-lg border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {STATUS_FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setStatusFilter(filter)}
                className={`rounded-md border px-3 py-2 text-sm font-bold capitalize transition ${
                  statusFilter === filter
                    ? "border-slate-950 bg-slate-950 text-white"
                    : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>
        </div>

        {courses.length === 0 ? (
          <div className="mt-5 flex flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 py-20 text-center">
            <BookOpen size={38} className="mb-4 text-slate-300" />
            <h2 className="text-lg font-black text-slate-950">No matching courses</h2>
            <p className="mt-2 text-sm text-slate-500">
              Try another search or status filter.
            </p>
          </div>
        ) : (
          <div className="mt-5 space-y-5">
            {courses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                onSubmit={handleSubmit}
                navigate={navigate}
                isSubmitting={isSubmitting}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
