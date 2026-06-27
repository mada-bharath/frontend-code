/**
 * =========================================================
 * 🚀 ADMIN → CREATE COURSE (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/admin/pages/CreateCourse.jsx
 *
 * REQUIREMENT CHECKLIST:
 * ✅ Level field  (Beginner / Intermediate / Advanced / All Levels)
 * ✅ Language field (English / Hindi / Telugu / Tamil / Kannada / Other)
 * ✅ Thumbnail    — image only, max 20MB
 * ✅ Roadmap      — PDF only, max 20MB
 * ✅ Brochure     — PDF only, max 20MB
 * ✅ SINGLE course — one instructor selected → auto-assigned on create
 * ✅ MULTIPLE course — admin adds subjects one by one:
 *      subject name + instructor email
 *      e.g. Python → bharath@mail.com
 *           SQL    → karan@mail.com
 *           AWS    → koushik@mail.com
 * ✅ Final price live calculation
 * ✅ Course ID auto-generator
 * ✅ Full form reset after success
 * =========================================================
 */

import React, { useState, useEffect, useMemo } from "react";
import {
  BookPlus, Copy, RefreshCcw, CheckCircle2, Image as ImageIcon,
  Map, IndianRupee, UserCircle, Lock, Check, AlertCircle,
  Plus, Trash2, FileText, Globe, BarChart2, Users,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  useGetInstructorsQuery,
  useAssignCourseMutation,
} from "../../../core/api/endpoints/adminApi";
import { useCreateCourseMutation } from "../../../core/api/endpoints/courseApi";

/* ─────────────────────────────────────────
   CONSTANTS
───────────────────────────────────────── */
const LEVELS = ["Beginner", "Intermediate", "Advanced", "Professional", "All Levels"];

const LANGUAGES = [
  "English", "Hindi", "Telugu", "Tamil", "Kannada",
  "Malayalam", "Marathi", "Bengali", "Other",
];

const MAX_SIZE_MB  = 20;
const MAX_SIZE_BYTES = MAX_SIZE_MB * 1024 * 1024;

const generateCourseId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let id = "CRS-";
  for (let i = 0; i < 7; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
};

/* ─────────────────────────────────────────
   FILE UPLOAD ZONE (reusable)
───────────────────────────────────────── */
const UploadZone = ({ label, accept, maxMB = 20, file, onChange, hint }) => {
  const handleChange = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    if (f.size > maxMB * 1024 * 1024) {
      toast.error(`${label} must be under ${maxMB}MB`);
      e.target.value = "";
      return;
    }
    onChange(f);
  };

  return (
    <div className="space-y-2">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest">
        {label}
      </label>
      <label className="flex flex-col items-center justify-center w-full h-36 bg-white border-2 border-dashed border-slate-200 rounded-2xl cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all group shadow-sm">
        {file ? (
          <div className="flex flex-col items-center gap-2 px-4">
            <div className="w-10 h-10 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Check size={20} />
            </div>
            <span className="font-bold text-slate-700 text-sm text-center truncate max-w-full">
              {file.name}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {(file.size / 1024 / 1024).toFixed(1)} MB
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
              {accept.includes("pdf") ? <FileText size={20} /> : <ImageIcon size={20} />}
            </div>
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {hint || `Upload ${label}`}
            </span>
            <span className="text-[10px] font-bold text-slate-300 uppercase">
              max {maxMB}MB
            </span>
          </div>
        )}
        <input type="file" className="hidden" accept={accept} onChange={handleChange} />
      </label>
    </div>
  );
};

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function CreateCourse() {
  /* ── RTK Query ── */
  const [createCourse, { isLoading: isCreating }] = useCreateCourseMutation();
  const [assignCourse, { isLoading: isAssigning }] = useAssignCourseMutation();
  const { data: instructorData, isLoading: loadingInstructors } = useGetInstructorsQuery();

  /* ── Active instructors list ── */
  const instructors = useMemo(() => {
    const list = instructorData?.data || instructorData || [];
    if (!Array.isArray(list)) return [];
    return list.filter((i) => i?.role === "instructor" && i?.isInstructorActive === true);
  }, [instructorData]);

  /* ── Form state ── */
  const [form, setForm] = useState({
    title:          "",
    description:    "",
    courseId:       generateCourseId(),
    price:          "",
    discount:       "",
    isFree:         false,
    level:          "All Levels",
    language:       "English",
    isLocked:       true,
    permissionType: "SINGLE",
    /* SINGLE mode */
    instructorId:   "",
    /* MULTIPLE mode — array of { subjectName, instructorEmail } */
    subjects:       [],
  });

  /* ── File state ── */
  const [thumbnail, setThumbnail] = useState(null);
  const [roadmap,   setRoadmap]   = useState(null);
  const [brochure,  setBrochure]  = useState(null);
  const [copied,    setCopied]    = useState(false);

  /* ── MULTIPLE mode — current subject being added ── */
  const [newSubject, setNewSubject] = useState({ subjectName: "", instructorEmail: "" });

  /* ── Live final price ── */
  const finalPrice = useMemo(() => {
    if (form.isFree) return 0;
    const p = parseFloat(form.price)    || 0;
    const d = parseFloat(form.discount) || 0;
    return Math.max(0, p - (p * Math.min(d, 100)) / 100);
  }, [form.price, form.discount, form.isFree]);

  const savings = useMemo(() => {
    const p = parseFloat(form.price) || 0;
    return Math.max(0, p - finalPrice);
  }, [form.price, finalPrice]);

  /* ── Helpers ── */
  const set = (key, val) => setForm((p) => ({ ...p, [key]: val }));

  const handleCopy = () => {
    navigator.clipboard.writeText(form.courseId).catch(() => {});
    setCopied(true);
    toast.success("Course ID copied!");
    setTimeout(() => setCopied(false), 2000);
  };

  /* ── Add a subject row (MULTIPLE mode) ── */
  const addSubject = () => {
    if (!newSubject.subjectName.trim()) {
      toast.error("Subject name is required");
      return;
    }
    if (!newSubject.instructorEmail.trim()) {
      toast.error("Instructor email is required");
      return;
    }
    if (!/\S+@\S+\.\S+/.test(newSubject.instructorEmail)) {
      toast.error("Enter a valid email");
      return;
    }
    /* Check duplicate subject */
    if (form.subjects.some((s) => s.subjectName.toLowerCase() === newSubject.subjectName.toLowerCase())) {
      toast.error("Subject already added");
      return;
    }
    set("subjects", [...form.subjects, { ...newSubject }]);
    setNewSubject({ subjectName: "", instructorEmail: "" });
  };

  const removeSubject = (idx) => {
    set("subjects", form.subjects.filter((_, i) => i !== idx));
  };

  /* ── Validation ── */
  const validate = () => {
    if (!form.title.trim())       { toast.error("Course title is required"); return false; }
    if (!form.description.trim()) { toast.error("Description is required");  return false; }
    if (!form.isFree && (!form.price || parseFloat(form.price) <= 0)) {
      toast.error("Set a valid price for paid courses");
      return false;
    }
    if (parseFloat(form.discount) > 100) {
      toast.error("Discount cannot exceed 100%");
      return false;
    }
    if (form.permissionType === "SINGLE" && !form.instructorId) {
      toast.error("Select a principal instructor for SINGLE course");
      return false;
    }
    if (form.permissionType === "MULTIPLE" && form.subjects.length === 0) {
      toast.error("Add at least one subject assignment for MULTIPLE course");
      return false;
    }
    return true;
  };

  /* ── Submit ── */
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    const t = toast.loading("Creating course...");

    try {
      /* Build FormData */
      const fd = new FormData();
      fd.append("title",          form.title.trim());
      fd.append("description",    form.description.trim());
      fd.append("courseId",       form.courseId);
      fd.append("price",          form.isFree ? "0" : String(parseFloat(form.price) || 0));
      fd.append("discount",       String(parseFloat(form.discount) || 0));
      fd.append("finalPrice",     String(finalPrice));
      fd.append("isFree",         String(form.isFree));
      fd.append("isLocked",       String(form.isLocked));
      fd.append("permissionType", form.permissionType);
      fd.append("level",          form.level);
      fd.append("language",       form.language);
      if (thumbnail) fd.append("thumbnail", thumbnail);
      if (roadmap)   fd.append("roadmap",   roadmap);
      if (brochure)  fd.append("brochure",  brochure);

      /* Step 1: Create course */
      const res     = await createCourse(fd).unwrap();
      const courseId = res?.data?._id;
      if (!courseId) throw new Error("Course created but no ID returned");

      /* Step 2: Assign instructor(s) */
      toast.loading("Assigning instructor(s)...", { id: t });

      if (form.permissionType === "SINGLE") {
        /* Auto-assign the single selected instructor */
        await assignCourse({
          instructorId: form.instructorId,
          courseId,
        }).unwrap();
      } else {
        /* MULTIPLE — assign each subject to its instructor by email */
        const results = await Promise.allSettled(
          form.subjects.map((s) =>
            assignCourse({
              courseId,
              instructorEmail: s.instructorEmail,
              moduleName:      s.subjectName,
            }).unwrap()
          )
        );
        const failed = results.filter((r) => r.status === "rejected");
        if (failed.length > 0) {
          toast.error(`${failed.length} subject assignment(s) failed — check emails`, { id: t });
        }
      }

      toast.success("🚀 Course deployed successfully!", { id: t });

      /* Reset */
      setForm({
        title: "", description: "", courseId: generateCourseId(),
        price: "", discount: "", isFree: false,
        level: "All Levels", language: "English",
        isLocked: true, permissionType: "SINGLE",
        instructorId: "", subjects: [],
      });
      setThumbnail(null);
      setRoadmap(null);
      setBrochure(null);

    } catch (err) {
      toast.error(err?.data?.message || err?.message || "Failed. Please try again.", { id: t });
    }
  };

  const isSubmitting = isCreating || isAssigning;

  /* ═══════════════════════════════════════
     RENDER
  ═══════════════════════════════════════ */
  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 font-sans text-slate-900 bg-[#f8fafc] min-h-screen">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight">
          <BookPlus className="text-indigo-600 h-9 w-9 shrink-0" />
          Create Course
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Institutional console for new curriculum deployment.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">

        {/* ══ COURSE ID ══ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">
            Course Identifier
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[200px]">
              <input
                value={form.courseId}
                readOnly
                className="w-full pl-5 pr-36 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none text-sm"
              />
              <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-black text-[10px] uppercase">
                <CheckCircle2 size={11} /> Available
              </div>
            </div>
            <div className="flex gap-2">
              <button type="button" onClick={() => set("courseId", generateCourseId())}
                className="flex items-center gap-2 px-4 py-3 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all">
                <RefreshCcw size={15} /> Generate
              </button>
              <button type="button" onClick={handleCopy}
                className="flex items-center gap-2 px-5 py-3 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95">
                {copied ? <Check size={15} /> : <Copy size={15} />} Copy
              </button>
            </div>
          </div>
        </div>

        {/* ══ TITLE + DESCRIPTION + PRICING ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

          {/* Left: title, description, level, language */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-5">

              {/* Title */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  value={form.title}
                  onChange={(e) => set("title", e.target.value)}
                  placeholder="e.g. Master Class: Data Engineering"
                  maxLength={200}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                  Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => set("description", e.target.value)}
                  placeholder="Summarize syllabus and learning outcomes..."
                  rows={5}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all resize-none text-sm"
                />
              </div>

              {/* Level + Language */}
              <div className="grid grid-cols-2 gap-4">
                {/* Level */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <BarChart2 size={11} /> Level
                  </label>
                  <div className="relative">
                    <select
                      value={form.level}
                      onChange={(e) => set("level", e.target.value)}
                      className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none appearance-none text-sm"
                    >
                      {LEVELS.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <BarChart2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>

                {/* Language */}
                <div>
                  <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-1">
                    <Globe size={11} /> Language
                  </label>
                  <div className="relative">
                    <select
                      value={form.language}
                      onChange={(e) => set("language", e.target.value)}
                      className="w-full px-4 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none appearance-none text-sm"
                    >
                      {LANGUAGES.map((l) => (
                        <option key={l} value={l}>{l}</option>
                      ))}
                    </select>
                    <Globe size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Pricing card */}
          <div className="bg-indigo-600 p-7 rounded-[40px] text-white flex flex-col justify-between shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-28 h-28 bg-white/10 rounded-full -translate-y-10 translate-x-10 blur-2xl pointer-events-none" />
            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base uppercase tracking-tighter flex items-center gap-2">
                  <IndianRupee size={16} /> Pricing
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.isFree}
                    onChange={(e) => set("isFree", e.target.checked)} className="hidden peer" />
                  <div className="relative w-10 h-5 bg-white/20 rounded-full peer-checked:bg-emerald-400 transition-all">
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase">Free</span>
                </label>
              </div>

              <div className={`space-y-4 transition-all ${form.isFree ? "opacity-20 pointer-events-none" : ""}`}>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={15} />
                  <input type="number" value={form.price} min="0"
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="Original price"
                    className="w-full pl-10 pr-5 py-3.5 bg-white/10 border border-white/10 rounded-2xl font-bold text-white placeholder:text-white/30 outline-none focus:bg-white/20 transition-all text-sm" />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-black text-sm">%</span>
                  <input type="number" value={form.discount} min="0" max="100"
                    onChange={(e) => set("discount", e.target.value)}
                    placeholder="Discount %"
                    className="w-full pl-10 pr-5 py-3.5 bg-white/10 border border-white/10 rounded-2xl font-bold text-white placeholder:text-white/30 outline-none focus:bg-white/20 transition-all text-sm" />
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-5 pt-5 border-t border-white/10">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block mb-0.5">
                    Final Fee
                  </span>
                  <span className="text-4xl font-black tracking-tighter">
                    ₹{finalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
                {savings > 0 && (
                  <div className="text-right">
                    <p className="text-[10px] text-indigo-200 uppercase font-black">Save</p>
                    <p className="text-lg font-black text-emerald-300">₹{savings.toLocaleString("en-IN")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ══ MEDIA ASSETS ══ */}
        <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
          <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
            <ImageIcon size={12} /> Media Assets
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <UploadZone
              label="Thumbnail (Image)"
              accept="image/jpeg,image/png,image/webp"
              maxMB={20}
              file={thumbnail}
              onChange={setThumbnail}
              hint="JPG, PNG, WEBP"
            />
            <UploadZone
              label="Roadmap (PDF)"
              accept="application/pdf"
              maxMB={20}
              file={roadmap}
              onChange={setRoadmap}
              hint="PDF only"
            />
            <UploadZone
              label="Brochure (PDF)"
              accept="application/pdf"
              maxMB={20}
              file={brochure}
              onChange={setBrochure}
              hint="PDF only"
            />
          </div>
        </div>

        {/* ══ FACULTY ASSIGNMENT ══ */}
        <div className="bg-slate-900 p-8 rounded-[48px] text-white space-y-7 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 pointer-events-none" />

          {/* Header + toggle */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
            <div>
              <h3 className="flex items-center gap-3 font-black uppercase tracking-tighter text-xl">
                <UserCircle className="text-indigo-400 h-7 w-7" />
                Faculty Assignment
              </h3>
              <p className="text-slate-400 text-xs mt-1">
                {form.permissionType === "SINGLE"
                  ? "One instructor teaches the entire course"
                  : "Different instructors teach different subjects within this course"}
              </p>
            </div>

            {/* SINGLE / MULTIPLE toggle */}
            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5">
              {["SINGLE", "MULTIPLE"].map((t) => (
                <button
                  key={t} type="button"
                  onClick={() => { set("permissionType", t); set("subjects", []); set("instructorId", ""); }}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    form.permissionType === t
                      ? "bg-indigo-600 text-white shadow-xl"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* ─── SINGLE MODE ─── */}
          {form.permissionType === "SINGLE" && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="md:col-span-3">
                {loadingInstructors ? (
                  <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-slate-400 text-sm animate-pulse">
                    Loading instructors...
                  </div>
                ) : instructors.length === 0 ? (
                  <div className="flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 text-amber-300 text-sm">
                    <AlertCircle size={16} />
                    No active instructors found. Invite instructors first.
                  </div>
                ) : (
                  <div className="relative">
                    <UserCircle className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500" size={20} />
                    <select
                      value={form.instructorId}
                      onChange={(e) => set("instructorId", e.target.value)}
                      className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none text-sm"
                    >
                      <option value="" className="bg-slate-900">Select Principal Instructor</option>
                      {instructors.map((i) => (
                        <option key={i._id} value={i._id} className="bg-slate-900">
                          {i.name} — {i.email}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                {form.instructorId && (
                  <p className="text-[10px] text-emerald-400 font-bold mt-2 flex items-center gap-1.5">
                    <Check size={11} />
                    This instructor will be auto-assigned when course is created
                  </p>
                )}
              </div>

              {/* Lock toggle */}
              <LockToggle isLocked={form.isLocked} onChange={(v) => set("isLocked", v)} />
            </div>
          )}

          {/* ─── MULTIPLE MODE ─── */}
          {form.permissionType === "MULTIPLE" && (
            <div className="space-y-5">

              {/* Info box */}
              <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl px-5 py-4">
                <p className="text-sm text-indigo-200 font-semibold leading-relaxed">
                  <strong>How it works:</strong> Add each subject and the instructor who teaches it.
                  Each instructor will be notified and can upload videos only for their subject.
                  Students see the full course as one unit with all instructors listed.
                </p>
              </div>

              {/* Add subject row */}
              <div className="bg-white/5 border border-white/10 rounded-2xl p-5 space-y-4">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest">
                  Add Subject → Instructor
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <input
                    type="text"
                    value={newSubject.subjectName}
                    onChange={(e) => setNewSubject({ ...newSubject, subjectName: e.target.value })}
                    placeholder="Subject name (e.g. Python, SQL, AWS)"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                  />
                  <input
                    type="email"
                    value={newSubject.instructorEmail}
                    onChange={(e) => setNewSubject({ ...newSubject, instructorEmail: e.target.value })}
                    placeholder="Instructor email"
                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl px-5 py-3.5 text-sm text-white placeholder-white/25 outline-none focus:border-indigo-500/50 focus:ring-2 focus:ring-indigo-500/10 transition-all font-medium"
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addSubject())}
                  />
                  <button
                    type="button"
                    onClick={addSubject}
                    className="flex items-center gap-2 px-6 py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-black text-sm transition-all shrink-0"
                  >
                    <Plus size={16} /> Add
                  </button>
                </div>
              </div>

              {/* Subject list */}
              {form.subjects.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">
                    {form.subjects.length} Subject{form.subjects.length !== 1 ? "s" : ""} Added
                  </p>
                  {form.subjects.map((s, idx) => (
                    <div key={idx} className="flex items-center justify-between bg-white/5 border border-white/10 rounded-2xl px-5 py-4">
                      <div className="flex items-center gap-4">
                        <div className="w-8 h-8 rounded-xl bg-indigo-600/40 flex items-center justify-center text-[10px] font-black text-indigo-300">
                          {idx + 1}
                        </div>
                        <div>
                          <p className="font-black text-white text-sm">{s.subjectName}</p>
                          <p className="text-xs text-slate-400 font-medium">{s.instructorEmail}</p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removeSubject(idx)}
                        className="p-2 text-slate-500 hover:text-red-400 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {form.subjects.length === 0 && (
                <div className="text-center py-8 text-slate-500 text-sm font-medium">
                  No subjects added yet. Use the form above to add subjects.
                </div>
              )}

              <div className="flex justify-end">
                <LockToggle isLocked={form.isLocked} onChange={(v) => set("isLocked", v)} />
              </div>
            </div>
          )}
        </div>

        {/* ══ SUBMIT ══ */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[6px] text-sm hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isSubmitting ? (
            <><RefreshCcw className="animate-spin" size={20} /> Deploying...</>
          ) : (
            <><BookPlus size={22} /> Deploy Institutional Course</>
          )}
        </button>
      </form>
    </div>
  );
}

/* ─────────────────────────────────────────
   LOCK TOGGLE (reusable sub-component)
───────────────────────────────────────── */
function LockToggle({ isLocked, onChange }) {
  return (
    <div className="bg-white/5 rounded-3xl p-5 border border-white/5 flex flex-col justify-between">
      <div className="flex items-center gap-3">
        <Lock className={isLocked ? "text-amber-400" : "text-slate-500"} size={18} />
        <span className="text-[10px] font-black uppercase tracking-widest">Security</span>
      </div>
      <div className="space-y-2 mt-3">
        <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
          Prevent instructors from editing title, price or description.
        </p>
        <label className="flex items-center gap-3 cursor-pointer">
          <div className="relative">
            <input type="checkbox" checked={isLocked}
              onChange={(e) => onChange(e.target.checked)} className="hidden peer" />
            <div className="w-11 h-6 bg-white/10 rounded-full peer-checked:bg-indigo-500 transition-all" />
            <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5" />
          </div>
          <span className="text-xs font-black uppercase tracking-tighter">
            {isLocked ? "Locked" : "Unlocked"}
          </span>
        </label>
      </div>
    </div>
  );
}
