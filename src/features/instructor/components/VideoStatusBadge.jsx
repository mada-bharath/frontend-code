/**
 * =========================================================
 * 🎬 VIDEO STATUS BADGE (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/instructor/components/VideoStatusBadge.jsx
 *
 * Shows a styled badge for video upload/approval status.
 * Also exports a StatusDot for inline use.
 * =========================================================
 */

import { CheckCircle, Clock, XCircle, Loader2, AlertCircle } from "lucide-react";

/* ─────────────────────────────────────────
   STATUS CONFIG
───────────────────────────────────────── */
const CONFIG = {
  approved: {
    label:  "Approved",
    color:  "text-emerald-400",
    bg:     "bg-emerald-400/10 border-emerald-400/20",
    dot:    "bg-emerald-400",
    icon:   CheckCircle,
  },
  pending: {
    label:  "Pending",
    color:  "text-amber-400",
    bg:     "bg-amber-400/10 border-amber-400/20",
    dot:    "bg-amber-400 animate-pulse",
    icon:   Clock,
  },
  processing: {
    label:  "Processing",
    color:  "text-blue-400",
    bg:     "bg-blue-400/10 border-blue-400/20",
    dot:    "bg-blue-400 animate-pulse",
    icon:   Loader2,
  },
  rejected: {
    label:  "Rejected",
    color:  "text-red-400",
    bg:     "bg-red-400/10 border-red-400/20",
    dot:    "bg-red-400",
    icon:   XCircle,
  },
  draft: {
    label:  "Draft",
    color:  "text-white/40",
    bg:     "bg-white/5 border-white/10",
    dot:    "bg-white/30",
    icon:   AlertCircle,
  },
};

const get = (status) => CONFIG[status] || CONFIG.draft;

/* ═══════════════════════════════════════
   BADGE (default export)
   Usage: <VideoStatusBadge status="approved" />
          <VideoStatusBadge status="pending" size="sm" />
═══════════════════════════════════════ */
export default function VideoStatusBadge({ status = "draft", size = "md", showIcon = true }) {
  const cfg = get(status);
  const Icon = cfg.icon;

  const sizeClass =
    size === "sm" ? "px-2 py-1 text-[10px] gap-1" :
    size === "lg" ? "px-4 py-2 text-sm gap-2"      :
    "px-2.5 py-1.5 text-xs gap-1.5";

  const iconSize = size === "sm" ? 10 : size === "lg" ? 15 : 12;

  return (
    <span className={`inline-flex items-center font-bold uppercase tracking-wider rounded-lg border transition-all ${cfg.bg} ${cfg.color} ${sizeClass}`}>
      {showIcon && (
        <Icon
          size={iconSize}
          className={status === "processing" ? "animate-spin" : ""}
        />
      )}
      {cfg.label}
    </span>
  );
}

/* ═══════════════════════════════════════
   STATUS DOT (named export)
   Usage: <StatusDot status="approved" />
═══════════════════════════════════════ */
export function StatusDot({ status = "draft", size = 8 }) {
  const cfg = get(status);
  return (
    <span
      className={`inline-block rounded-full ${cfg.dot}`}
      style={{ width: size, height: size, minWidth: size }}
    />
  );
}

/* ═══════════════════════════════════════
   STATUS TEXT (named export)
   Usage: <StatusText status="pending" />
═══════════════════════════════════════ */
export function StatusText({ status = "draft", className = "" }) {
  const cfg = get(status);
  return (
    <span className={`text-xs font-semibold ${cfg.color} ${className}`}>
      {cfg.label}
    </span>
  );
}