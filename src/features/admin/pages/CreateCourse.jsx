import { useMemo, useState } from "react";
import {
  AlertCircle,
  BookPlus,
  Check,
  CheckCircle2,
  Copy,
  FileText,
  Image as ImageIcon,
  IndianRupee,
  Languages,
  Layers3,
  Lock,
  Map,
  Plus,
  RefreshCcw,
  Star,
  Tag,
  Trash2,
  UserCircle,
  Users,
} from "lucide-react";
import toast, { Toaster } from "react-hot-toast";
import {
  useCreateAdminCourseMutation,
  useGetInstructorsQuery,
} from "../../../core/api/endpoints/adminApi";

const MAX_ASSET_SIZE = 20 * 1024 * 1024;
const IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
const PDF_TYPES = ["application/pdf"];

const LEVEL_OPTIONS = ["Beginner", "Intermediate", "Advanced", "Professional", "All Levels"];
const LANGUAGE_OPTIONS = [
  "English",
  "Hindi",
  "Telugu",
  "Tamil",
  "Kannada",
  "Malayalam",
  "Marathi",
  "Bengali",
  "Gujarati",
  "Urdu",
];

const generateCourseId = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let result = "CRS-";
  for (let i = 0; i < 7; i += 1) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const createAssignmentRow = () => ({
  rowId:
    typeof crypto !== "undefined" && crypto.randomUUID
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`,
  moduleName: "",
  instructorId: "",
});

const INITIAL_FORM = {
  title: "",
  subtitle: "",
  description: "",
  courseId: "",
  price: "",
  discount: "",
  isFree: false,
  instructorId: "",
  isLocked: true,
  permissionType: "SINGLE",
  level: "All Levels",
  language: "English",
  tags: "",
  averageRating: "",
  totalReviews: "",
  totalStudents: "",
  contentHighlights: "",
  materialIncludes: "",
  requirements: "",
  outcomes: "",
  audience: "",
  assignments: [createAssignmentRow()],
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

const formatFileSize = (size) => {
  if (!size) return "0 KB";
  if (size >= 1024 * 1024) return `${(size / (1024 * 1024)).toFixed(1)} MB`;
  return `${Math.ceil(size / 1024)} KB`;
};

function AssetDropzone({
  label,
  title,
  hint,
  icon,
  file,
  accept,
  onFileChange,
}) {
  const DropzoneIcon = icon;

  return (
    <div className="space-y-3">
      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest px-1">
        {label}
      </label>
      <label className="flex flex-col items-center justify-center w-full h-44 bg-white border-2 border-dashed border-slate-200 rounded-3xl cursor-pointer hover:bg-slate-50 hover:border-indigo-300 transition-all group shadow-sm">
        {file ? (
          <div className="flex flex-col items-center gap-2 max-w-full px-5">
            <div className="w-11 h-11 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center">
              <Check size={22} />
            </div>
            <span className="font-bold text-slate-700 text-sm text-center truncate max-w-full">
              {file.name}
            </span>
            <span className="text-[10px] text-slate-400 font-bold uppercase">
              {formatFileSize(file.size)} - click to replace
            </span>
          </div>
        ) : (
          <div className="flex flex-col items-center">
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
              <DropzoneIcon size={24} />
            </div>
            <span className="text-xs font-black text-slate-500 uppercase">
              {title}
            </span>
            <span className="text-[10px] font-bold text-slate-300 mt-1 uppercase">
              {hint}
            </span>
          </div>
        )}
        <input
          type="file"
          className="hidden"
          accept={accept}
          onChange={(event) => onFileChange(event.target.files?.[0], event)}
        />
      </label>
    </div>
  );
}

export default function CreateCourse() {
  const [createCourse, { isLoading: isCreating }] =
    useCreateAdminCourseMutation();

  const {
    data: instructorData,
    isLoading: instructorsLoading,
    isError: instructorsError,
  } = useGetInstructorsQuery({ status: "active", limit: 100 });

  const [form, setForm] = useState({
    ...INITIAL_FORM,
    courseId: generateCourseId(),
  });
  const [thumbnail, setThumbnail] = useState(null);
  const [roadmap, setRoadmap] = useState(null);
  const [brochure, setBrochure] = useState(null);
  const [copied, setCopied] = useState(false);

  const instructors = useMemo(() => {
    const list = instructorData?.data || instructorData || [];
    if (!Array.isArray(list)) return [];
    return list.filter(
      (inst) => inst?.role === "instructor" && inst?.isInstructorActive === true
    );
  }, [instructorData]);

  const instructorById = useMemo(() => {
    return instructors.reduce((lookup, instructor) => {
      lookup[instructor._id] = instructor;
      return lookup;
    }, {});
  }, [instructors]);

  const finalPrice = useMemo(() => {
    if (form.isFree) return 0;
    const price = parseFloat(form.price) || 0;
    const discount = Math.min(Math.max(parseFloat(form.discount) || 0, 0), 100);
    return Math.max(0, price - (price * discount) / 100);
  }, [form.price, form.discount, form.isFree]);

  const savings = useMemo(() => {
    if (form.isFree) return 0;
    const price = parseFloat(form.price) || 0;
    return Math.max(0, price - finalPrice);
  }, [form.price, finalPrice, form.isFree]);

  const handleCopyId = () => {
    navigator.clipboard?.writeText(form.courseId).catch(() => {});
    setCopied(true);
    toast.success("Course ID copied");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const setPermissionType = (permissionType) => {
    setForm((prev) => ({
      ...prev,
      permissionType,
      instructorId: permissionType === "SINGLE" ? prev.instructorId : "",
      assignments:
        permissionType === "MULTIPLE" && prev.assignments.length > 0
          ? prev.assignments
          : [createAssignmentRow()],
    }));
  };

  const updateAssignment = (rowId, field, value) => {
    setForm((prev) => ({
      ...prev,
      assignments: prev.assignments.map((row) =>
        row.rowId === rowId ? { ...row, [field]: value } : row
      ),
    }));
  };

  const addAssignmentRow = () => {
    setForm((prev) => ({
      ...prev,
      assignments: [...prev.assignments, createAssignmentRow()],
    }));
  };

  const removeAssignmentRow = (rowId) => {
    setForm((prev) => ({
      ...prev,
      assignments:
        prev.assignments.length === 1
          ? [createAssignmentRow()]
          : prev.assignments.filter((row) => row.rowId !== rowId),
    }));
  };

  const resetForm = () => {
    setForm({ ...INITIAL_FORM, courseId: generateCourseId(), assignments: [createAssignmentRow()] });
    setThumbnail(null);
    setRoadmap(null);
    setBrochure(null);
  };

  const validateAsset = (file, allowedTypes, label) => {
    if (!file) return false;
    if (file.size > MAX_ASSET_SIZE) {
      toast.error(`${label} must be 20MB or smaller`);
      return false;
    }
    if (!allowedTypes.includes(file.type)) {
      toast.error(`${label} has an invalid file type`);
      return false;
    }
    return true;
  };

  const handleAssetChange = (setter, allowedTypes, label) => (file, event) => {
    if (!file) return;
    if (!validateAsset(file, allowedTypes, label)) {
      if (event?.target) event.target.value = "";
      return;
    }
    setter(file);
  };

  const validateForm = () => {
    if (!form.title.trim()) {
      toast.error("Course title is required");
      return false;
    }
    if (!form.description.trim()) {
      toast.error("Course description is required");
      return false;
    }
    if (!form.level) {
      toast.error("Please select a course level");
      return false;
    }
    if (!form.language) {
      toast.error("Please select a language");
      return false;
    }
    if (!form.isFree && (!form.price || parseFloat(form.price) <= 0)) {
      toast.error("Please set a valid price for paid courses");
      return false;
    }
    if (parseFloat(form.discount) > 100) {
      toast.error("Discount cannot exceed 100%");
      return false;
    }
    const rating = parseFloat(form.averageRating);
    if (form.averageRating !== "" && (Number.isNaN(rating) || rating < 0 || rating > 5)) {
      toast.error("Rating must be between 0 and 5");
      return false;
    }
    if (Number(form.totalReviews || 0) < 0 || Number(form.totalStudents || 0) < 0) {
      toast.error("Reviews and enrolled students cannot be negative");
      return false;
    }
    if (form.permissionType === "SINGLE" && !form.instructorId) {
      toast.error("Please select the principal faculty member");
      return false;
    }
    if (form.permissionType === "MULTIPLE") {
      const invalidRow = form.assignments.find(
        (row) => !row.moduleName.trim() || !row.instructorId
      );
      if (invalidRow) {
        toast.error("Each subject row needs a title and active instructor");
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const loadingToast = toast.loading("Creating course...");

    try {
      const formData = new FormData();
      formData.append("title", form.title.trim());
      formData.append("subtitle", form.subtitle.trim());
      formData.append("description", form.description.trim());
      formData.append("courseId", form.courseId);
      formData.append("level", form.level);
      formData.append("language", form.language);
      formData.append("price", form.isFree ? "0" : String(parseFloat(form.price) || 0));
      formData.append("discount", String(parseFloat(form.discount) || 0));
      formData.append("finalPrice", String(finalPrice));
      formData.append("isFree", String(form.isFree));
      formData.append("isLocked", String(form.isLocked));
      formData.append("permissionType", form.permissionType);
      formData.append("averageRating", String(parseFloat(form.averageRating) || 0));
      formData.append("totalReviews", String(parseInt(form.totalReviews, 10) || 0));
      formData.append("totalStudents", String(parseInt(form.totalStudents, 10) || 0));
      formData.append("tags", JSON.stringify(tagsToArray(form.tags)));
      formData.append("contentHighlights", JSON.stringify(linesToArray(form.contentHighlights)));
      formData.append("materialIncludes", JSON.stringify(linesToArray(form.materialIncludes)));
      formData.append("requirements", JSON.stringify(linesToArray(form.requirements)));
      formData.append("outcomes", JSON.stringify(linesToArray(form.outcomes)));
      formData.append("audience", JSON.stringify(linesToArray(form.audience)));

      if (form.permissionType === "SINGLE") {
        formData.append("instructorId", form.instructorId);
      } else {
        const assignments = form.assignments.map((row) => {
          const instructor = instructorById[row.instructorId];
          return {
            moduleName: row.moduleName.trim(),
            subjectName: row.moduleName.trim(),
            instructorId: row.instructorId,
            instructorEmail: instructor?.email || "",
          };
        });
        formData.append("assignments", JSON.stringify(assignments));
      }

      if (thumbnail) formData.append("thumbnail", thumbnail);
      if (roadmap) formData.append("roadmap", roadmap);
      if (brochure) formData.append("brochure", brochure);

      await createCourse(formData).unwrap();

      toast.success("Course deployed and instructor access saved", {
        id: loadingToast,
      });
      resetForm();
    } catch (err) {
      const message =
        err?.data?.message ||
        err?.message ||
        "Something went wrong. Please try again.";
      toast.error(message, { id: loadingToast });
    }
  };

  const isSubmitting = isCreating;

  return (
    <div className="max-w-5xl mx-auto p-6 md:p-10 font-sans text-slate-900 bg-[#f8fafc] min-h-screen">
      <Toaster position="top-right" toastOptions={{ duration: 4000 }} />

      <div className="mb-10">
        <h1 className="text-3xl font-black flex items-center gap-3 tracking-tight text-slate-900">
          <BookPlus className="text-indigo-600 h-9 w-9 shrink-0" />
          Create Course
        </h1>
        <p className="text-slate-500 font-medium mt-1">
          Institutional console for a course, its assets, and instructor ownership.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm">
          <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[2px] mb-4">
            Course Identifier
          </label>
          <div className="flex flex-wrap items-center gap-4">
            <div className="relative flex-1 min-w-[220px]">
              <input
                value={form.courseId}
                readOnly
                className="w-full pl-5 pr-40 py-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none text-sm"
              />
              <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1.5 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-full border border-emerald-100 font-black text-[10px] uppercase">
                <CheckCircle2 size={12} /> Available
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() =>
                  setForm((prev) => ({ ...prev, courseId: generateCourseId() }))
                }
                className="flex items-center gap-2 px-5 py-4 bg-indigo-50 text-indigo-600 rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-indigo-100 transition-all"
              >
                <RefreshCcw size={16} /> Generate
              </button>
              <button
                type="button"
                onClick={handleCopyId}
                className="flex items-center gap-2 px-6 py-4 bg-slate-900 text-white rounded-2xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all active:scale-95"
              >
                {copied ? <Check size={16} /> : <Copy size={16} />}
                Copy
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-slate-100 shadow-sm space-y-6">
              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Course Title <span className="text-red-500">*</span>
                </label>
                <input
                  name="title"
                  value={form.title}
                  onChange={handleInputChange}
                  placeholder="e.g. Data Engineer Master Program"
                  maxLength={200}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">
                  {form.title.length}/200
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Course Subtitle
                </label>
                <input
                  name="subtitle"
                  value={form.subtitle}
                  onChange={handleInputChange}
                  placeholder="e.g. Master Data Visualization and Business Intelligence"
                  maxLength={240}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-semibold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm"
                />
                <p className="text-[10px] text-slate-400 mt-1 text-right">
                  Optional - {form.subtitle.length}/240
                </p>
              </div>

              <div>
                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  Institutional Description <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleInputChange}
                  placeholder="Summarize the syllabus, outcomes, and learning path..."
                  rows={6}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all resize-none text-sm"
                />
              </div>

              <div>
                <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                  <Tag size={14} /> Course Tags
                </label>
                <textarea
                  name="tags"
                  value={form.tags}
                  onChange={handleInputChange}
                  rows={3}
                  placeholder={"Full Stack Java\nSpring Boot\nSQL\nHTML/CSS"}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-medium text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all resize-none text-sm"
                />
                <p className="mt-1 text-[10px] font-bold text-slate-400">
                  Students filter by these tags, and they also power recommended courses.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <Layers3 size={14} /> Level
                  </label>
                  <select
                    name="level"
                    value={form.level}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm"
                  >
                    {LEVEL_OPTIONS.map((level) => (
                      <option key={level} value={level}>
                        {level}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <Languages size={14} /> Language
                  </label>
                  <select
                    name="language"
                    value={form.language}
                    onChange={handleInputChange}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm"
                  >
                    {LANGUAGE_OPTIONS.map((language) => (
                      <option key={language} value={language}>
                        {language}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <Star size={14} /> Public Rating
                  </label>
                  <input
                    type="number"
                    name="averageRating"
                    value={form.averageRating}
                    onChange={handleInputChange}
                    placeholder="4.9"
                    min="0"
                    max="5"
                    step="0.1"
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <CheckCircle2 size={14} /> Verified Ratings
                  </label>
                  <input
                    type="number"
                    name="totalReviews"
                    value={form.totalReviews}
                    onChange={handleInputChange}
                    placeholder="5000"
                    min="0"
                    step="1"
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">
                    <Users size={14} /> Enrolled Students
                  </label>
                  <input
                    type="number"
                    name="totalStudents"
                    value={form.totalStudents}
                    onChange={handleInputChange}
                    placeholder="1400000"
                    min="0"
                    step="1"
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-700 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-400 outline-none transition-all text-sm"
                  />
                </div>
              </div>

              <div className="rounded-3xl border border-indigo-100 bg-indigo-50/40 p-5">
                <div className="mb-5 flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl bg-indigo-600 text-white">
                    <FileText size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-black text-slate-800">
                      Course Detail Page Content
                    </h3>
                    <p className="mt-1 text-xs font-semibold text-slate-500">
                      Add one point per line. These values are saved to the course record and shown on the public detail page.
                    </p>
                  </div>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Course Content Topics
                    </label>
                    <textarea
                      name="contentHighlights"
                      value={form.contentHighlights}
                      onChange={handleInputChange}
                      rows={5}
                      placeholder={"Azure Data Engineering\nAWS Data Engineering\nPython Programming\nSparkSQL"}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                    />
                    <p className="mt-1 text-[10px] font-bold text-slate-400">
                      Useful for MULTIPLE courses where many languages or modules need to be listed.
                    </p>
                  </div>

                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        This Course Includes
                      </label>
                      <textarea
                        name="materialIncludes"
                        value={form.materialIncludes}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder={"45 HD Video Lessons\nDownloadable Resources\nCertificate of Completion"}
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Extra Requirements
                      </label>
                      <textarea
                        name="requirements"
                        value={form.requirements}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder={"Basic understanding of SQL\nA system to perform practical exercises"}
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        Extra Learning Outcomes
                      </label>
                      <textarea
                        name="outcomes"
                        value={form.outcomes}
                        onChange={handleInputChange}
                        rows={5}
                        placeholder={"Certification preparation\nPortfolio project guidance"}
                        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                      Audience
                    </label>
                    <textarea
                      name="audience"
                      value={form.audience}
                      onChange={handleInputChange}
                      rows={4}
                      placeholder={"Students who want a head start\nProfessionals switching domains"}
                      className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-5 py-4 text-sm font-medium text-slate-700 outline-none transition-all focus:border-indigo-400 focus:ring-4 focus:ring-indigo-500/10"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-indigo-600 p-8 rounded-[40px] text-white flex flex-col justify-between shadow-2xl shadow-indigo-200 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 blur-2xl pointer-events-none" />

            <div className="relative z-10 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-black text-base uppercase tracking-tighter flex items-center gap-2">
                  <IndianRupee size={18} /> Pricing
                </h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    name="isFree"
                    checked={form.isFree}
                    onChange={handleInputChange}
                    className="hidden peer"
                  />
                  <div className="relative w-10 h-5 bg-white/20 rounded-full peer-checked:bg-emerald-400 transition-all">
                    <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-5" />
                  </div>
                  <span className="text-[10px] font-black uppercase">Free</span>
                </label>
              </div>

              <div className={`space-y-4 transition-all duration-300 ${form.isFree ? "opacity-20 grayscale pointer-events-none" : ""}`}>
                <div className="relative">
                  <IndianRupee className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50" size={16} />
                  <input
                    type="number"
                    name="price"
                    value={form.price}
                    onChange={handleInputChange}
                    placeholder="Original price"
                    min="0"
                    step="1"
                    className="w-full pl-10 pr-5 py-4 bg-white/10 border border-white/10 rounded-2xl font-bold text-white placeholder:text-white/30 outline-none focus:bg-white/20 transition-all text-sm"
                  />
                </div>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/50 font-black text-sm">
                    %
                  </span>
                  <input
                    type="number"
                    name="discount"
                    value={form.discount}
                    onChange={handleInputChange}
                    placeholder="Discount %"
                    min="0"
                    max="100"
                    step="1"
                    className="w-full pl-10 pr-5 py-4 bg-white/10 border border-white/10 rounded-2xl font-bold text-white placeholder:text-white/30 outline-none focus:bg-white/20 transition-all text-sm"
                  />
                </div>
              </div>
            </div>

            <div className="relative z-10 mt-6 pt-5 border-t border-white/10">
              <div className="flex items-end justify-between">
                <div>
                  <span className="text-[10px] font-black text-indigo-200 uppercase tracking-widest block mb-0.5">
                    Final Fee
                  </span>
                  <span className="text-4xl font-black tracking-tighter">
                    Rs {finalPrice.toLocaleString("en-IN")}
                  </span>
                </div>
                {savings > 0 && (
                  <div className="bg-white/10 rounded-2xl px-3 py-2 text-right">
                    <p className="text-[10px] text-indigo-200 uppercase font-black">
                      You save
                    </p>
                    <p className="text-lg font-black text-emerald-300">
                      Rs {savings.toLocaleString("en-IN")}
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <AssetDropzone
            label="Institutional Thumbnail"
            title="Upload Thumbnail"
            hint="JPG, PNG, WEBP - max 20MB"
            icon={ImageIcon}
            file={thumbnail}
            accept="image/jpeg,image/png,image/webp"
            onFileChange={handleAssetChange(setThumbnail, IMAGE_TYPES, "Thumbnail")}
          />
          <AssetDropzone
            label="Roadmap Image"
            title="Upload Roadmap Image"
            hint="Image from PDF - max 20MB"
            icon={Map}
            file={roadmap}
            accept="image/jpeg,image/png,image/webp"
            onFileChange={handleAssetChange(setRoadmap, IMAGE_TYPES, "Roadmap image")}
          />
          <AssetDropzone
            label="Course Brochure"
            title="Upload Brochure PDF"
            hint="PDF only - max 20MB"
            icon={FileText}
            file={brochure}
            accept="application/pdf"
            onFileChange={handleAssetChange(setBrochure, PDF_TYPES, "Brochure")}
          />
        </div>

        <div className="bg-slate-900 p-8 md:p-10 rounded-[48px] text-white space-y-8 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 pointer-events-none" />

          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <h3 className="flex items-center gap-3 font-black uppercase tracking-tighter text-xl">
                <UserCircle className="text-indigo-400 h-7 w-7 shrink-0" />
                Faculty Assignment
              </h3>
              <p className="text-slate-400 text-xs mt-1 font-medium">
                Single assigns the whole course. Multiple assigns each subject to an active instructor.
              </p>
            </div>

            <div className="flex bg-white/5 p-1.5 rounded-2xl border border-white/5 self-start md:self-auto">
              {["SINGLE", "MULTIPLE"].map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setPermissionType(type)}
                  className={`px-6 py-2.5 rounded-xl text-[10px] font-black transition-all uppercase tracking-widest ${
                    form.permissionType === type
                      ? "bg-indigo-600 text-white shadow-xl"
                      : "text-slate-500 hover:text-white"
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="md:col-span-3">
              {instructorsLoading ? (
                <div className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 text-slate-400 text-sm font-medium animate-pulse">
                  Loading active instructors...
                </div>
              ) : instructorsError ? (
                <div className="w-full bg-red-500/10 border border-red-500/20 rounded-2xl px-5 py-4 text-red-300 text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={16} />
                  Failed to load instructors. Check backend.
                </div>
              ) : instructors.length === 0 ? (
                <div className="w-full bg-amber-500/10 border border-amber-500/20 rounded-2xl px-5 py-4 text-amber-300 text-sm font-medium flex items-center gap-2">
                  <AlertCircle size={16} />
                  No active instructors found. Invite or activate instructors first.
                </div>
              ) : form.permissionType === "SINGLE" ? (
                <div className="relative group">
                  <UserCircle
                    className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-indigo-400 transition-colors"
                    size={20}
                  />
                  <select
                    name="instructorId"
                    value={form.instructorId}
                    onChange={handleInputChange}
                    className="w-full bg-white/5 border border-white/10 rounded-2xl pl-14 pr-6 py-5 font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500 appearance-none transition-all text-sm"
                  >
                    <option value="" className="text-slate-900 bg-white">
                      Select principal faculty member
                    </option>
                    {instructors.map((inst) => (
                      <option key={inst._id} value={inst._id} className="text-slate-900 bg-white">
                        {inst.name} - {inst.email}
                      </option>
                    ))}
                  </select>
                  <p className="text-[10px] text-slate-400 font-bold mt-3">
                    The selected instructor gets this course automatically after deploy.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">
                        Subject to Instructor Map
                      </p>
                      <p className="text-xs text-slate-500 mt-1">
                        {"Example: Python -> Bharath, SQL -> Karan, AWS Cloud -> Koushik."}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={addAssignmentRow}
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all"
                    >
                      <Plus size={15} /> Add Subject
                    </button>
                  </div>

                  <div className="space-y-3">
                    {form.assignments.map((row, index) => (
                      <div
                        key={row.rowId}
                        className="grid grid-cols-1 lg:grid-cols-[1fr_1.35fr_auto] gap-3 bg-white/5 border border-white/10 rounded-3xl p-3"
                      >
                        <div>
                          <label className="block text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">
                            Subject {index + 1}
                          </label>
                          <input
                            value={row.moduleName}
                            onChange={(event) =>
                              updateAssignment(row.rowId, "moduleName", event.target.value)
                            }
                            placeholder="Python / SQL / AWS Cloud"
                            className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white placeholder:text-slate-600 outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[9px] text-slate-500 font-black uppercase tracking-widest mb-2">
                            Active Instructor
                          </label>
                          <select
                            value={row.instructorId}
                            onChange={(event) =>
                              updateAssignment(row.rowId, "instructorId", event.target.value)
                            }
                            className="w-full bg-slate-950/40 border border-white/10 rounded-2xl px-4 py-3 text-sm font-bold text-white outline-none focus:ring-2 focus:ring-indigo-500"
                          >
                            <option value="" className="text-slate-900 bg-white">
                              Select instructor
                            </option>
                            {instructors.map((inst) => (
                              <option key={inst._id} value={inst._id} className="text-slate-900 bg-white">
                                {inst.name} - {inst.email}
                              </option>
                            ))}
                          </select>
                        </div>

                        <button
                          type="button"
                          onClick={() => removeAssignmentRow(row.rowId)}
                          title="Remove subject assignment"
                          className="self-end inline-flex items-center justify-center h-12 w-12 rounded-2xl bg-red-500/10 text-red-300 hover:bg-red-500 hover:text-white transition-all"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    ))}
                  </div>

                  {form.assignments.some((row) => row.moduleName || row.instructorId) && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {form.assignments.map((row) => {
                        const instructor = instructorById[row.instructorId];
                        if (!row.moduleName && !instructor) return null;
                        return (
                          <span
                            key={`summary-${row.rowId}`}
                            className="px-3 py-1.5 rounded-full bg-indigo-500/10 border border-indigo-400/20 text-indigo-200 text-[10px] font-bold"
                          >
                            {row.moduleName || "Untitled subject"} {"->"}{" "}
                            {instructor?.name || "No instructor"}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex flex-col justify-between">
              <div className="flex items-center gap-3">
                <Lock
                  className={form.isLocked ? "text-amber-400" : "text-slate-500"}
                  size={20}
                />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Security
                </span>
              </div>
              <div className="space-y-3 mt-4">
                <p className="text-[10px] text-slate-400 font-bold leading-relaxed">
                  Lock meta-data to prevent assigned faculty from modifying title,
                  price, or description.
                </p>
                <label className="flex items-center gap-3 cursor-pointer">
                  <div className="relative">
                    <input
                      type="checkbox"
                      name="isLocked"
                      checked={form.isLocked}
                      onChange={handleInputChange}
                      className="hidden peer"
                    />
                    <div className="w-12 h-6 bg-white/10 rounded-full peer-checked:bg-indigo-500 transition-all" />
                    <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full transition-all peer-checked:translate-x-6" />
                  </div>
                  <span className="text-xs font-black uppercase tracking-tighter">
                    {form.isLocked ? "Locked" : "Unlocked"}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-6 bg-indigo-600 text-white rounded-3xl font-black uppercase tracking-[6px] text-sm hover:bg-indigo-700 shadow-2xl shadow-indigo-500/20 transition-all flex items-center justify-center gap-4 disabled:opacity-60 disabled:cursor-not-allowed active:scale-[0.99]"
        >
          {isSubmitting ? (
            <>
              <RefreshCcw className="animate-spin" size={20} />
              Deploying...
            </>
          ) : (
            <>
              <BookPlus size={22} />
              Deploy Institutional Course
            </>
          )}
        </button>
      </form>
    </div>
  );
}
