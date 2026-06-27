import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import {
  useAddToWishlistMutation,
  useRemoveFromWishlistMutation,
} from "../../../core/api/endpoints/wishlistApi";
import { getMediaUrl } from "../../../utils/mediaUrl";
import {
  ArrowUpRight,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Clock3,
  CreditCard,
  Globe2,
  Heart,
  Loader2,
  Star,
} from "lucide-react";

const buildInstructorSummary = (course) => {
  const assignments = Array.isArray(course?.assignedInstructors)
    ? course.assignedInstructors.filter((assignment) => assignment?.instructor)
    : [];

  if (assignments.length === 0) {
    return course?.instructor || course?.createdBy?.name || "Bharath Vidya";
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

const formatPrice = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  });

const formatCount = (value) => Number(value || 0).toLocaleString("en-IN");

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

const getProgress = (course) => {
  const rawProgress = Number(course?.progress ?? course?.completionPercentage ?? 0);
  return Math.max(0, Math.min(100, Math.round(rawProgress)));
};

const getNumberFrom = (...values) => {
  for (const value of values) {
    if (Array.isArray(value)) return value.length;
    const parsed = Number(value);
    if (Number.isFinite(parsed) && parsed > 0) return parsed;
  }

  return 0;
};

const countSectionItems = (course, fieldName) => {
  if (!Array.isArray(course?.sections)) return 0;
  return course.sections.reduce((total, section) => {
    const items = section?.[fieldName];
    if (Array.isArray(items)) return total + items.length;
    return total;
  }, 0);
};

const pluralize = (count, singular, plural = `${singular}s`) =>
  `${count} ${count === 1 ? singular : plural}`;

const getFeatureText = (course, type) => {
  if (type === "projects") {
    const count =
      countSectionItems(course, "projects") ||
      getNumberFrom(
        course?.totalProjects,
        course?.projectCount,
        course?.projectsCount,
        course?.projects
      );
    return pluralize(count, "Project");
  }

  if (type === "internships") {
    const internships =
      countSectionItems(course, "virtualInternships") ||
      getNumberFrom(
        course?.totalVirtualInternships,
        course?.internshipCount,
        course?.internshipsCount,
        course?.virtualInternships,
        course?.internships
      );
    const interviews =
      countSectionItems(course, "interviews") ||
      getNumberFrom(
        course?.totalInterviews,
        course?.interviewCount,
        course?.interviewsCount,
        course?.interviews
      );

    return `${pluralize(internships, "Virtual Internship")} + ${pluralize(
      interviews,
      "Interview"
    )}`;
  }

  if (type === "validity") {
    const years =
      getNumberFrom(
        course?.accessDurationYears,
        course?.warrantyYears,
        course?.validityYears,
        course?.accessYears,
        course?.durationYears
      ) || 2;
    return `${years} Years Warranty`;
  }

  return course?.jobAssistanceLabel || "Job Assistance";
};

const getMarketplaceBadge = (course) => {
  if (course?.badge) return course.badge;
  if (course?.isHighlyRated) return "Highly Rated";
  if (course?.isInDemand) return "In Demand";
  return course?.isNew ? "New Launch" : "New Launch";
};

const getCourseLevel = (course) =>
  course?.level || course?.courseLevel || course?.difficulty || "All Levels";

const getInitialWishlistState = (course) =>
  Boolean(
    course?.isWishlisted ||
      course?.isWishlist ||
      course?.wishlisted ||
      course?.savedInWishlist
  );

const getPriceDetails = (course) => {
  const originalPrice = Number(course?.originalPrice ?? course?.price ?? 0);
  const storedDiscount = Number(
    course?.discountPercentage ?? course?.discountPercent ?? course?.discount ?? 0
  );
  const storedFinalPrice = course?.finalPrice ?? course?.discountPrice;
  const computedFinalPrice =
    storedFinalPrice !== undefined && storedFinalPrice !== null
      ? Number(storedFinalPrice)
      : originalPrice > 0 && storedDiscount > 0
      ? Math.max(0, originalPrice - (originalPrice * storedDiscount) / 100)
      : originalPrice;
  const finalPrice = course?.isFree ? 0 : Math.max(0, computedFinalPrice || 0);
  const savings = Math.max(0, originalPrice - finalPrice);
  const discountPercent =
    storedDiscount > 0
      ? Math.round(storedDiscount)
      : originalPrice > 0 && savings > 0
      ? Math.round((savings / originalPrice) * 100)
      : 0;

  return {
    originalPrice,
    finalPrice,
    savings,
    discountPercent,
    priceLabel: course?.isFree || finalPrice <= 0 ? "Free" : formatPrice(finalPrice),
  };
};

function CourseImage({ thumbnail, title, compact = false }) {
  return (
    <div
      className={`relative overflow-hidden bg-slate-100 ${
        compact ? "aspect-[16/9] rounded-lg" : "aspect-[16/9] rounded-lg"
      }`}
    >
      {thumbnail ? (
        <img
          src={thumbnail}
          alt={title}
          className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
        />
      ) : (
        <div className="grid h-full w-full place-items-center bg-white">
          <div className="grid h-24 w-24 place-items-center rounded-full border-4 border-emerald-500 text-center text-lg font-black uppercase leading-tight text-emerald-600">
            Start
            <br />
            Here
          </div>
        </div>
      )}
    </div>
  );
}

function PurchasedCourseCard({ course, onOpen }) {
  const title = course?.title || "Course Title";
  const thumbnail = getMediaUrl(course?.thumbnail, "");
  const instructor = buildInstructorSummary(course);
  const level = getCourseLevel(course);
  const progress = getProgress(course);
  const durationLabel = formatCourseHours(course);
  const isCompleted = progress >= 100 || course?.isCompleted;
  const isExpired = course?.isExpired;

  const badge = isCompleted
    ? { label: "Completed", className: "bg-green-600 text-white" }
    : isExpired
    ? { label: "Expired", className: "bg-red-600 text-white" }
    : { label: "In progress", className: "bg-blue-600 text-white" };

  const actionLabel = isCompleted ? "View course" : "Continue";
  const chapterCount = Number(course?.recentChapters || course?.newChapters || 0);

  return (
    <article className="group overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="block w-full p-3 text-left">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <CourseImage thumbnail={thumbnail} title={title} compact />
        </button>

        <div className="pt-4">
          <button type="button" onClick={onOpen} className="block w-full text-left">
            <span
              className={`inline-flex rounded-full px-3 py-1 text-[10px] font-black uppercase leading-none ${badge.className}`}
            >
              {badge.label}
            </span>

            <h2 className="mt-3 line-clamp-2 min-h-[52px] text-[20px] font-black leading-[1.25] text-black">
              {title}
            </h2>
          </button>

          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs font-semibold text-slate-600">
            <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
              <BookOpen size={13} />
              {level}
            </span>
            {durationLabel && (
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-slate-700">
                <Clock3 size={13} />
                {durationLabel}
              </span>
            )}
            <span className="line-clamp-1 font-medium">{instructor}</span>
          </div>

          {!isCompleted && (
            <div className="mt-4 flex items-center gap-3">
              <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-green-600"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="w-10 text-right text-xs font-semibold text-black">
                {progress}%
              </span>
            </div>
          )}

          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onOpen();
            }}
            className="mt-5 flex h-9 w-full items-center justify-center rounded-md bg-black text-sm font-black text-white transition hover:bg-blue-600"
          >
            {actionLabel}
          </button>
        </div>
      </div>

      {chapterCount > 0 && !isCompleted && (
        <div className="border-t border-slate-100 bg-slate-50 px-4 py-2.5 text-center text-xs font-bold text-black">
          <span className="mr-2 rounded-full bg-red-500 px-3 py-1 text-[10px] font-black uppercase text-white">
            New
          </span>
          {chapterCount} new {chapterCount === 1 ? "chapter" : "chapters"} recently added
        </div>
      )}
    </article>
  );
}

function MarketplaceCourseCard({ course, onOpen, onPayment }) {
  const title = course?.title || "Course Title";
  const thumbnail = getMediaUrl(course?.thumbnail, "");
  const instructor = buildInstructorSummary(course);
  const description =
    course?.shortDescription ||
    course?.subtitle ||
    course?.description ||
    "Practical course content with projects, guidance, and career-focused learning.";
  const level = getCourseLevel(course);
  const rating = Number(course?.averageRating ?? course?.rating ?? 4.9);
  const reviews = Number(
    course?.ratingCount ??
      course?.reviewsCount ??
      course?.totalReviews ??
      course?.reviewCount ??
      0
  );
  const durationLabel = formatCourseHours(course);
  const enrolled = Number(
    course?.studentsEnrolled ??
      course?.totalStudents ??
      course?.enrolledCount ??
      course?.students ??
      0
  );
  const {
    originalPrice,
    finalPrice,
    savings,
    discountPercent,
    priceLabel,
  } = getPriceDetails(course);
  const [isWishlisted, setIsWishlisted] = useState(getInitialWishlistState(course));
  const [addToWishlist, { isLoading: addingToWishlist }] =
    useAddToWishlistMutation();
  const [removeFromWishlist, { isLoading: removingFromWishlist }] =
    useRemoveFromWishlistMutation();
  const isWishlistLoading = addingToWishlist || removingFromWishlist;

  const features = [
    getFeatureText(course, "projects"),
    getFeatureText(course, "internships"),
    getFeatureText(course, "jobAssistance"),
    getFeatureText(course, "validity"),
  ];
  const badgeLabel = getMarketplaceBadge(course);
  const languageLabel = course?.language || "English";

  const handleExplore = (event) => {
    event.stopPropagation();
    onOpen();
  };

  const handlePayment = (event) => {
    event.stopPropagation();
    onPayment();
  };

  const handleWishlistToggle = async (event) => {
    event.stopPropagation();
    if (!course?._id || isWishlistLoading) return;

    try {
      if (isWishlisted) {
        await removeFromWishlist(course._id).unwrap();
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
        return;
      }

      await addToWishlist({ courseId: course._id }).unwrap();
      setIsWishlisted(true);
      toast.success("Saved to wishlist");
    } catch (error) {
      if (!isWishlisted && error?.status === 409) {
        setIsWishlisted(true);
        toast.success("Already in your wishlist");
        return;
      }

      if (isWishlisted && error?.status === 404) {
        setIsWishlisted(false);
        toast.success("Removed from wishlist");
        return;
      }

      toast.error(error?.data?.message || "Could not update wishlist");
    }
  };

  return (
    <article className="font-course-body group flex h-full min-h-[656px] flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg">
      <div className="relative p-3 pb-0">
        <button type="button" onClick={onOpen} className="block w-full text-left">
          <CourseImage thumbnail={thumbnail} title={title} />
        </button>

        <div className="absolute left-6 top-6 z-10 flex max-w-[calc(100%-5rem)] flex-wrap gap-2">
          {discountPercent > 0 && !course?.isFree && (
            <span className="rounded-md bg-[#fbbf24] px-2.5 py-1.5 text-[10px] font-bold uppercase leading-none tracking-[0.05em] text-[#78350f] shadow-sm">
              {discountPercent}% Off
            </span>
          )}
          <span className="rounded-md bg-[#10b981] px-2.5 py-1.5 text-[10px] font-bold uppercase leading-none tracking-[0.05em] text-white shadow-sm">
            {badgeLabel}
          </span>
        </div>

        <button
          type="button"
          onClick={handleWishlistToggle}
          disabled={isWishlistLoading}
          aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
          aria-pressed={isWishlisted}
          title={isWishlisted ? "Saved to wishlist" : "Add to wishlist"}
          className={`absolute right-6 top-6 z-10 grid h-10 w-10 place-items-center rounded-full border bg-white shadow-sm transition disabled:cursor-not-allowed disabled:opacity-70 ${
            isWishlisted
              ? "border-rose-200 text-rose-600 hover:bg-rose-50"
              : "border-slate-100 text-slate-500 hover:border-rose-200 hover:text-rose-600"
          }`}
        >
          {isWishlistLoading ? (
            <Loader2 size={19} className="animate-spin" />
          ) : (
            <Heart
              size={20}
              className={isWishlisted ? "fill-rose-500 text-rose-500" : ""}
            />
          )}
        </button>
      </div>

      <div className="flex flex-1 flex-col px-6 pb-5 pt-5">
        <div className="flex flex-wrap items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.1em] text-[#4f46e5]">
          <BarChart3 size={14} strokeWidth={2.4} />
          <span>{level}</span>
          {durationLabel && (
            <>
              <span className="text-slate-300">•</span>
              <span>{durationLabel}</span>
            </>
          )}
          {course?.language && (
            <>
              <span className="text-slate-300">•</span>
              <span>{course.language}</span>
            </>
          )}
        </div>

        <button type="button" onClick={onOpen} className="block text-left">
          <h2 className="font-course-heading mt-4 line-clamp-2 min-h-[50px] text-[20px] font-bold leading-[1.25] text-[#0f172a]">
            {title}
          </h2>
        </button>

        <p className="mt-2 line-clamp-3 min-h-[68px] text-[14px] font-normal leading-[1.625] text-[#475569]">
          {description}
        </p>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[12px] font-normal leading-none text-[#64748b]">
          {durationLabel && (
            <span className="inline-flex items-center gap-1.5">
              <Clock3 size={14} />
              {durationLabel}
            </span>
          )}
          <span className="inline-flex items-center gap-1.5">
            <Globe2 size={14} />
            {languageLabel}
          </span>
          <span className="inline-flex items-center gap-1.5">
            <Star size={14} className="fill-[#f59e0b] text-[#f59e0b]" />
            {rating.toFixed(1)}
            {reviews > 0 ? ` (${formatCount(reviews)})` : " Rating"}
          </span>
        </div>

        <div className="mt-5 space-y-2.5">
          {features.map((feature) => (
            <span
              key={feature}
              className="flex min-w-0 items-start gap-2 text-[14px] font-normal leading-[1.45] text-[#475569]"
            >
              <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[#10b981]" />
              <span className="min-w-0">{feature}</span>
            </span>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-3">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full border border-slate-200 bg-slate-50 text-[13px] font-bold text-[#4f46e5]">
            {String(instructor || "Bharath Vidya").charAt(0).toUpperCase()}
          </span>
          <p className="line-clamp-1 text-[14px] font-medium text-[#0f172a]">
            {instructor}
          </p>
        </div>

        <div className="mt-auto pt-6">
          <div className="flex flex-wrap items-end justify-between gap-3 border-t border-slate-100 pt-5">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[24px] font-black leading-none text-[#0f172a]">
                  {priceLabel}
                </span>
                {!course?.isFree && originalPrice > finalPrice && (
                  <span className="text-[14px] font-medium leading-none text-[#cbd5e1] line-through">
                    {formatPrice(originalPrice)}
                  </span>
                )}
              </div>
              {!course?.isFree && finalPrice > 0 && (
                <p className="mt-2 text-[12px] font-bold leading-none text-[#059669]">
                  {savings > 0
                    ? `Save ${formatPrice(savings)} today`
                    : "Limited time offer"}
                </p>
              )}
            </div>
            <p className="text-right text-[12px] font-normal leading-tight text-[#64748b]">
              {formatCount(enrolled)}
              <br />
              Enrolled
            </p>
          </div>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleExplore}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-[14px] font-semibold text-[#0f172a] transition hover:border-[#4f46e5] hover:text-[#4f46e5]"
            >
              Explore
              <ArrowUpRight size={16} />
            </button>
            <button
              type="button"
              onClick={handlePayment}
              className="flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-[#4f46e5] px-3 text-[14px] font-semibold text-white transition hover:bg-[#4338ca]"
            >
              <CreditCard size={17} />
              Pay Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

export default function CourseCard({ course }) {
  const navigate = useNavigate();
  const progress = getProgress(course);
  const isPurchased = Boolean(
    course?.isPurchased ||
      course?.hasAccess ||
      course?.isEnrolled ||
      course?.purchaseId ||
      progress > 0
  );

  const goToPlayer = () => {
    if (!course?._id) return;
    navigate(`/course/${course._id}`, {
      state: {
        courseSummary: course,
        isPurchased: true,
      },
    });
  };

  const goToDetails = () => {
    if (!course?._id) return;
    navigate(`/courses/${course._id}`, {
      state: {
        courseSummary: course,
        isPurchased,
      },
    });
  };

  const goToCheckout = () => {
    if (!course?._id) return;
    navigate(`/checkout/${course._id}`, {
      state: {
        courseSummary: course,
      },
    });
  };

  if (isPurchased) {
    return <PurchasedCourseCard course={course} onOpen={goToPlayer} />;
  }

  return (
    <MarketplaceCourseCard
      course={course}
      onOpen={goToDetails}
      onPayment={goToCheckout}
    />
  );
}
