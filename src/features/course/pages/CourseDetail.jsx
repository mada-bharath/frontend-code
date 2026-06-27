import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Award,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Clock3,
  Download,
  FileText,
  Globe2,
  IndianRupee,
  Layers3,
  Loader2,
  Map,
  PlayCircle,
  Star,
  Users,
} from "lucide-react";
import { useAuth } from "../../../core/providers/AuthProvider";
import {
  useGetCourseByIdQuery,
  useRateCourseMutation,
} from "../../../core/api/endpoints/courseApi";
import { useCheckCourseAccessQuery } from "../../../core/api/endpoints/paymentApi";
import { getMediaUrl } from "../../../utils/mediaUrl";

const formatPrice = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

const extractCourse = (payload) =>
  payload?.data?.course || payload?.course || payload?.data || payload || null;

const formatDate = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";

  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const clampRating = (value) => {
  const rating = Number(value);
  if (!Number.isFinite(rating)) return 0;
  return Math.max(0, Math.min(5, rating));
};

const buildBrochureFilename = (course) => {
  const slug =
    String(course?.title || "course")
      .trim()
      .replace(/[^a-z0-9]+/gi, "-")
      .replace(/^-+|-+$/g, "")
      .toLowerCase() || "course";

  return `${slug}-brochure.pdf`;
};

const getPriceDetails = (course) => {
  const originalPrice = Number(course?.originalPrice ?? course?.price ?? 0);
  const storedDiscount = Number(
    course?.discountPercentage ?? course?.discountPercent ?? course?.discount ?? 0
  );
  const storedFinalPrice = course?.finalPrice ?? course?.discountPrice;
  const finalPrice = course?.isFree
    ? 0
    : Math.max(
        0,
        Number(
          storedFinalPrice ??
            (storedDiscount > 0
              ? originalPrice - (originalPrice * storedDiscount) / 100
              : originalPrice)
        ) || 0
      );
  const savings = Math.max(0, originalPrice - finalPrice);
  const discountPercent =
    storedDiscount > 0
      ? Math.round(storedDiscount)
      : originalPrice > 0 && savings > 0
      ? Math.round((savings / originalPrice) * 100)
      : 0;

  return { originalPrice, finalPrice, savings, discountPercent };
};

const countSectionItems = (sections, fieldName) =>
  Array.isArray(sections)
    ? sections.reduce((total, section) => {
        const items = section?.[fieldName];
        return total + (Array.isArray(items) ? items.length : 0);
      }, 0)
    : 0;

const getTotalVideos = (course) =>
  Number(course?.totalVideos) ||
  countSectionItems(course?.sections, "videos") ||
  Number(course?.lessonsCount) ||
  0;

const getCourseDurationSeconds = (course) => {
  const explicitSeconds = Number(
    course?.totalDurationSeconds ??
      course?.totalDuration ??
      course?.durationSeconds
  );

  if (Number.isFinite(explicitSeconds) && explicitSeconds > 0) {
    return explicitSeconds;
  }

  const explicitHours = Number(course?.totalHours ?? course?.hours);
  if (Number.isFinite(explicitHours) && explicitHours > 0) {
    return explicitHours * 3600;
  }

  if (!Array.isArray(course?.sections)) return 0;

  return course.sections.reduce((courseTotal, section) => {
    const videos = Array.isArray(section?.videos) ? section.videos : [];
    return (
      courseTotal +
      videos.reduce(
        (sectionTotal, video) => sectionTotal + (Number(video?.duration) || 0),
        0
      )
    );
  }, 0);
};

const formatCourseHours = (course) => {
  const seconds = getCourseDurationSeconds(course);
  if (!Number.isFinite(seconds) || seconds <= 0) return "0 Hours";

  const totalMinutes = Math.max(1, Math.round(seconds / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours} ${hours === 1 ? "Hour" : "Hours"}`;
  return `${minutes}m`;
};

const getAccessLabel = (course, accessData, isPurchased) => {
  const expiry =
    accessData?.data?.expiryDate ||
    accessData?.data?.expiresAt ||
    accessData?.expiryDate ||
    accessData?.expiresAt;
  const formattedExpiry = formatDate(expiry);

  if (isPurchased && formattedExpiry) return `Valid until ${formattedExpiry}`;

  return "2 Years Access";
};

const getInstructorSummary = (course) => {
  const assignments = Array.isArray(course?.assignedInstructors)
    ? course.assignedInstructors.filter((assignment) => assignment?.instructor)
    : [];

  if (!assignments.length) {
    return course?.createdBy?.name || course?.instructor || "Bharath Vidya";
  }

  return assignments
    .map((assignment) => {
      const name =
        assignment.instructor?.name ||
        assignment.instructor?.email ||
        "Instructor";
      return assignment.moduleName ? `${assignment.moduleName}: ${name}` : name;
    })
    .join(", ");
};

const getInstructorAvatar = (course) => {
  const assignments = Array.isArray(course?.assignedInstructors)
    ? course.assignedInstructors.filter((assignment) => assignment?.instructor)
    : [];
  const instructor = assignments[0]?.instructor || course?.createdBy || {};

  return getMediaUrl(
    instructor.avatar ||
      instructor.profileImage ||
      instructor.photo ||
      instructor.image ||
      course?.instructorImage
  );
};

const toStringList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.map((item) => String(item || "").trim()).filter(Boolean);
  }
  if (typeof value === "string") {
    return value
      .split(/\r?\n|,/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
};

const formatResourceDuration = (value) => {
  const duration = Number(value || 0);
  if (!Number.isFinite(duration) || duration <= 0) return "";

  const totalSeconds = Math.round(duration);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  if (hours > 0) {
    return [hours, minutes, seconds]
      .map((part) => String(part).padStart(2, "0"))
      .join(":");
  }

  return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
};

const getCurriculumRows = (section) => {
  const videos = Array.isArray(section?.videos) ? section.videos : [];
  const projects = Array.isArray(section?.projects) ? section.projects : [];
  const virtualInternships = Array.isArray(section?.virtualInternships)
    ? section.virtualInternships
    : [];
  const interviews = Array.isArray(section?.interviews) ? section.interviews : [];

  return [
    ...videos.map((item) => ({ ...item, type: "Video", icon: PlayCircle })),
    ...projects.map((item) => ({ ...item, type: "Project", icon: Layers3 })),
    ...virtualInternships.map((item) => ({
      ...item,
      type: "Virtual Internship",
      icon: Award,
    })),
    ...interviews.map((item) => ({ ...item, type: "Interview", icon: FileText })),
  ];
};

const getSectionKey = (section, index) =>
  String(section?._id || section?.id || section?.title || `section-${index}`);

const getSectionDurationSeconds = (section) =>
  getCurriculumRows(section).reduce(
    (total, item) => total + (Number(item?.duration) || 0),
    0
  );

const formatCompactDuration = (seconds) => {
  const duration = Number(seconds || 0);
  if (!Number.isFinite(duration) || duration <= 0) return "";

  const totalMinutes = Math.max(1, Math.round(duration / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${minutes}m`;
};

function RatingStars({ value, size = 18 }) {
  const rating = clampRating(value);

  return (
    <span className="inline-flex items-center gap-1" aria-label={`${rating} out of 5`}>
      {[0, 1, 2, 3, 4].map((index) => {
        const fillAmount = Math.max(0, Math.min(1, rating - index));

        return (
          <span
            key={index}
            className="relative inline-grid"
            style={{ width: size, height: size }}
          >
            <Star size={size} className="text-amber-200" />
            <span
              className="absolute inset-0 overflow-hidden"
              style={{ width: `${fillAmount * 100}%` }}
            >
              <Star size={size} className="fill-amber-400 text-amber-400" />
            </span>
          </span>
        );
      })}
    </span>
  );
}

function CourseDetailHeader({ onNavigate }) {
  return (
    <header className="border-b border-slate-200 bg-white">
      <div className="mx-auto flex h-[72px] max-w-[1216px] items-center justify-between px-4 sm:px-6 lg:px-8">
        <button
          type="button"
          onClick={() => onNavigate("/courses")}
          className="flex items-center gap-3"
          aria-label="Go to courses"
        >
          <span className="grid h-10 w-10 place-items-center rounded-lg bg-blue-600 text-[20px] font-black text-white">
            B
          </span>
          <span className="text-[20px] font-black tracking-normal text-blue-700">
            BHARATH VIDYA
          </span>
        </button>

        <nav className="hidden items-center gap-9 text-[14px] font-medium text-slate-900 sm:flex">
          <button
            type="button"
            onClick={() => onNavigate("/courses")}
            className="transition hover:text-blue-700"
          >
            Courses
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/discussion")}
            className="transition hover:text-blue-700"
          >
            Discussion
          </button>
          <button
            type="button"
            onClick={() => onNavigate("/my-courses")}
            className="transition hover:text-blue-700"
          >
            My Courses
          </button>
        </nav>
      </div>
    </header>
  );
}

function EmptyCourseField({ children }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 px-4 py-3 text-[14px] font-semibold text-slate-500">
      {children}
    </div>
  );
}

export default function CourseDetail() {
  const { id, courseId: routeCourseId } = useParams();
  const courseId = routeCourseId || id;
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDownloadingBrochure, setIsDownloadingBrochure] = useState(false);
  const [selectedRating, setSelectedRating] = useState(0);
  const [ratingMessage, setRatingMessage] = useState("");
  const [sectionOpenState, setSectionOpenState] = useState({});
  const [rateCourse, { isLoading: isRatingCourse }] = useRateCourseMutation();

  const { data, isLoading } = useGetCourseByIdQuery(courseId, {
    skip: !courseId,
  });
  const { data: accessData, isLoading: isAccessLoading } =
    useCheckCourseAccessQuery(courseId, {
      skip: !courseId || !user,
  });

  const course = extractCourse(data);
  const { originalPrice, finalPrice, savings, discountPercent } =
    getPriceDetails(course);
  const isPurchased = Boolean(
    accessData?.data?.hasAccess ||
      data?.isPurchased ||
      data?.data?.isPurchased ||
      course?.isPurchased ||
      course?.hasAccess ||
      course?.isEnrolled ||
      course?.purchaseId
  );

  const sections = Array.isArray(course?.sections) ? course.sections : [];
  const totalLessons = getTotalVideos(course);
  const roadmapUrl = getMediaUrl(course?.roadmap);
  const brochureUrl = getMediaUrl(course?.brochure);
  const thumbnailUrl = getMediaUrl(
    course?.thumbnail,
    "https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=1200&q=80"
  );
  const courseSubtitle =
    String(course?.subtitle || course?.shortDescription || "").trim();
  const instructorSummary = getInstructorSummary(course);
  const instructorAvatar = getInstructorAvatar(course);
  const rating = clampRating(course?.averageRating ?? course?.rating ?? 0);
  const reviews = Number(
    course?.totalReviews ??
      course?.ratingCount ??
      course?.reviewsCount ??
      course?.reviewCount ??
      0
  );
  const enrolled = Number(
    course?.totalStudents ??
      course?.studentsEnrolled ??
      course?.enrolledCount ??
      course?.students ??
      0
  );
  const learningOutcomes = toStringList(course?.outcomes);
  const requirementsList = toStringList(course?.requirements);
  const materialIncludes = toStringList(course?.materialIncludes);
  const audienceList = toStringList(course?.audience);
  const curriculumSections = sections.length ? sections : [];
  const courseDurationLabel = formatCourseHours(course);
  const courseAccessLabel = getAccessLabel(course, accessData, isPurchased);
  const languageLabel = course?.language || course?.medium || "English";
  const levelLabel = course?.level || "All Levels";
  const includeIcons = [PlayCircle, FileText, Download, Clock3, Award, Users];

  const toggleSection = (section, index) => {
    const key = getSectionKey(section, index);
    setSectionOpenState((current) => ({
      ...current,
      [key]: !(current[key] ?? index === 0),
    }));
  };

  const handlePrimaryAction = () => {
    if (!courseId) return;

    if (!user) {
      navigate(`/login?redirect=/checkout/${courseId}`);
      return;
    }

    if (isPurchased) {
      navigate(`/course/${courseId}`, {
        state: { courseSummary: course, isPurchased: true },
      });
      return;
    }

    navigate(`/checkout/${courseId}`);
  };

  const handleBrochureDownload = async () => {
    if (!brochureUrl || isDownloadingBrochure) return;

    const filename = buildBrochureFilename(course);
    setIsDownloadingBrochure(true);

    try {
      const response = await fetch(brochureUrl, { credentials: "include" });
      if (!response.ok) throw new Error("Brochure download failed");

      const blob = await response.blob();
      const objectUrl = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = objectUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000);
    } catch {
      const link = document.createElement("a");
      link.href = brochureUrl;
      link.download = filename;
      link.target = "_blank";
      link.rel = "noreferrer";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } finally {
      setIsDownloadingBrochure(false);
    }
  };

  const handleRateCourse = async (value) => {
    if (!courseId || !isPurchased || isRatingCourse) return;

    setSelectedRating(value);
    setRatingMessage("");

    try {
      await rateCourse({ id: courseId, rating: value }).unwrap();
      setRatingMessage("Thanks, your rating has been saved.");
    } catch (err) {
      setRatingMessage(
        err?.data?.message || "Could not save rating. Please try again."
      );
    }
  };

  if (isLoading) {
    return (
      <div className="font-course-body min-h-screen bg-[#eef5ff] text-slate-950">
        <CourseDetailHeader onNavigate={navigate} />
        <div className="flex min-h-screen items-center justify-center pt-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="font-course-body min-h-screen bg-[#eef5ff] text-slate-950">
        <CourseDetailHeader onNavigate={navigate} />
        <div className="mx-auto max-w-4xl px-6 pt-32 text-center">
          <h1 className="text-3xl font-black text-slate-950">Course not found</h1>
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="mt-6 inline-flex items-center gap-2 rounded-md bg-blue-600 px-6 py-3 text-sm font-black text-white"
          >
            <BookOpen size={18} />
            Browse Courses
          </button>
        </div>
      </div>
    );
  }

  const instructorInitial =
    String(instructorSummary || "Bharath Vidya").trim().charAt(0).toUpperCase() || "B";
  const contentSummaryParts = [
    `${curriculumSections.length} sections`,
    `${totalLessons} lectures`,
    `${courseDurationLabel} total`,
  ];

  return (
    <div className="font-course-body min-h-screen bg-[#eef5ff] text-slate-950">
      <CourseDetailHeader onNavigate={navigate} />

      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex h-[46px] max-w-[1216px] items-center gap-2 px-4 text-[14px] font-medium text-slate-500 sm:px-6 lg:px-8">
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="transition hover:text-blue-700"
          >
            Home
          </button>
          <span>/</span>
          <button
            type="button"
            onClick={() => navigate("/courses")}
            className="transition hover:text-blue-700"
          >
            Courses
          </button>
          <span>/</span>
          <span className="font-semibold text-blue-700">{course.title}</span>
        </div>
      </div>

      <main className="mx-auto max-w-[1216px] px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,800px)_382px]">
          <div className="space-y-8">
            <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/80">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-lg bg-violet-600 px-4 py-2 text-[14px] font-bold text-white">
                  {levelLabel}
                </span>
                {discountPercent > 0 && !course.isFree && (
                  <span className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-2 text-[14px] font-bold text-white">
                    <Star size={15} className="fill-white text-white" />
                    {discountPercent}% DISCOUNT
                  </span>
                )}
              </div>

              <h1 className="font-course-heading mt-6 text-[44px] font-black leading-[1.05] tracking-normal text-slate-950 sm:text-[48px]">
                {course.title}
              </h1>

              {courseSubtitle && (
                <p className="mt-5 text-[20px] font-normal leading-8 text-slate-700">
                  {courseSubtitle}
                </p>
              )}

              {course.description && (
                <p className="mt-6 max-w-[720px] text-[16px] font-normal leading-8 text-slate-700">
                  {course.description}
                </p>
              )}

              <div className="mt-7 flex flex-wrap items-center gap-x-8 gap-y-3 border-b border-slate-200 pb-6 text-[16px] text-slate-700">
                <span className="inline-flex items-center gap-2">
                  <Star size={19} className="fill-amber-400 text-amber-400" />
                  <strong className="font-black text-slate-950">
                    {rating.toFixed(1)}
                  </strong>
                  <span>({formatCount(reviews)} ratings)</span>
                </span>
                <span className="inline-flex items-center gap-2">
                  <Users size={20} className="text-blue-600" />
                  {formatCount(enrolled)} students
                </span>
                <span className="inline-flex items-center gap-2">
                  <Globe2 size={20} className="text-slate-600" />
                  {languageLabel}
                </span>
                <span className="inline-flex items-center gap-2">
                  <Award size={20} className="text-violet-600" />
                  {levelLabel}
                </span>
              </div>

              <div className="mt-6 flex items-center gap-4">
                {instructorAvatar ? (
                  <img
                    src={instructorAvatar}
                    alt={instructorSummary}
                    className="h-[58px] w-[58px] shrink-0 rounded-full border border-slate-200 object-cover"
                  />
                ) : (
                  <span className="grid h-[58px] w-[58px] shrink-0 place-items-center rounded-full bg-slate-200 text-[20px] font-black text-slate-700">
                    {instructorInitial}
                  </span>
                )}
                <div>
                  <p className="text-[14px] font-normal text-slate-500">Created by</p>
                  <p className="text-[16px] font-bold leading-6 text-slate-950">
                    {instructorSummary}
                  </p>
                </div>
              </div>

              {isPurchased && (
                <div className="mt-5 inline-flex flex-wrap items-center gap-3 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3">
                  <span className="text-[14px] font-black text-slate-800">
                    Rate this course
                  </span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((value) => (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleRateCourse(value)}
                        disabled={isRatingCourse}
                        className="text-amber-400 transition hover:scale-110 disabled:cursor-not-allowed disabled:opacity-60"
                        aria-label={"Rate " + value + " star" + (value > 1 ? "s" : "")}
                      >
                        <Star
                          size={21}
                          className={
                            value <= selectedRating
                              ? "fill-amber-400 text-amber-400"
                              : "text-amber-300"
                          }
                        />
                      </button>
                    ))}
                  </div>
                  {ratingMessage && (
                    <span className="text-[12px] font-bold text-slate-600">
                      {ratingMessage}
                    </span>
                  )}
                </div>
              )}

              <div className="mt-8 flex flex-wrap gap-4">
                <button
                  type="button"
                  onClick={handleBrochureDownload}
                  disabled={!brochureUrl || isDownloadingBrochure}
                  className="inline-flex h-[60px] min-w-[248px] items-center justify-center gap-3 rounded-lg border-2 border-blue-600 bg-white px-6 text-[16px] font-bold text-blue-700 transition hover:bg-blue-50 disabled:cursor-not-allowed disabled:border-slate-200 disabled:text-slate-400"
                >
                  {isDownloadingBrochure ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Download size={20} />
                  )}
                  {isDownloadingBrochure ? "Preparing PDF" : "Download Brochure"}
                </button>

                <button
                  type="button"
                  onClick={() => navigate("/courses/" + courseId + "/roadmap")}
                  disabled={!roadmapUrl}
                  className="inline-flex h-[60px] min-w-[220px] items-center justify-center gap-3 rounded-lg bg-gradient-to-r from-amber-500 to-orange-600 px-6 text-[16px] font-bold text-white shadow-lg shadow-orange-200 transition hover:brightness-105 disabled:cursor-not-allowed disabled:from-slate-300 disabled:to-slate-300 disabled:shadow-none"
                >
                  <Map size={20} />
                  View Roadmap
                </button>

                <span className="inline-flex h-[60px] min-w-[198px] items-center justify-center gap-3 rounded-lg bg-teal-600 px-6 text-[16px] font-bold text-white shadow-lg shadow-teal-100">
                  <Clock3 size={20} />
                  {courseDurationLabel} Total
                </span>

                <span className="inline-flex h-[56px] min-w-[208px] items-center justify-center gap-3 rounded-lg bg-violet-600 px-6 text-[16px] font-bold text-white shadow-lg shadow-violet-100">
                  <Award size={20} />
                  {courseAccessLabel}
                </span>
              </div>
            </section>

            <section className="rounded-lg border border-blue-100 bg-[#eef4ff] p-8 shadow-xl shadow-slate-200/50">
              <div className="mb-6 flex items-center gap-4">
                <BookOpen size={30} className="text-blue-600" />
                <h2 className="font-course-heading text-[24px] font-black leading-tight text-slate-950">
                  What You'll Learn
                </h2>
              </div>

              {learningOutcomes.length > 0 ? (
                <div className="grid gap-x-10 gap-y-5 sm:grid-cols-2">
                  {learningOutcomes.map((item, index) => (
                    <div
                      key={item + "-" + index}
                      className="flex items-start gap-4 text-[16px] font-normal leading-7 text-slate-700"
                    >
                      <CheckCircle2
                        size={22}
                        className="mt-0.5 shrink-0 text-blue-600"
                      />
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyCourseField>
                  Learning outcomes will appear after the admin adds them.
                </EmptyCourseField>
              )}
            </section>

            <section
              id="course-content"
              className="scroll-mt-28 rounded-lg border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70"
            >
              <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
                <h2 className="font-course-heading text-[24px] font-black text-slate-950">
                  Course Content
                </h2>
                <div className="flex flex-wrap items-center gap-2 text-[14px] font-bold text-slate-600">
                  {contentSummaryParts.map((part, index) => (
                    <span key={part} className="inline-flex items-center gap-2">
                      {index > 0 && (
                        <span className="h-1 w-1 rounded-full bg-slate-400" />
                      )}
                      {part}
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-4">
                {curriculumSections.length > 0 ? (
                  curriculumSections.map((section, index) => {
                    const rows = getCurriculumRows(section);
                    const sectionKey = getSectionKey(section, index);
                    const isSectionOpen = sectionOpenState[sectionKey] ?? index === 0;
                    const sectionDuration = formatCompactDuration(
                      getSectionDurationSeconds(section)
                    );
                    const titleText = section.title || "Course lessons";
                    const sectionTitle = /^section\s+\d+/i.test(titleText)
                      ? titleText
                      : "Section " + (index + 1) + ": " + titleText;
                    const sectionSummary =
                      rows.length +
                      " " +
                      (rows.length === 1 ? "lecture" : "lectures") +
                      (sectionDuration ? " / " + sectionDuration : "");

                    return (
                      <div
                        key={sectionKey}
                        className="overflow-hidden rounded-lg border border-slate-200 bg-white"
                      >
                        <button
                          type="button"
                          onClick={() => toggleSection(section, index)}
                          className="grid w-full grid-cols-[24px_1fr] items-center gap-5 bg-slate-100 px-6 py-5 text-left transition hover:bg-slate-200/70"
                          aria-expanded={isSectionOpen}
                        >
                          {isSectionOpen ? (
                            <ChevronUp size={19} className="text-slate-700" />
                          ) : (
                            <ChevronDown size={19} className="text-slate-700" />
                          )}
                          <span>
                            <span className="block text-[18px] font-bold leading-6 text-slate-950">
                              {sectionTitle}
                            </span>
                            <span className="mt-1 block text-[14px] font-normal text-slate-600">
                              {sectionSummary}
                            </span>
                          </span>
                        </button>

                        {isSectionOpen && (
                          rows.length > 0 ? (
                            <div className="bg-white px-6 py-2">
                              {rows.map((item, rowIndex) => {
                                const duration = formatResourceDuration(item.duration);
                                const isFreeResource = Boolean(
                                  item?.isFree ||
                                    item?.isPreview ||
                                    item?.freePreview ||
                                    item?.preview ||
                                    item?.access === "free"
                                );

                                return (
                                  <div
                                    key={item._id || item.title || rowIndex}
                                    className="grid gap-3 py-4 text-[16px] font-normal text-slate-700 sm:grid-cols-[1fr_auto] sm:items-center"
                                  >
                                    <div className="flex min-w-0 items-center gap-4">
                                      <PlayCircle
                                        size={18}
                                        className={
                                          isFreeResource
                                            ? "shrink-0 text-blue-600"
                                            : "shrink-0 text-slate-400"
                                        }
                                      />
                                      <span className="min-w-0 truncate">
                                        {item.title || item.type + " " + (rowIndex + 1)}
                                      </span>
                                      {isFreeResource && (
                                        <span className="rounded bg-emerald-50 px-3 py-1 text-[12px] font-bold text-emerald-700">
                                          FREE
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[14px] font-normal text-slate-600">
                                      {duration || "Preview"}
                                    </span>
                                  </div>
                                );
                              })}
                            </div>
                          ) : (
                            <div className="px-6 py-5">
                              <EmptyCourseField>
                                Content names will appear after videos are added.
                              </EmptyCourseField>
                            </div>
                          )
                        )}
                      </div>
                    );
                  })
                ) : (
                  <EmptyCourseField>
                    Course modules will appear after the admin or instructor adds videos.
                  </EmptyCourseField>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
              <h2 className="font-course-heading text-[24px] font-black text-slate-950">
                Requirements
              </h2>
              {requirementsList.length > 0 ? (
                <ul className="mt-6 grid gap-4">
                  {requirementsList.map((item, index) => (
                    <li
                      key={item + "-" + index}
                      className="flex items-start gap-4 text-[16px] font-normal leading-7 text-slate-700"
                    >
                      <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6">
                  <EmptyCourseField>
                    Requirements will appear after the admin adds them.
                  </EmptyCourseField>
                </div>
              )}
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/70">
              <h2 className="font-course-heading text-[24px] font-black text-slate-950">
                Audience
              </h2>
              {audienceList.length > 0 ? (
                <ul className="mt-6 grid gap-4">
                  {audienceList.map((item, index) => (
                    <li
                      key={item + "-" + index}
                      className="flex items-start gap-4 text-[16px] font-normal leading-7 text-slate-700"
                    >
                      <span className="mt-3 h-2 w-2 shrink-0 rounded-full bg-blue-600" />
                      {item}
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-6">
                  <EmptyCourseField>
                    Audience details will appear after the admin adds them.
                  </EmptyCourseField>
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6 lg:sticky lg:top-8">
            <section className="overflow-hidden rounded-lg border border-slate-200 bg-white shadow-xl shadow-slate-200/80">
              <img
                src={thumbnailUrl}
                alt={course.title}
                className="aspect-[16/9] w-full object-cover"
              />

              <div className="p-6">
                <div className="flex flex-wrap items-end gap-3">
                  <span className="inline-flex items-center text-[28px] font-black leading-none text-slate-950">
                    {course.isFree || finalPrice <= 0 ? (
                      "Free"
                    ) : (
                      <>
                        <IndianRupee size={26} />
                        {finalPrice.toLocaleString("en-IN")}
                      </>
                    )}
                  </span>
                  {originalPrice > finalPrice && !course.isFree && (
                    <span className="pb-1 text-[16px] font-bold text-slate-400 line-through">
                      {formatPrice(originalPrice)}
                    </span>
                  )}
                  {discountPercent > 0 && !course.isFree && (
                    <span className="mb-0.5 rounded-lg bg-red-50 px-3 py-1.5 text-[14px] font-bold text-red-700">
                      {discountPercent}% OFF
                    </span>
                  )}
                </div>

                {savings > 0 && !course.isFree && (
                  <p className="mt-5 flex items-center gap-2 text-[14px] font-bold text-red-700">
                    <Clock3 size={16} />
                    Limited time offer! Sale ends soon
                  </p>
                )}

                <button
                  type="button"
                  onClick={handlePrimaryAction}
                  disabled={isAccessLoading}
                  className="mt-7 inline-flex h-[56px] w-full items-center justify-center rounded-lg bg-blue-600 px-5 text-[16px] font-bold text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isPurchased ? "Continue Learning" : "Enroll Now"}
                </button>

                {!isPurchased && (
                  <button
                    type="button"
                    onClick={handlePrimaryAction}
                    disabled={isAccessLoading}
                    className="mt-3 inline-flex h-[50px] w-full items-center justify-center rounded-lg border border-slate-300 bg-white px-5 text-[15px] font-bold text-slate-800 transition hover:border-blue-300 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Add to Cart
                  </button>
                )}

                <p className="mt-5 text-center text-[12px] font-normal text-slate-500">
                  30-Day Money-Back Guarantee
                </p>
              </div>
            </section>

            <section className="rounded-lg border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/70">
              <h2 className="font-course-heading text-[22px] font-black text-slate-950">
                This Course Includes
              </h2>
              {materialIncludes.length > 0 ? (
                <ul className="mt-5 space-y-4">
                  {materialIncludes.map((item, index) => {
                    const IncludeIcon = includeIcons[index % includeIcons.length];

                    return (
                      <li
                        key={item + "-" + index}
                        className="flex items-start gap-4 text-[14px] font-normal leading-6 text-slate-700"
                      >
                        <IncludeIcon size={18} className="mt-0.5 shrink-0 text-blue-600" />
                        <span>{item}</span>
                      </li>
                    );
                  })}
                </ul>
              ) : (
                <div className="mt-5">
                  <EmptyCourseField>
                    Course includes will appear after the admin adds them.
                  </EmptyCourseField>
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}
