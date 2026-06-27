import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ChevronDown, Loader2, Search } from "lucide-react";
import Navbar from "../../../design-system/layouts/Navbar";
import CourseCard from "../components/CourseCard";
import {
  useGetCoursesQuery,
  useGetCourseTagsQuery,
} from "../../../core/api/endpoints/courseApi";
import { useCourseFilter } from "../hooks/useCourse";

const ALL_COURSES = "allcourses";

const SEARCH_SCOPE_OPTIONS = [
  { label: "Course", value: "course" },
  { label: "Section", value: "section" },
  { label: "Chapter", value: "chapter" },
];

const normalizeValue = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "-");

const uniqueValues = (values = []) => {
  const seen = new Set();
  return values
    .map((value) => String(value || "").trim())
    .filter(Boolean)
    .filter((value) => {
      const key = normalizeValue(value);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
};

const containsText = (value, query) =>
  String(value || "").toLowerCase().includes(query);

const courseMatchesSearch = (course, query, scope) => {
  const search = String(query || "").trim().toLowerCase();
  if (!search) return true;

  if (scope === "section") {
    return Array.isArray(course?.sections)
      ? course.sections.some((section) =>
          containsText(section?.title || section?.moduleName, search)
        )
      : false;
  }

  if (scope === "chapter") {
    if (!Array.isArray(course?.sections)) return false;

    return course.sections.some((section) => {
      const rows = [
        ...(Array.isArray(section?.videos) ? section.videos : []),
        ...(Array.isArray(section?.projects) ? section.projects : []),
        ...(Array.isArray(section?.virtualInternships)
          ? section.virtualInternships
          : []),
        ...(Array.isArray(section?.interviews) ? section.interviews : []),
      ];

      return rows.some((item) =>
        containsText(item?.title || item?.name || item?.label, search)
      );
    });
  }

  return [
    course?.title,
    course?.subtitle,
    course?.description,
    course?.language,
    course?.level,
    ...(Array.isArray(course?.tags) ? course.tags : []),
  ].some((value) => containsText(value, search));
};

function TagPill({ active, children, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`min-h-10 rounded-full border px-4 py-2 text-[14px] font-semibold leading-tight transition ${
        active
          ? "border-blue-600 bg-blue-600 text-white shadow-sm"
          : "border-slate-200 bg-white text-slate-700 hover:border-blue-600 hover:text-blue-700"
      }`}
    >
      {children}
    </button>
  );
}

export default function Courses() {
  const [searchParams, setSearchParams] = useSearchParams();
  const tagParam = searchParams.get("tag") || ALL_COURSES;
  const [search, setSearch] = useState("");
  const [selectedTag, setSelectedTag] = useState(tagParam);
  const [selectedScope, setSelectedScope] = useState("course");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  useEffect(() => {
    setSelectedTag(tagParam);
  }, [tagParam]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search.trim());
    }, 450);

    return () => clearTimeout(timer);
  }, [search]);

  const { data, isLoading, isFetching } = useGetCoursesQuery({
    search: debouncedSearch,
    scope: selectedScope,
    tag: selectedTag,
    limit: 60,
  });
  const { data: tagData } = useGetCourseTagsQuery();

  const courses = data?.data || [];
  const roleFilteredCourses = useCourseFilter(courses);
  const courseTags = uniqueValues(tagData?.data || []);

  const visibleCourses = useMemo(
    () =>
      roleFilteredCourses.filter((course) =>
        courseMatchesSearch(course, debouncedSearch, selectedScope)
      ),
    [debouncedSearch, roleFilteredCourses, selectedScope]
  );

  const updateTagParam = (tag) => {
    const nextParams = new URLSearchParams(searchParams);

    if (tag === ALL_COURSES) {
      nextParams.delete("tag");
    } else {
      nextParams.set("tag", tag);
    }

    setSearchParams(nextParams);
  };

  const handleTagChange = (tag) => {
    setSelectedTag(tag);
    updateTagParam(tag);
  };

  const resetFilters = () => {
    setSearch("");
    setSelectedScope("course");
    setSelectedTag(ALL_COURSES);
    setSearchParams({});
  };

  return (
    <div className="font-course-body min-h-screen bg-[#f8fafc] text-[#0f172a]">
      <Navbar />

      <main className="mx-auto max-w-[1360px] px-4 pb-24 pt-28 sm:px-6 lg:px-8">
        <section className="mb-8">
          <h1 className="font-course-heading text-[40px] font-bold leading-none tracking-normal text-[#0f172a]">
            Courses
          </h1>

          <div className="mt-7 grid gap-4 lg:grid-cols-[minmax(0,1fr)_176px]">
            <label className="relative block">
              <Search
                size={22}
                className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[#64748b]"
              />
              <input
                type="text"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="search by course title or description"
                className="h-[56px] w-full rounded-lg border border-slate-200 bg-white pl-14 pr-4 text-[16px] font-normal text-[#0f172a] outline-none shadow-sm transition placeholder:text-[#64748b] focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
              />
            </label>

            <label className="relative block">
              <select
                value={selectedScope}
                onChange={(event) => setSelectedScope(event.target.value)}
                className="h-[56px] w-full appearance-none rounded-lg border border-blue-600 bg-white px-4 pr-10 text-[16px] font-medium text-[#0f172a] outline-none shadow-sm transition focus:ring-4 focus:ring-blue-100"
                aria-label="Search filter"
              >
                {SEARCH_SCOPE_OPTIONS.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={18}
                className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#64748b]"
              />
            </label>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-3">
            <TagPill
              active={selectedTag === ALL_COURSES}
              onClick={() => handleTagChange(ALL_COURSES)}
            >
              All Courses
            </TagPill>

            {courseTags.map((tag) => (
              <TagPill
                key={tag}
                active={selectedTag === tag}
                onClick={() => handleTagChange(tag)}
              >
                {tag}
              </TagPill>
            ))}
          </div>
        </section>

        <section className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-[14px] font-medium text-[#64748b]">
              {isLoading
                ? "Loading courses..."
                : `${visibleCourses.length} course${
                    visibleCourses.length === 1 ? "" : "s"
                  } found`}
            </p>
            {isFetching && !isLoading && (
              <span className="inline-flex items-center gap-2 text-[12px] font-semibold uppercase tracking-[0.05em] text-blue-600">
                <Loader2 size={14} className="animate-spin" />
                Updating
              </span>
            )}
          </div>

          {isLoading ? (
            <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-slate-200 bg-white">
              <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
            </div>
          ) : visibleCourses.length === 0 ? (
            <section className="rounded-lg border border-slate-200 bg-white px-6 py-20 text-center shadow-sm">
              <h2 className="font-course-heading text-[24px] font-bold leading-tight text-[#0f172a]">
                No courses found
              </h2>
              <p className="mt-2 text-[14px] font-normal leading-[1.625] text-[#475569]">
                Try another search term or admin-created course tag.
              </p>
              <button
                type="button"
                onClick={resetFilters}
                className="mt-6 rounded-lg bg-blue-600 px-6 py-3 text-[14px] font-semibold text-white transition hover:bg-blue-700"
              >
                Reset Filters
              </button>
            </section>
          ) : (
            <>
              <section className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">
                {visibleCourses.map((course) => (
                  <CourseCard key={course._id} course={course} />
                ))}
              </section>

              <p className="py-16 text-center text-[14px] font-medium text-[#64748b]">
                That's it! No more courses to show.
              </p>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
