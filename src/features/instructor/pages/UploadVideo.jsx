import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  useGetPresignedUrlMutation,
  useConfirmUploadMutation,
} from "../../../core/api/endpoints/uploadApi";
import { useGetInstructorDashboardQuery } from "../../../core/api/endpoints/instructorApi";
import { useGetAdminCourseListQuery } from "../../../core/api/endpoints/adminApi";
import { useAuth } from "../../../core/providers/AuthProvider";
import {
  AlertCircle,
  ArrowLeft,
  BookOpen,
  CheckCircle,
  ChevronDown,
  CloudUpload,
  ExternalLink,
  FileText,
  Film,
  Loader2,
  Upload,
  Video,
  X,
} from "lucide-react";

const ALLOWED_TYPES = [
  "video/mp4",
  "video/webm",
  "video/quicktime",
  "video/x-msvideo",
  "video/mpeg",
];

const ATTACHMENT_TYPES = [
  ...ALLOWED_TYPES,
  "application/pdf",
  "application/zip",
  "application/x-zip-compressed",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "text/plain",
];

const CONTENT_TYPES = {
  video: {
    label: "Video",
    titleLabel: "Video Title",
    fileLabel: "Video File",
    placeholder: "Enter video title",
    accept: "video/*",
    allowed: ALLOWED_TYPES,
    maxSize: 2 * 1024 * 1024 * 1024,
    helper: "MP4, WebM, MOV, AVI, MPEG / max 2 GB",
    Icon: Video,
  },
  material: {
    label: "Study Material",
    titleLabel: "Material Title",
    fileLabel: "Material File",
    placeholder: "Enter material title",
    accept: ".pdf,.ppt,.pptx,.doc,.docx,.xls,.xlsx,.txt,image/*",
    allowed: ATTACHMENT_TYPES.filter((type) => !type.startsWith("video/")),
    maxSize: 2 * 1024 * 1024 * 1024,
    helper: "PDF, PPT, assignment, case study, document, or image / max 2 GB",
    Icon: FileText,
  },
  project: {
    label: "Project",
    titleLabel: "Project Title",
    fileLabel: "Project File",
    placeholder: "Enter project title",
    accept: "video/*,.pdf,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,image/*",
    allowed: ATTACHMENT_TYPES,
    maxSize: 2 * 1024 * 1024 * 1024,
    helper: "PDF, document, ZIP, image, or video / max 2 GB",
    Icon: FileText,
  },
  internship: {
    label: "Virtual Internship",
    titleLabel: "Virtual Internship Title",
    fileLabel: "Virtual Internship File",
    placeholder: "Enter virtual internship title",
    accept: "video/*,.pdf,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,image/*",
    allowed: ATTACHMENT_TYPES,
    maxSize: 2 * 1024 * 1024 * 1024,
    helper: "PDF, document, ZIP, image, or video / max 2 GB",
    Icon: FileText,
  },
  interview: {
    label: "Interview",
    titleLabel: "Interview Title",
    fileLabel: "Interview File",
    placeholder: "Enter interview title",
    accept: "video/*,.pdf,.zip,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,image/*",
    allowed: ATTACHMENT_TYPES,
    maxSize: 2 * 1024 * 1024 * 1024,
    helper: "PDF, document, ZIP, image, or video / max 2 GB",
    Icon: FileText,
  },
};

const MATERIAL_CATEGORIES = [
  { value: "pdf", label: "PDF" },
  { value: "ppt", label: "PPT" },
  { value: "assignment", label: "Assignment" },
  { value: "case-study", label: "Case Study" },
  { value: "document", label: "Document" },
  { value: "other", label: "Other" },
];

const materialCategoryValues = MATERIAL_CATEGORIES.map((item) => item.value);

const formatBytes = (bytes) => {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

const formatDuration = (seconds) => {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
};

function FieldLabel({ children, required = false }) {
  return (
    <label className="mb-2 block text-xs font-black uppercase tracking-wider text-slate-500">
      {children}
      {required && <span className="text-rose-500"> *</span>}
    </label>
  );
}

function SelectField({ value, onChange, disabled, children }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-4 py-3 pr-10 text-sm font-semibold text-slate-950 outline-none transition focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
      >
        {children}
      </select>
      <ChevronDown
        size={16}
        className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
      />
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 border-t border-slate-200 py-3 first:border-t-0">
      <span className="text-sm font-semibold text-slate-500">{label}</span>
      <span className="max-w-[60%] truncate text-right text-sm font-bold text-slate-950">
        {value}
      </span>
    </div>
  );
}

export default function UploadVideo() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const queryCourseId = searchParams.get("courseId") || "";
  const querySectionId = searchParams.get("sectionId") || "";
  const queryType = searchParams.get("type") || "video";
  const queryCategory = materialCategoryValues.includes(queryType)
    ? queryType
    : searchParams.get("category") || "pdf";

  const isAdmin = user?.role === "admin";
  const dashboardPath = isAdmin ? "/admin/courses" : "/instructor/dashboard";
  const myCoursesPath = isAdmin ? "/admin/courses" : "/instructor/my-courses";

  const { data: dashData, isLoading: isInstructorCoursesLoading } =
    useGetInstructorDashboardQuery(undefined, { skip: isAdmin });
  const { data: adminCourseData, isLoading: isAdminCoursesLoading } =
    useGetAdminCourseListQuery(undefined, { skip: !isAdmin });
  const [getPresignedUrl, { isLoading: isFetchingUrl }] =
    useGetPresignedUrlMutation();
  const [confirmUpload, { isLoading: isConfirming }] =
    useConfirmUploadMutation();

  const [selectedCourseId, setSelectedCourseId] = useState("");
  const [selectedSectionId, setSelectedSectionId] = useState("");
  const [resourceType, setResourceType] = useState(
    CONTENT_TYPES[queryType] ? queryType : materialCategoryValues.includes(queryType) ? "material" : "video"
  );
  const [resourceCategory, setResourceCategory] = useState(
    materialCategoryValues.includes(queryCategory) ? queryCategory : "pdf"
  );
  const [videoTitle, setVideoTitle] = useState("");
  const [isFreePreview, setIsFreePreview] = useState(false);
  const [file, setFile] = useState(null);
  const [videoDuration, setVideoDuration] = useState(0);
  const [dragOver, setDragOver] = useState(false);
  const [stage, setStage] = useState("idle");
  const [progress, setProgress] = useState(0);
  const [uploadSpeed, setUploadSpeed] = useState(0);
  const [uploadedUrl, setUploadedUrl] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fileInputRef = useRef(null);
  const xhrRef = useRef(null);
  const startTimeRef = useRef(null);
  const loadedRef = useRef(0);

  const isCoursesLoading = isAdmin ? isAdminCoursesLoading : isInstructorCoursesLoading;
  const courses = useMemo(() => {
    if (isAdmin) {
      if (Array.isArray(adminCourseData?.data)) return adminCourseData.data;
      if (Array.isArray(adminCourseData?.courses)) return adminCourseData.courses;
      if (Array.isArray(adminCourseData)) return adminCourseData;
      return [];
    }

    return dashData?.data?.courses || [];
  }, [adminCourseData, dashData?.data?.courses, isAdmin]);
  const course = useMemo(
    () => courses.find((item) => item._id === selectedCourseId),
    [courses, selectedCourseId]
  );
  const sections = useMemo(() => course?.sections || [], [course?.sections]);
  const section = useMemo(
    () => sections.find((item) => item._id === selectedSectionId),
    [sections, selectedSectionId]
  );
  const contentConfig = CONTENT_TYPES[resourceType] || CONTENT_TYPES.video;
  const isVideoUpload = resourceType === "video";
  const isMaterialUpload = resourceType === "material";

  const isUploading = stage === "uploading";
  const isSaving = stage === "confirming" || isConfirming;
  const isDone = stage === "done";
  const isBusy = isUploading || isSaving || isFetchingUrl;
  const canUpload =
    selectedCourseId &&
    selectedSectionId &&
    videoTitle.trim() &&
    file &&
    !isBusy &&
    !isDone;

  useEffect(() => {
    if (!queryCourseId || selectedCourseId || courses.length === 0) return;
    if (courses.some((item) => item._id === queryCourseId)) {
      const timer = setTimeout(() => setSelectedCourseId(queryCourseId), 0);
      return () => clearTimeout(timer);
    }
  }, [courses, queryCourseId, selectedCourseId]);

  useEffect(() => {
    if (!querySectionId || selectedSectionId || sections.length === 0) return;
    if (sections.some((item) => item._id === querySectionId)) {
      const timer = setTimeout(() => setSelectedSectionId(querySectionId), 0);
      return () => clearTimeout(timer);
    }
  }, [querySectionId, sections, selectedSectionId]);

  const handleFile = useCallback((selectedFile) => {
    if (!selectedFile) return;

    if (!contentConfig.allowed.includes(selectedFile.type)) {
      setErrorMsg(`${contentConfig.label} file type is not supported.`);
      return;
    }

    if (selectedFile.size > contentConfig.maxSize) {
      setErrorMsg("File is too large. Maximum size is 2 GB.");
      return;
    }

    setErrorMsg("");
    setFile(selectedFile);
    setStage("idle");
    setProgress(0);
    setUploadedUrl("");

    if (!selectedFile.type.startsWith("video/")) {
      setVideoDuration(0);
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    const video = document.createElement("video");
    video.preload = "metadata";
    video.onloadedmetadata = () => {
      setVideoDuration(Math.round(video.duration));
      URL.revokeObjectURL(url);
    };
    video.src = url;
  }, [contentConfig]);

  const handleDrop = useCallback(
    (event) => {
      event.preventDefault();
      setDragOver(false);
      handleFile(event.dataTransfer.files[0]);
    },
    [handleFile]
  );

  const handleUpload = async () => {
    if (!canUpload) return;

    setErrorMsg("");
    setStage("uploading");
    setProgress(0);

    try {
      const urlRes = await getPresignedUrl({
        courseId: selectedCourseId,
        sectionId: selectedSectionId,
        resourceType,
        resourceCategory: isMaterialUpload ? resourceCategory : undefined,
        resourceTitle: videoTitle.trim(),
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        videoTitle: videoTitle.trim(),
      }).unwrap();

      const { presignedUrl, videoUrl, fileUrl, s3Key } = urlRes.data;
      const uploadedFileUrl = fileUrl || videoUrl;

      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;
        startTimeRef.current = Date.now();
        loadedRef.current = 0;

        xhr.open("PUT", presignedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (event) => {
          if (!event.lengthComputable) return;
          const nextProgress = Math.round((event.loaded / event.total) * 100);
          const elapsed = (Date.now() - startTimeRef.current) / 1000;
          const speed = elapsed > 0 ? event.loaded / elapsed : 0;
          loadedRef.current = event.loaded;
          setProgress(nextProgress);
          setUploadSpeed(speed);
        };

        xhr.onload = () =>
          xhr.status === 200 || xhr.status === 204
            ? resolve()
            : reject(new Error(`S3 error: ${xhr.status}`));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));
        xhr.send(file);
      });

      setStage("confirming");

      await confirmUpload({
        courseId: selectedCourseId,
        sectionId: selectedSectionId,
        resourceType,
        s3Key,
        videoUrl: uploadedFileUrl,
        fileUrl: uploadedFileUrl,
        fileName: file.name,
        fileType: file.type,
        fileSize: file.size,
        title: videoTitle.trim(),
        description: "",
        duration: videoDuration,
        isFreePreview: isVideoUpload && isFreePreview,
        resourceCategory: isMaterialUpload ? resourceCategory : undefined,
      }).unwrap();

      setUploadedUrl(uploadedFileUrl);
      setStage("done");
    } catch (error) {
      console.error("Upload error:", error);
      setErrorMsg(error?.data?.message || error?.message || "Upload failed. Please try again.");
      setStage("error");
    }
  };

  const handleCancel = () => {
    if (xhrRef.current) xhrRef.current.abort();
    setStage("idle");
    setProgress(0);
  };

  const handleReset = () => {
    setFile(null);
    setVideoTitle("");
    setVideoDuration(0);
    setProgress(0);
    setUploadedUrl("");
    setErrorMsg("");
    setStage("idle");
    setIsFreePreview(false);
  };

  const handleResourceTypeChange = (nextType) => {
    if (isBusy || nextType === resourceType) return;
    setResourceType(nextType);
    if (nextType === "material") setResourceCategory("pdf");
    handleReset();
  };

  if (isCoursesLoading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-slate-50">
        <Loader2 size={32} className="animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50 text-slate-950">
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-7 md:px-6">
          <button
            onClick={() => navigate(dashboardPath)}
            className="mb-4 inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
          >
            <ArrowLeft size={15} />
            {isAdmin ? "Admin Courses" : "Dashboard"}
          </button>
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tight text-slate-950">
                Upload Course Content
              </h1>
              <p className="mt-2 text-sm text-slate-500">
                Add videos, study materials, projects, virtual internships, and interviews to assigned sections.
              </p>
            </div>
            <button
              onClick={() => navigate(myCoursesPath)}
              className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-3 text-sm font-bold text-slate-700 transition hover:bg-slate-50"
            >
              <BookOpen size={16} />
              {isAdmin ? "Manage Courses" : "My Courses"}
            </button>
          </div>
        </div>
      </section>

      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-7 md:px-6 lg:grid-cols-[minmax(0,1fr)_380px]">
        <div className="space-y-5">
          <div className="grid gap-3 sm:grid-cols-5">
            {Object.entries(CONTENT_TYPES).map(([key, item]) => {
              const active = resourceType === key;
              const Icon = item.Icon;

              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => handleResourceTypeChange(key)}
                  disabled={isBusy}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-4 py-3 text-sm font-black transition ${
                    active
                      ? "border-slate-950 bg-slate-950 text-white"
                      : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"
                  } disabled:cursor-not-allowed disabled:opacity-60`}
                >
                  <Icon size={16} />
                  {item.label}
                </button>
              );
            })}
          </div>

          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <FieldLabel required>Course</FieldLabel>
              <SelectField
                value={selectedCourseId}
                onChange={(event) => {
                  setSelectedCourseId(event.target.value);
                  setSelectedSectionId("");
                }}
                disabled={isBusy}
              >
                <option value="">Select a course</option>
                {courses.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.title}
                  </option>
                ))}
              </SelectField>
            </div>

            <div>
              <FieldLabel required>Section</FieldLabel>
              <SelectField
                value={selectedSectionId}
                onChange={(event) => setSelectedSectionId(event.target.value)}
                disabled={!selectedCourseId || isBusy}
              >
                <option value="">
                  {selectedCourseId ? "Select a section" : "Select course first"}
                </option>
                {sections.map((item) => (
                  <option key={item._id} value={item._id}>
                    {item.title}
                  </option>
                ))}
              </SelectField>
              {selectedCourseId && sections.length === 0 && (
                <p className="mt-2 flex items-center gap-1.5 text-sm font-semibold text-amber-700">
                  <AlertCircle size={14} />
                  No sections available.
                </p>
              )}
            </div>
          </div>

          <div>
            <FieldLabel required>{contentConfig.titleLabel}</FieldLabel>
            <input
              type="text"
              value={videoTitle}
              onChange={(event) => setVideoTitle(event.target.value)}
              disabled={isBusy}
              placeholder={contentConfig.placeholder}
              maxLength={150}
              className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-50 disabled:cursor-not-allowed disabled:bg-slate-100 disabled:text-slate-400"
            />
            <div className="mt-1 flex justify-end">
              <span className="text-xs font-semibold text-slate-400">
                {videoTitle.length}/150
              </span>
            </div>
          </div>

          {isMaterialUpload && (
            <div>
              <FieldLabel required>Material Type</FieldLabel>
              <SelectField
                value={resourceCategory}
                onChange={(event) => setResourceCategory(event.target.value)}
                disabled={isBusy}
              >
                {MATERIAL_CATEGORIES.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </SelectField>
            </div>
          )}

          {isVideoUpload && (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 bg-white px-4 py-3 shadow-sm">
              <div>
                <p className="text-sm font-black text-slate-950">Free Preview</p>
                <p className="mt-1 text-sm text-slate-500">Visible before enrollment</p>
              </div>
              <button
                type="button"
                onClick={() => setIsFreePreview((value) => !value)}
                disabled={isBusy}
                className={`relative h-7 w-12 rounded-full transition ${
                  isFreePreview ? "bg-slate-950" : "bg-slate-300"
                } disabled:cursor-not-allowed disabled:opacity-50`}
              >
                <span
                  className={`absolute top-1 h-5 w-5 rounded-full bg-white shadow transition ${
                    isFreePreview ? "left-6" : "left-1"
                  }`}
                />
              </button>
            </div>
          )}

          <div>
            <FieldLabel required>{contentConfig.fileLabel}</FieldLabel>
            <div
              onDragOver={(event) => {
                event.preventDefault();
                setDragOver(true);
              }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              onClick={() => !isBusy && fileInputRef.current?.click()}
              className={`cursor-pointer rounded-lg border-2 border-dashed bg-white p-8 text-center transition ${
                dragOver
                  ? "border-indigo-300 bg-indigo-50"
                  : file
                  ? "border-emerald-300 bg-emerald-50"
                  : "border-slate-300 hover:border-slate-400"
              } ${isBusy ? "pointer-events-none opacity-60" : ""}`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept={contentConfig.accept}
                onChange={(event) => handleFile(event.target.files[0])}
                className="hidden"
              />

              {file ? (
                <div className="flex items-center gap-4 text-left">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                    <Film size={22} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-slate-950">{file.name}</p>
                    <p className="mt-1 text-sm font-semibold text-slate-500">
                      {formatBytes(file.size)}
                      {videoDuration > 0 ? ` / ${formatDuration(videoDuration)}` : ""}
                    </p>
                  </div>
                  {!isBusy && (
                    <button
                      onClick={(event) => {
                        event.stopPropagation();
                        setFile(null);
                        setStage("idle");
                      }}
                      className="rounded-md border border-slate-200 bg-white p-2 text-slate-500 transition hover:bg-slate-50"
                    >
                      <X size={16} />
                    </button>
                  )}
                </div>
              ) : (
                <div>
                  <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-lg bg-slate-100 text-slate-500">
                    <CloudUpload size={26} />
                  </span>
                  <p className="mt-4 text-sm font-black text-slate-950">
                    {dragOver ? `Drop the ${contentConfig.label.toLowerCase()} here` : `Drag ${contentConfig.label.toLowerCase()} here or browse`}
                  </p>
                  <p className="mt-1 text-sm text-slate-500">
                    {contentConfig.helper}
                  </p>
                </div>
              )}
            </div>
          </div>

          {errorMsg && (
            <div className="flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 px-4 py-3">
              <AlertCircle size={18} className="mt-0.5 shrink-0 text-rose-600" />
              <p className="text-sm font-semibold text-rose-700">{errorMsg}</p>
            </div>
          )}

          {stage !== "done" && (
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                onClick={handleUpload}
                disabled={!canUpload}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-md px-4 py-3 text-sm font-black transition ${
                  canUpload
                    ? "bg-slate-950 text-white hover:bg-slate-800"
                    : "cursor-not-allowed bg-slate-200 text-slate-400"
                }`}
              >
                {isBusy ? (
                  <>
                    <Loader2 size={17} className="animate-spin" />
                    {isSaving ? "Saving" : `Uploading ${progress}%`}
                  </>
                ) : (
                  <>
                    <Upload size={17} />
                    Upload {contentConfig.label}
                  </>
                )}
              </button>

              {isUploading && (
                <button
                  onClick={handleCancel}
                  className="rounded-md border border-rose-200 bg-rose-50 px-5 py-3 text-sm font-black text-rose-700 transition hover:bg-rose-100"
                >
                  Cancel
                </button>
              )}
            </div>
          )}
        </div>

        <aside className="space-y-5">
          <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700">
                <Video size={19} />
              </span>
              <div>
                <p className="text-sm font-black text-slate-950">Upload Summary</p>
                <p className="text-sm text-slate-500">
                  {stage === "done" ? "Completed" : isBusy ? "In progress" : "Ready"}
                </p>
              </div>
            </div>

            <div className="mt-5">
              <SummaryRow label="Type" value={contentConfig.label} />
              {isMaterialUpload && (
                <SummaryRow
                  label="Material Type"
                  value={
                    MATERIAL_CATEGORIES.find((item) => item.value === resourceCategory)?.label ||
                    "PDF"
                  }
                />
              )}
              <SummaryRow label="Course" value={course?.title || "Not selected"} />
              <SummaryRow label="Section" value={section?.title || "Not selected"} />
              <SummaryRow
                label="Preview"
                value={isVideoUpload ? (isFreePreview ? "Free" : "Locked") : "Not applicable"}
              />
              <SummaryRow label="File" value={file ? formatBytes(file.size) : "Not selected"} />
            </div>
          </div>

          {(isBusy || stage === "done") && (
            <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-3 flex items-center justify-between">
                <p className="text-sm font-black text-slate-950">
                  {stage === "done" ? "Finished" : isSaving ? "Saving" : "Uploading"}
                </p>
                <p className="text-sm font-black text-indigo-700">{progress}%</p>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-slate-950 transition-all"
                  style={{ width: `${stage === "done" ? 100 : progress}%` }}
                />
              </div>
              <div className="mt-2 flex justify-between text-xs font-semibold text-slate-500">
                <span>
                  {file ? `${formatBytes((file.size * progress) / 100)} / ${formatBytes(file.size)}` : ""}
                </span>
                {uploadSpeed > 0 && stage !== "done" && <span>{formatBytes(uploadSpeed)}/s</span>}
              </div>
            </div>
          )}

          {stage === "done" && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-5 shadow-sm">
              <div className="mb-4 flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-100 text-emerald-700">
                  <CheckCircle size={20} />
                </span>
                <div>
                  <p className="text-sm font-black text-emerald-800">Upload complete</p>
                  <a
                    href={uploadedUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-emerald-700"
                  >
                    <ExternalLink size={12} />
                    Open file
                  </a>
                </div>
              </div>

              {file?.type?.startsWith("video/") ? (
                <video
                  src={uploadedUrl}
                  controls
                  className="mb-4 max-h-48 w-full rounded-lg bg-black"
                />
              ) : (
                <a
                  href={uploadedUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mb-4 flex items-center justify-center gap-2 rounded-lg border border-emerald-200 bg-white px-4 py-3 text-sm font-black text-emerald-800"
                >
                  <ExternalLink size={15} />
                  Open uploaded file
                </a>
              )}

              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  onClick={handleReset}
                  className="rounded-md border border-emerald-200 bg-white px-4 py-2.5 text-sm font-black text-emerald-800 transition hover:bg-emerald-100"
                >
                  Upload Another
                </button>
                <button
                  onClick={() => navigate(dashboardPath)}
                  className="rounded-md bg-emerald-700 px-4 py-2.5 text-sm font-black text-white transition hover:bg-emerald-800"
                >
                  {isAdmin ? "Admin Courses" : "Dashboard"}
                </button>
              </div>
            </div>
          )}

          {courses.length === 0 && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-5">
              <p className="text-sm font-semibold text-amber-800">
                No assigned courses found.
              </p>
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
