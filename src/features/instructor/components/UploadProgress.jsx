/**
 * =========================================================
 * 📊 UPLOAD PROGRESS COMPONENT (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/instructor/components/UploadProgress.jsx
 *
 * Reusable progress bar used during S3 video uploads.
 * Shows: stage label, % bar, file size, speed, step list.
 * =========================================================
 */

import { Loader2, CheckCircle, CloudUpload, Database } from "lucide-react";

/* ─────────────────────────────────────────
   FORMAT HELPERS
───────────────────────────────────────── */
const formatBytes = (bytes = 0) => {
  if (bytes === 0) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
};

/* ─────────────────────────────────────────
   STEP INDICATOR
───────────────────────────────────────── */
const STEPS = [
  { key: "url",       label: "Generating upload URL",   icon: CloudUpload },
  { key: "uploading", label: "Uploading to S3",          icon: CloudUpload },
  { key: "saving",    label: "Saving to database",       icon: Database    },
];

const getStepState = (stepKey, stage, progress) => {
  if (stepKey === "url")       return progress > 0 ? "done" : stage === "uploading" ? "active" : "idle";
  if (stepKey === "uploading") return stage === "done" ? "done" : stage === "uploading" && progress > 0 ? "active" : "idle";
  if (stepKey === "saving")    return stage === "done" ? "done" : stage === "confirming" ? "active" : "idle";
  return "idle";
};

/* ═══════════════════════════════════════
   MAIN COMPONENT
═══════════════════════════════════════ */
export default function UploadProgress({
  stage    = "idle",     // "uploading" | "confirming" | "done" | "error"
  progress = 0,          // 0–100
  fileSize = 0,          // bytes
  speed    = 0,          // bytes/s
  fileName = "",
  className = "",
}) {
  if (stage === "idle") return null;

  const loaded = fileSize * (progress / 100);

  const stageLabel =
    stage === "uploading"  ? `Uploading... ${progress}%` :
    stage === "confirming" ? "Saving to database..."     :
    stage === "done"       ? "Upload complete!"          :
    stage === "error"      ? "Upload failed"             : "";

  const barColor =
    stage === "done"  ? "from-emerald-500 to-emerald-400" :
    stage === "error" ? "from-red-500 to-red-400"          :
    "from-violet-500 to-indigo-500";

  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 ${className}`}>

      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {(stage === "uploading" || stage === "confirming") && (
            <Loader2 size={15} className="text-violet-400 animate-spin" />
          )}
          {stage === "done" && <CheckCircle size={15} className="text-emerald-400" />}
          <span className="text-xs font-semibold text-white/70">{stageLabel}</span>
        </div>
        <span className={`text-sm font-black ${
          stage === "done" ? "text-emerald-400" : "text-violet-400"
        }`}>
          {progress}%
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full bg-gradient-to-r ${barColor} rounded-full transition-all duration-300`}
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* File info */}
      {fileSize > 0 && (
        <div className="flex justify-between text-xs text-white/30 mb-4">
          <span>
            {fileName
              ? <span className="truncate max-w-[180px] inline-block align-bottom">{fileName}</span>
              : `${formatBytes(loaded)} / ${formatBytes(fileSize)}`
            }
          </span>
          {speed > 0 && stage === "uploading" && (
            <span>{formatBytes(speed)}/s</span>
          )}
        </div>
      )}

      {/* Step indicators */}
      <div className="space-y-2.5">
        {STEPS.map(({ key, label, icon: Icon }) => {
          const state = getStepState(key, stage, progress);
          return (
            <div key={key} className="flex items-center gap-3">
              <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 transition-all ${
                state === "done"   ? "bg-emerald-500" :
                state === "active" ? "bg-violet-500 animate-pulse" :
                "bg-white/10"
              }`}>
                {state === "done"
                  ? <CheckCircle size={11} className="text-white" />
                  : state === "active"
                  ? <Loader2 size={11} className="text-white animate-spin" />
                  : <Icon size={11} className="text-white/30" />
                }
              </div>
              <span className={`text-xs transition-colors ${
                state === "done"   ? "text-emerald-400" :
                state === "active" ? "text-white/80"    :
                "text-white/30"
              }`}>
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}