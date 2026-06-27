/**
 * =========================================================
 * 🪝 useUpload HOOK (FINAL PRODUCTION 🔥)
 * =========================================================
 * Path: src/features/instructor/hooks/useUpload.js
 *
 * Encapsulates the full direct-to-S3 upload flow:
 * 1. getPresignedUrl  → backend issues S3 presigned URL
 * 2. XHR PUT to S3    → with progress tracking
 * 3. confirmUpload    → backend verifies S3 + saves to DB
 *
 * Returns: { upload, cancel, reset, state }
 * state: { stage, progress, speed, uploadedUrl, error }
 *
 * Usage:
 *   const { upload, cancel, reset, state } = useUpload();
 *   await upload({ courseId, sectionId, file, title, ... });
 * =========================================================
 */

import { useRef, useState, useCallback } from "react";
import {
  useGetPresignedUrlMutation,
  useConfirmUploadMutation,
} from "../../../core/api/endpoints/uploadApi";

/* ─────────────────────────────────────────
   INITIAL STATE
───────────────────────────────────────── */
const INITIAL = {
  stage:      "idle",   // idle | uploading | confirming | done | error
  progress:   0,        // 0–100
  speed:      0,        // bytes/sec
  uploadedUrl: "",
  error:      "",
};

/* ═══════════════════════════════════════
   HOOK
═══════════════════════════════════════ */
export default function useUpload() {
  const [state, setState] = useState(INITIAL);
  const xhrRef       = useRef(null);
  const startRef     = useRef(null);
  const loadedRef    = useRef(0);

  const [getPresignedUrl] = useGetPresignedUrlMutation();
  const [confirmUpload]   = useConfirmUploadMutation();

  /* ── Patch state helper ── */
  const patch = useCallback((partial) =>
    setState((prev) => ({ ...prev, ...partial })), []);

  /* ─────────────────────────────────────
     UPLOAD
  ───────────────────────────────────── */
  const upload = useCallback(async ({
    courseId,
    sectionId,
    file,
    title,
    duration     = 0,
    isFreePreview = false,
  }) => {
    if (!file || !title?.trim() || !courseId || !sectionId) {
      patch({ stage: "error", error: "Missing required fields." });
      return { success: false };
    }

    patch({ stage: "uploading", progress: 0, speed: 0, error: "", uploadedUrl: "" });
    startRef.current  = Date.now();
    loadedRef.current = 0;

    try {
      /* STEP 1 — Presigned URL */
      const urlRes = await getPresignedUrl({
        courseId,
        sectionId,
        fileName:   file.name,
        fileType:   file.type,
        fileSize:   file.size,
        videoTitle: title.trim(),
      }).unwrap();

      const { presignedUrl, videoUrl, s3Key } = urlRes.data;

      /* STEP 2 — XHR PUT directly to S3 */
      await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhrRef.current = xhr;

        xhr.open("PUT", presignedUrl, true);
        xhr.setRequestHeader("Content-Type", file.type);

        xhr.upload.onprogress = (e) => {
          if (!e.lengthComputable) return;
          const pct     = Math.round((e.loaded / e.total) * 100);
          const elapsed = (Date.now() - startRef.current) / 1000;
          const speed   = elapsed > 0
            ? Math.round((e.loaded - loadedRef.current) / elapsed)
            : 0;
          loadedRef.current = e.loaded;
          patch({ progress: pct, speed });
        };

        xhr.onload  = () => (xhr.status === 200 ? resolve() : reject(new Error(`S3 error: ${xhr.status}`)));
        xhr.onerror = () => reject(new Error("Network error during upload"));
        xhr.onabort = () => reject(new Error("Upload cancelled"));
        xhr.send(file);
      });

      /* STEP 3 — Confirm + save to DB */
      patch({ stage: "confirming", progress: 100 });

      await confirmUpload({
        courseId,
        sectionId,
        s3Key,
        videoUrl,
        title: title.trim(),
        duration,
        isFreePreview,
      }).unwrap();

      patch({ stage: "done", uploadedUrl: videoUrl });
      return { success: true, videoUrl };

    } catch (err) {
      const msg = err?.data?.message || err?.message || "Upload failed.";
      patch({ stage: "error", error: msg });
      return { success: false, error: msg };
    }
  }, [getPresignedUrl, confirmUpload, patch]);

  /* ─────────────────────────────────────
     CANCEL
  ───────────────────────────────────── */
  const cancel = useCallback(() => {
    if (xhrRef.current) xhrRef.current.abort();
    patch({ stage: "idle", progress: 0, speed: 0 });
  }, [patch]);

  /* ─────────────────────────────────────
     RESET
  ───────────────────────────────────── */
  const reset = useCallback(() => setState(INITIAL), []);

  return { upload, cancel, reset, state };
}