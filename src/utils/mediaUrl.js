const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api")
  .replace(/\/api\/?$/, "")
  .replace(/\/$/, "");

export const getMediaUrl = (url, fallback = "") => {
  if (!url) return fallback;
  if (/^(https?:|data:|blob:)/i.test(url)) return url;
  const normalized = String(url).replace(/\\/g, "/");
  const uploadsIndex = normalized.lastIndexOf("/uploads/");
  if (uploadsIndex >= 0) {
    return `${API_ORIGIN}${normalized.slice(uploadsIndex)}`;
  }
  if (normalized.startsWith("uploads/")) return `${API_ORIGIN}/${normalized}`;
  return normalized;
};
