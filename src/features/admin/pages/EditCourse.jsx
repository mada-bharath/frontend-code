/**
 * =========================================================
 * ✏️ EDIT COURSES PAGE (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/admin/pages/EditCourse.jsx
 *
 * Features:
 * ✅ Real API — GET /api/admin/courses (live DB data)
 * ✅ Real API — PUT /api/admin/courses/:id (update)
 * ✅ Course card layout — thumbnail, title, price, discount visible
 * ✅ Edit panel — all fields: title, description, price, discount
 * ✅ Thumbnail upload — preview before save
 * ✅ Roadmap upload — PDF preview/replace
 * ✅ Brochure upload — PDF preview/replace
 * ✅ Instructor names shown (single or multiple)
 * ✅ Status badge (draft/approved/published)
 * ✅ Search + filter bar
 * ✅ Loading skeleton + error state
 * ✅ Toast notifications on success/error
 * =========================================================
 */

import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate } from "react-router-dom";
import toast, { Toaster } from "react-hot-toast";
import {
  Search,
  Image as ImageIcon,
  FileText,
  BookOpen,
  Users,
  IndianRupee,
  Tag,
  CheckCircle2,
  XCircle,
  Upload,
  RefreshCw,
  ChevronRight,
  AlertTriangle,
  Eye,
  BookMarked,
  Star,
  Clock,
  Layers,
} from "lucide-react";

import {
  useGetAdminCourseListQuery,
  useUpdateAdminCourseMutation,
} from "../../../core/api/endpoints/adminApi.js";

/* ─────────────────────────────────────────
   STATUS BADGE CONFIG
───────────────────────────────────────── */
const STATUS_CONFIG = {
  approved:  { label: "Approved",  bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500" },
  published: { label: "Published", bg: "bg-blue-50",    text: "text-blue-700",    border: "border-blue-200",    dot: "bg-blue-500"    },
  draft:     { label: "Draft",     bg: "bg-slate-50",   text: "text-slate-500",   border: "border-slate-200",   dot: "bg-slate-400"   },
  pending:   { label: "Pending",   bg: "bg-amber-50",   text: "text-amber-700",   border: "border-amber-200",   dot: "bg-amber-500"   },
  rejected:  { label: "Rejected",  bg: "bg-red-50",     text: "text-red-700",     border: "border-red-200",     dot: "bg-red-500"     },
};

const StatusBadge = ({ status }) => {
  const cfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-widest border ${cfg.bg} ${cfg.text} ${cfg.border}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot}`} />
      {cfg.label}
    </span>
  );
};

const linesToArray = (value) =>
  String(value || "")
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

const tagsToArray = (value) =>
  String(value || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const arrayToLines = (value) =>
  Array.isArray(value) ? value.filter(Boolean).join("\n") : "";

/* ─────────────────────────────────────────
   FILE UPLOAD ZONE
   Shows current file + preview + replace button
───────────────────────────────────────── */
const FileUploadZone = ({ label, icon, accept, current, preview, onFileChange, type = "image" }) => {
  const inputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const UploadIcon = icon || Upload;

  const handleDrop = (e) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files?.[0];
    if (file) onFileChange(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">
        {label}
      </label>

      {/* Current file display */}
      {(current || preview) && (
        <div className="relative rounded-2xl overflow-hidden border border-slate-100 bg-slate-50">
          {type === "image" && (current || preview) ? (
            <img
              src={preview || current}
              alt={label}
              className="w-full h-32 object-cover"
            />
          ) : (
            <div className="flex items-center gap-3 p-4">
              <div className="h-10 w-10 bg-indigo-100 rounded-xl flex items-center justify-center">
                <FileText size={20} className="text-indigo-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-slate-700 truncate max-w-[200px]">
                  {preview ? "New file selected" : "Current file"}
                </p>
                {current && !preview && (
                  <a
                    href={current}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] text-indigo-600 font-bold flex items-center gap-1 hover:underline"
                  >
                    <Eye size={10} /> View Current
                  </a>
                )}
              </div>
              {preview && (
                <span className="ml-auto px-2 py-1 bg-emerald-50 text-emerald-600 text-[10px] font-black rounded-lg border border-emerald-100">
                  ✓ Ready to save
                </span>
              )}
            </div>
          )}
        </div>
      )}

      {/* Upload zone */}
      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 p-4 border-2 border-dashed rounded-2xl cursor-pointer transition-all ${
          dragOver
            ? "border-indigo-400 bg-indigo-50"
            : "border-slate-200 hover:border-indigo-300 hover:bg-slate-50"
        }`}
      >
        <div className={`h-9 w-9 rounded-xl flex items-center justify-center transition-all ${dragOver ? "bg-indigo-100 text-indigo-600" : "bg-slate-100 text-slate-400"}`}>
          <UploadIcon size={18} />
        </div>
        <div className="text-center">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider">
            {current ? "Replace" : "Upload"} {label}
          </p>
          <p className="text-[9px] text-slate-300 font-bold mt-0.5">
            {type === "image" ? "JPG, PNG, WEBP" : "PDF only"} • Drag or click
          </p>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFileChange(file);
        }}
      />
    </div>
  );
};

/* ─────────────────────────────────────────
   COURSE CARD (left panel)
───────────────────────────────────────── */
const CourseCard = ({ course, isSelected, onClick }) => {
  /* Get instructor names from assignedInstructors array */
  const instructorNames = useMemo(() => {
    if (!course.assignedInstructors?.length) return null;
    return course.assignedInstructors
      .filter((a) => a.instructor)
      .map((a) => a.instructor?.name || a.instructor?.email || "Unknown")
      .join(", ");
  }, [course.assignedInstructors]);

  return (
    <div
      onClick={onClick}
      className={`group relative flex gap-4 p-4 rounded-2xl border cursor-pointer transition-all duration-200 ${
        isSelected
          ? "bg-indigo-50 border-indigo-300 shadow-md shadow-indigo-100"
          : "bg-white border-slate-100 hover:border-indigo-200 hover:bg-slate-50 hover:shadow-sm"
      }`}
    >
      {/* Thumbnail */}
      <div className="shrink-0 h-16 w-20 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="h-full w-full flex items-center justify-center">
            <BookOpen size={20} className="text-slate-300" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-extrabold text-sm text-slate-800 truncate group-hover:text-indigo-700 transition-colors capitalize">
            {course.title || "Untitled Course"}
          </h3>
          <StatusBadge status={course.status} />
        </div>

        {/* Price row */}
        <div className="flex items-center gap-2 mb-1">
          <span className="font-black text-indigo-600 text-sm">
            ₹{course.finalPrice ?? course.originalPrice ?? 0}
          </span>
          {course.discountPercentage > 0 && (
            <>
              <span className="text-[10px] text-slate-400 line-through font-bold">
                ₹{course.originalPrice}
              </span>
              <span className="px-1.5 py-0.5 bg-emerald-50 text-emerald-700 text-[9px] font-black rounded-full border border-emerald-100">
                {course.discountPercentage}% OFF
              </span>
            </>
          )}
        </div>

        {/* Instructor names */}
        {instructorNames && (
          <p className="text-[10px] text-slate-400 font-bold flex items-center gap-1 truncate">
            <Users size={10} /> {instructorNames}
          </p>
        )}

        {/* Assets indicators */}
        <div className="flex items-center gap-2 mt-1.5">
          {course.thumbnail && (
            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black rounded-md border border-slate-100 flex items-center gap-1">
              <ImageIcon size={9} /> Thumbnail
            </span>
          )}
          {course.roadmap && (
            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black rounded-md border border-slate-100 flex items-center gap-1">
              <FileText size={9} /> Roadmap
            </span>
          )}
          {course.brochure && (
            <span className="px-1.5 py-0.5 bg-slate-50 text-slate-400 text-[9px] font-black rounded-md border border-slate-100 flex items-center gap-1">
              <BookMarked size={9} /> Brochure
            </span>
          )}
        </div>
      </div>

      {/* Selected arrow */}
      {isSelected && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-indigo-500">
          <ChevronRight size={16} />
        </div>
      )}
    </div>
  );
};

/* ─────────────────────────────────────────
   LOADING SKELETON
───────────────────────────────────────── */
const CardSkeleton = () => (
  <div className="flex gap-4 p-4 rounded-2xl border border-slate-100 bg-white animate-pulse">
    <div className="h-16 w-20 rounded-xl bg-slate-200 shrink-0" />
    <div className="flex-1 space-y-2">
      <div className="h-4 w-3/4 bg-slate-200 rounded-xl" />
      <div className="h-3 w-1/2 bg-slate-100 rounded-xl" />
      <div className="h-3 w-1/3 bg-slate-100 rounded-xl" />
    </div>
  </div>
);

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function EditCourses() {
  const navigate = useNavigate();

  /* ── API ── */
  const { data, isLoading, isError, refetch } = useGetAdminCourseListQuery();
  const [updateCourse, { isLoading: updating }] = useUpdateAdminCourseMutation();

  /* ── UI State ── */
  const [selected,    setSelected]    = useState(null);
  const [search,      setSearch]      = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  /* ── Form State ── */
  const [form, setForm] = useState({
    title:              "",
    subtitle:           "",
    description:        "",
    originalPrice:      0,
    discountPercentage: 0,
    level:              "All Levels",
    language:           "English",
    tags:               "",
    isFree:             false,
    isLocked:           true,
    averageRating:      0,
    totalReviews:       0,
    totalStudents:      0,
    contentHighlights:  "",
    materialIncludes:   "",
    requirements:       "",
    outcomes:           "",
    audience:           "",
  });

  /* ── File State (new uploads) ── */
  const [newThumbnail, setNewThumbnail] = useState(null);
  const [newRoadmap,   setNewRoadmap]   = useState(null);
  const [newBrochure,  setNewBrochure]  = useState(null);

  /* ── Preview URLs ── */
  const [thumbPreview, setThumbPreview] = useState(null);

  /* ── Normalize API response ── */
  const courseList = useMemo(() => {
    if (!data) return [];
    if (Array.isArray(data))           return data;
    if (Array.isArray(data.data))      return data.data;
    if (Array.isArray(data.courses))   return data.courses;
    return [];
  }, [data]);

  /* ── Filter + Search ── */
  const filteredCourses = useMemo(() => {
    return courseList.filter((c) => {
      const matchSearch =
        !search ||
        c.title?.toLowerCase().includes(search.toLowerCase()) ||
        c.description?.toLowerCase().includes(search.toLowerCase()) ||
        (Array.isArray(c.tags) && c.tags.some((tag) =>
          String(tag || "").toLowerCase().includes(search.toLowerCase())
        ));
      const matchStatus =
        filterStatus === "all" || c.status === filterStatus;
      return matchSearch && matchStatus;
    });
  }, [courseList, search, filterStatus]);

  /* ── Select course → populate form ── */
  const handleSelect = (course) => {
    setSelected(course);
    setNewThumbnail(null);
    setNewRoadmap(null);
    setNewBrochure(null);
    setThumbPreview(null);

    setForm({
      title:              course.title              || "",
      subtitle:           course.subtitle           || "",
      description:        course.description        || "",
      originalPrice:      course.originalPrice      || course.price || 0,
      discountPercentage: course.discountPercentage || 0,
      level:              course.level              || "All Levels",
      language:           course.language           || "English",
      tags:               arrayToLines(course.tags),
      isFree:             course.isFree             || false,
      isLocked:           course.isLocked           ?? true,
      averageRating:      course.averageRating      || 0,
      totalReviews:       course.totalReviews       || 0,
      totalStudents:      course.totalStudents      || 0,
      contentHighlights:  arrayToLines(course.contentHighlights),
      materialIncludes:   arrayToLines(course.materialIncludes),
      requirements:       arrayToLines(course.requirements),
      outcomes:           arrayToLines(course.outcomes),
      audience:           arrayToLines(course.audience),
    });
  };

  /* ── Handle thumbnail file selection ── */
  const handleThumbnailChange = (file) => {
    setNewThumbnail(file);
    /* Create object URL for live preview */
    const url = URL.createObjectURL(file);
    setThumbPreview(url);
  };

  /* Cleanup object URLs on unmount */
  useEffect(() => {
    return () => {
      if (thumbPreview) URL.revokeObjectURL(thumbPreview);
    };
  }, [thumbPreview]);

  /* ── Computed final price ── */
  const finalPrice = useMemo(() => {
    if (form.isFree) return 0;
    const p = Number(form.originalPrice)      || 0;
    const d = Number(form.discountPercentage) || 0;
    return Math.max(0, p - (p * d) / 100);
  }, [form.originalPrice, form.discountPercentage, form.isFree]);

  /* ── Validation ── */
  const validate = () => {
    if (!selected?._id)          return "No course selected";
    if (!form.title.trim())      return "Title is required";
    if (!form.description.trim()) return "Description is required";
    if (Number(form.originalPrice) < 0) return "Price cannot be negative";
    if (Number(form.discountPercentage) < 0 || Number(form.discountPercentage) > 100)
      return "Discount must be between 0 and 100";
    if (Number(form.averageRating) < 0 || Number(form.averageRating) > 5)
      return "Rating must be between 0 and 5";
    if (Number(form.totalReviews) < 0 || Number(form.totalStudents) < 0)
      return "Reviews and enrolled students cannot be negative";
    return null;
  };

  /* ── Submit update ── */
  const handleUpdate = async () => {
    const error = validate();
    if (error) return toast.error(error);

    try {
      /* If files are attached, send as FormData (multipart) */
      const hasFiles = newThumbnail || newRoadmap || newBrochure;
      const detailLists = {
        contentHighlights: linesToArray(form.contentHighlights),
        tags: tagsToArray(form.tags),
        materialIncludes: linesToArray(form.materialIncludes),
        requirements: linesToArray(form.requirements),
        outcomes: linesToArray(form.outcomes),
        audience: linesToArray(form.audience),
      };
      const payload = { ...form, ...detailLists, finalPrice };

      if (hasFiles) {
        /* Build FormData for file upload */
        const formData = new FormData();
        Object.entries(payload).forEach(([key, val]) => {
          formData.append(key, Array.isArray(val) ? JSON.stringify(val) : val);
        });
        if (newThumbnail) formData.append("thumbnail", newThumbnail);
        if (newRoadmap)   formData.append("roadmap",   newRoadmap);
        if (newBrochure)  formData.append("brochure",  newBrochure);

        await updateCourse({ id: selected._id, data: formData }).unwrap();
      } else {
        /* No files — send plain JSON */
        await updateCourse({
          id:   selected._id,
          data: payload,
        }).unwrap();
      }

      toast.success("Course updated successfully 🚀");
      setNewThumbnail(null);
      setNewRoadmap(null);
      setNewBrochure(null);
      setThumbPreview(null);
      refetch();

    } catch (err) {
      toast.error(err?.data?.message || "Update failed. Please try again.");
    }
  };

  /* ── Get instructor display for edit panel ── */
  const selectedInstructors = useMemo(() => {
    if (!selected?.assignedInstructors?.length) return [];
    return selected.assignedInstructors
      .filter((a) => a.instructor)
      .map((a) => ({
        name:   a.instructor?.name  || "Unknown",
        email:  a.instructor?.email || "",
        module: a.moduleName || null,
        active: a.isActive,
      }));
  }, [selected]);

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="p-6 md:p-8 bg-[#f8fafc] min-h-screen font-sans text-slate-900">
      <Toaster position="top-right" />

      {/* ── Page Header ── */}
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-black tracking-tight flex items-center gap-3">
            <div className="h-9 w-9 bg-indigo-600 rounded-2xl flex items-center justify-center shadow-lg shadow-indigo-200">
              <Layers size={18} className="text-white" />
            </div>
            Edit Courses
          </h1>
          <p className="text-slate-500 font-medium mt-1 text-sm">
            Select a course from the left to edit its details, assets, and pricing.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => navigate("/admin/upload-video?type=video")}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-black text-white transition hover:bg-slate-800"
          >
            <Upload size={16} />
            Upload Video
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/upload-video?type=material")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-400"
          >
            <FileText size={16} />
            Upload Material
          </button>
          <button
            type="button"
            onClick={() => navigate("/admin/upload-video?type=assignment")}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-black text-slate-700 transition hover:border-slate-400"
          >
            <BookMarked size={16} />
            Upload Assignment
          </button>
          </div>
      </div>

      <div className="flex gap-6 h-[calc(100vh-180px)]">

        {/* ════════════════════════════════
            LEFT PANEL — Course List
        ════════════════════════════════ */}
        <div className="w-[380px] shrink-0 flex flex-col gap-4">

          {/* Search + Filter */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search courses..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-semibold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all"
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-black text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer"
            >
              <option value="all">All</option>
              <option value="approved">Approved</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          {/* Course count */}
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
            {filteredCourses.length} course{filteredCourses.length !== 1 ? "s" : ""}
          </p>

          {/* Course cards scroll list */}
          <div className="flex-1 overflow-y-auto space-y-3 pr-1">

            {isLoading && (
              <>{[1,2,3,4].map((i) => <CardSkeleton key={i} />)}</>
            )}

            {isError && !isLoading && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <AlertTriangle className="text-red-400 h-10 w-10" />
                <p className="text-slate-500 font-bold text-sm">Failed to load courses</p>
                <button
                  onClick={refetch}
                  className="px-4 py-2 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 transition-all"
                >
                  Retry
                </button>
              </div>
            )}

            {!isLoading && !isError && filteredCourses.length === 0 && (
              <div className="flex flex-col items-center gap-3 py-16 text-center">
                <BookOpen className="text-slate-200 h-12 w-12" />
                <p className="text-slate-400 font-bold text-sm">No courses found</p>
              </div>
            )}

            {!isLoading && !isError && filteredCourses.map((course) => (
              <CourseCard
                key={course._id}
                course={course}
                isSelected={selected?._id === course._id}
                onClick={() => handleSelect(course)}
              />
            ))}
          </div>
        </div>

        {/* ════════════════════════════════
            RIGHT PANEL — Edit Form
        ════════════════════════════════ */}
        <div className="flex-1 overflow-y-auto">

          {!selected ? (
            /* Empty state */
            <div className="h-full flex flex-col items-center justify-center gap-6 bg-white rounded-[32px] border border-slate-100 shadow-sm">
              <div className="h-20 w-20 bg-indigo-50 rounded-3xl flex items-center justify-center">
                <Layers size={36} className="text-indigo-300" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-black text-slate-600">Select a Course</h3>
                <p className="text-slate-400 font-medium text-sm mt-1">
                  Click any course on the left to edit its details
                </p>
              </div>
            </div>
          ) : (
            /* Edit form */
            <div className="bg-white rounded-[32px] border border-slate-100 shadow-sm overflow-hidden">

              {/* Form header */}
              <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="font-black text-xl text-slate-800 flex items-center gap-2">
                    <span>✏️</span> Edit Course
                  </h2>
                  <p className="text-xs font-bold text-slate-400 mt-0.5 truncate max-w-md">
                    {selected.title}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={selected.status} />
                  <button
                    onClick={() => { setSelected(null); }}
                    className="p-2 text-slate-300 hover:text-slate-500 hover:bg-slate-50 rounded-xl transition-all"
                    title="Close"
                  >
                    <XCircle size={20} />
                  </button>
                </div>
              </div>

              <div className="p-8 space-y-8">

                {/* ── SECTION 1: Basic Info ── */}
                <div className="space-y-5">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                    <BookOpen size={12} /> Basic Information
                  </h3>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Course Title *
                    </label>
                    <input
                      value={form.title}
                      onChange={(e) => setForm((p) => ({ ...p, title: e.target.value }))}
                      disabled={updating}
                      placeholder="e.g. Master Class: Python & Data Analytics"
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Course Subtitle
                    </label>
                    <input
                      value={form.subtitle}
                      onChange={(e) => setForm((p) => ({ ...p, subtitle: e.target.value }))}
                      disabled={updating}
                      placeholder="e.g. Master Data Visualization and Business Intelligence"
                      maxLength={240}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all disabled:opacity-50"
                    />
                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      Optional subtitle shown directly below the main course title.
                    </p>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Description *
                    </label>
                    <textarea
                      value={form.description}
                      onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                      disabled={updating}
                      rows={4}
                      placeholder="Describe the course syllabus and learning objectives..."
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all resize-none disabled:opacity-50"
                    />
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Course Tags
                    </label>
                    <textarea
                      value={form.tags}
                      onChange={(e) => setForm((p) => ({ ...p, tags: e.target.value }))}
                      disabled={updating}
                      rows={3}
                      placeholder={"Full Stack Java\nSpring Boot\nSQL\nHTML/CSS"}
                      className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all resize-none disabled:opacity-50"
                    />
                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      These tags appear on the student course page and power related course recommendations.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Level
                      </label>
                      <select
                        value={form.level}
                        onChange={(e) => setForm((p) => ({ ...p, level: e.target.value }))}
                        disabled={updating}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 appearance-none cursor-pointer disabled:opacity-50"
                      >
                        {["Beginner", "Intermediate", "Advanced", "Professional", "All Levels"].map((l) => (
                          <option key={l} value={l}>{l}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Language
                      </label>
                      <input
                        value={form.language}
                        onChange={(e) => setForm((p) => ({ ...p, language: e.target.value }))}
                        disabled={updating}
                        placeholder="English"
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* -- SECTION 1B: Public Metrics -- */}
                <div className="space-y-5">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                    <Star size={12} /> Public Metrics
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Rating
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="5"
                        step="0.1"
                        value={form.averageRating}
                        onChange={(e) => setForm((p) => ({ ...p, averageRating: Number(e.target.value) }))}
                        disabled={updating}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Verified Ratings
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.totalReviews}
                        onChange={(e) => setForm((p) => ({ ...p, totalReviews: Number(e.target.value) }))}
                        disabled={updating}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Enrolled Students
                      </label>
                      <input
                        type="number"
                        min="0"
                        step="1"
                        value={form.totalStudents}
                        onChange={(e) => setForm((p) => ({ ...p, totalStudents: Number(e.target.value) }))}
                        disabled={updating}
                        className="w-full px-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                      />
                    </div>
                  </div>
                </div>

                {/* ── SECTION 2: Pricing ── */}
                <div className="space-y-5 rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                    <FileText size={12} /> Course Detail Page Content
                  </h3>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Course Content Topics
                    </label>
                    <textarea
                      value={form.contentHighlights}
                      onChange={(e) => setForm((p) => ({ ...p, contentHighlights: e.target.value }))}
                      disabled={updating}
                      rows={5}
                      placeholder={"Azure Data Engineering\nAWS Data Engineering\nPython Programming\nSparkSQL"}
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all resize-none disabled:opacity-50"
                    />
                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      Add one topic per line. These show as the public Course Content list.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        This Course Includes
                      </label>
                      <textarea
                        value={form.materialIncludes}
                        onChange={(e) => setForm((p) => ({ ...p, materialIncludes: e.target.value }))}
                        disabled={updating}
                        rows={5}
                        placeholder={"45 HD Video Lessons\nDownloadable Resources\nCertificate of Completion"}
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all resize-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Extra Requirements
                      </label>
                      <textarea
                        value={form.requirements}
                        onChange={(e) => setForm((p) => ({ ...p, requirements: e.target.value }))}
                        disabled={updating}
                        rows={5}
                        placeholder={"Basic understanding of SQL\nA system to perform practical exercises"}
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all resize-none disabled:opacity-50"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                        Extra Learning Outcomes
                      </label>
                      <textarea
                        value={form.outcomes}
                        onChange={(e) => setForm((p) => ({ ...p, outcomes: e.target.value }))}
                        disabled={updating}
                        rows={5}
                        placeholder={"Certification preparation\nPortfolio project guidance"}
                        className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all resize-none disabled:opacity-50"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                      Audience
                    </label>
                    <textarea
                      value={form.audience}
                      onChange={(e) => setForm((p) => ({ ...p, audience: e.target.value }))}
                      disabled={updating}
                      rows={4}
                      placeholder={"Students who want a head start\nProfessionals switching domains"}
                      className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 placeholder:text-slate-300 transition-all resize-none disabled:opacity-50"
                    />
                  </div>
                </div>

                <div className="space-y-5">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                    <IndianRupee size={12} /> Pricing
                  </h3>

                  {/* Free toggle */}
                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-sm font-black text-slate-700">Free Course</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        When enabled, students get free access
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, isFree: !p.isFree }))}
                      disabled={updating}
                      className={`relative w-12 h-6 rounded-full transition-all ${form.isFree ? "bg-emerald-500" : "bg-slate-200"}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isFree ? "translate-x-6" : ""}`} />
                    </button>
                  </div>

                  {!form.isFree && (
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                          Original Price (₹)
                        </label>
                        <div className="relative">
                          <IndianRupee size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            min="0"
                            value={form.originalPrice}
                            onChange={(e) => setForm((p) => ({ ...p, originalPrice: Number(e.target.value) }))}
                            disabled={updating}
                            className="w-full pl-10 pr-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-2">
                          Discount (%)
                        </label>
                        <div className="relative">
                          <Tag size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                          <input
                            type="number"
                            min="0"
                            max="100"
                            value={form.discountPercentage}
                            onChange={(e) => setForm((p) => ({ ...p, discountPercentage: Number(e.target.value) }))}
                            disabled={updating}
                            className="w-full pl-10 pr-5 py-4 bg-slate-50 border-none rounded-2xl font-bold text-slate-700 outline-none focus:ring-4 focus:ring-indigo-500/10 disabled:opacity-50"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Final price display */}
                  <div className="flex items-center justify-between p-5 bg-indigo-50 rounded-2xl border border-indigo-100">
                    <span className="text-sm font-black text-indigo-700 uppercase tracking-wider">
                      Final Enrollment Price
                    </span>
                    <span className="text-2xl font-black text-indigo-700">
                      {form.isFree ? "FREE" : `₹${finalPrice.toLocaleString()}`}
                    </span>
                  </div>
                </div>

                {/* ── SECTION 3: Media Assets ── */}
                <div className="space-y-5">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                    <ImageIcon size={12} /> Media Assets
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                    {/* Thumbnail */}
                    <FileUploadZone
                      label="Thumbnail"
                      icon={ImageIcon}
                      accept="image/jpeg,image/png,image/webp"
                      current={selected.thumbnail}
                      preview={thumbPreview}
                      onFileChange={handleThumbnailChange}
                      type="image"
                    />

                    {/* Roadmap */}
                    <FileUploadZone
                      label="Roadmap Image"
                      icon={ImageIcon}
                      accept="image/jpeg,image/png,image/webp"
                      current={selected.roadmap}
                      preview={newRoadmap?.name}
                      onFileChange={setNewRoadmap}
                      type="image"
                    />

                    {/* Brochure */}
                    <FileUploadZone
                      label="Brochure (PDF)"
                      icon={BookMarked}
                      accept="application/pdf"
                      current={selected.brochure}
                      preview={newBrochure?.name}
                      onFileChange={setNewBrochure}
                      type="pdf"
                    />
                  </div>

                  {/* File change notice */}
                  {(newThumbnail || newRoadmap || newBrochure) && (
                    <div className="flex items-center gap-3 p-4 bg-amber-50 rounded-2xl border border-amber-100">
                      <Star size={16} className="text-amber-500 shrink-0" />
                      <p className="text-xs font-bold text-amber-700">
                        {[newThumbnail && "Thumbnail", newRoadmap && "Roadmap", newBrochure && "Brochure"]
                          .filter(Boolean).join(", ")} will be uploaded when you click Update Course.
                      </p>
                    </div>
                  )}
                </div>

                {/* ── SECTION 4: Instructors ── */}
                {selectedInstructors.length > 0 && (
                  <div className="space-y-4">
                    <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                      <Users size={12} /> Assigned Instructors
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {selectedInstructors.map((inst, idx) => (
                        <div key={idx} className="flex items-center gap-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          {/* Avatar */}
                          <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700 font-black text-base shrink-0">
                            {inst.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-extrabold text-slate-800 truncate">
                                {inst.name}
                              </p>
                              {inst.active ? (
                                <CheckCircle2 size={13} className="text-emerald-500 shrink-0" />
                              ) : (
                                <XCircle size={13} className="text-red-400 shrink-0" />
                              )}
                            </div>
                            <p className="text-[10px] text-slate-400 font-bold truncate">{inst.email}</p>
                            {inst.module && (
                              <span className="inline-block mt-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-[9px] font-black rounded-full border border-indigo-100">
                                {inst.module}
                              </span>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>

                    <p className="text-[10px] text-slate-400 font-bold italic px-1">
                      To change instructors, use the Assign Course feature on the Instructors page.
                    </p>
                  </div>
                )}

                {/* ── SECTION 5: Access Control ── */}
                <div className="space-y-4">
                  <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[3px] flex items-center gap-2">
                    <Clock size={12} /> Access Control
                  </h3>

                  <div className="flex items-center justify-between p-5 bg-slate-50 rounded-2xl">
                    <div>
                      <p className="text-sm font-black text-slate-700">Lock Course Meta-data</p>
                      <p className="text-[10px] text-slate-400 font-bold mt-0.5">
                        Prevents instructors from editing title, price, or description
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, isLocked: !p.isLocked }))}
                      disabled={updating}
                      className={`relative w-12 h-6 rounded-full transition-all ${form.isLocked ? "bg-indigo-600" : "bg-slate-200"}`}
                    >
                      <div className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${form.isLocked ? "translate-x-6" : ""}`} />
                    </button>
                  </div>
                </div>

              </div>

              {/* ── STICKY FOOTER: Update Button ── */}
              <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/50 flex items-center justify-between">
                <div className="text-xs text-slate-400 font-bold">
                  {(newThumbnail || newRoadmap || newBrochure)
                    ? `📎 ${[newThumbnail && "Thumbnail", newRoadmap && "Roadmap", newBrochure && "Brochure"].filter(Boolean).join(" + ")} attached`
                    : "No new files attached"
                  }
                </div>

                <button
                  onClick={handleUpdate}
                  disabled={updating}
                  className="flex items-center gap-3 px-8 py-4 bg-indigo-600 text-white rounded-2xl font-black text-sm uppercase tracking-wider hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {updating ? (
                    <><RefreshCw size={16} className="animate-spin" /> Updating...</>
                  ) : (
                    <><CheckCircle2 size={16} /> Update Course</>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
