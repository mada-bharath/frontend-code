import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import {
  BarChart3,
  BookOpen,
  Check,
  Clock,
  ExternalLink,
  Heart,
  Image as ImageIcon,
  Link2,
  Loader2,
  MessageCircle,
  MoreHorizontal,
  Paperclip,
  Pin,
  Plus,
  Search,
  Send,
  Share2,
  Tag,
  Users,
  X,
} from "lucide-react";
import Navbar from "../../../design-system/layouts/Navbar";
import { useAuth } from "../../../core/providers/AuthProvider";
import { useGetPaymentMyCoursesQuery } from "../../../core/api/endpoints/paymentApi";
import {
  useAddDiscussionCommentMutation,
  useCreateDiscussionMutation,
  useGetDiscussionsQuery,
  useRecordDiscussionShareMutation,
  useToggleDiscussionLikeMutation,
} from "../../../core/api/endpoints/discussionApi";
import { getMediaUrl } from "../../../utils/mediaUrl";

const TOPIC_TABS = [
  { key: "all", label: "All Topics", tag: "" },
  { key: "courses", label: "My Courses", tag: "" },
  { key: "career", label: "Career Advice", tag: "career advice" },
  { key: "project", label: "Project Help", tag: "project help" },
];

const SUGGESTED_TAGS = [
  "ui design",
  "react",
  "node.js live",
  "career advice",
  "project help",
  "deployment",
  "interview prep",
];

const emptyLink = { label: "", url: "" };

const getInitials = (name = "", email = "") => {
  const source = name || email || "BV";
  const parts = source.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
};

const getUserName = (user) =>
  user?.name || user?.email?.split("@")?.[0] || "Learner";

const formatRole = (role) => {
  if (!role) return "Community";
  return String(role)
    .replace(/_/g, " ")
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

const formatRelativeTime = (dateValue) => {
  if (!dateValue) return "Just now";
  const diff = Date.now() - new Date(dateValue).getTime();
  const minute = 60 * 1000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diff < minute) return "Just now";
  if (diff < hour) return `${Math.floor(diff / minute)}m ago`;
  if (diff < day) return `${Math.floor(diff / hour)}h ago`;
  if (diff < 7 * day) return `${Math.floor(diff / day)}d ago`;

  return new Date(dateValue).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

const getPurchasedCourses = (payload) => {
  const purchases = payload?.data || payload || [];
  return purchases
    .map((purchase) => purchase.courseId || purchase.course || purchase)
    .filter((course) => course?._id);
};

const normalizePostLinks = (post) => {
  const links = Array.isArray(post?.links) ? post.links : [];
  if (links.length) return links.filter((link) => link?.url);
  if (post?.linkUrl) {
    return [{ url: post.linkUrl, label: post.linkLabel || post.linkUrl }];
  }
  return [];
};

const getPostImages = (post) =>
  (Array.isArray(post?.attachments) ? post.attachments : []).filter((item) =>
    String(item?.type || "image").includes("image")
  );

function Avatar({ user, size = "md", tone = "blue" }) {
  const sizeClass = size === "sm" ? "h-10 w-10 text-sm" : "h-12 w-12 text-base";
  const toneClass =
    tone === "green"
      ? "bg-emerald-50 text-emerald-700"
      : tone === "purple"
      ? "bg-violet-100 text-violet-700"
      : "bg-blue-100 text-blue-700";

  if (user?.avatar) {
    return (
      <img
        src={getMediaUrl(user.avatar)}
        alt={getUserName(user)}
        className={`${sizeClass} rounded-full object-cover`}
      />
    );
  }

  return (
    <div className={`${sizeClass} ${toneClass} rounded-full flex shrink-0 items-center justify-center font-black`}>
      {getInitials(user?.name, user?.email)}
    </div>
  );
}

function TopicRing({ label, initials, active, onClick, muted }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-24 shrink-0 text-center"
    >
      <span
        className={`mx-auto flex h-20 w-20 items-center justify-center rounded-full border-2 text-lg font-black transition ${
          active
            ? "border-blue-500 bg-white text-slate-900 shadow-[0_0_0_4px_rgba(59,130,246,0.12)]"
            : muted
            ? "border-dashed border-slate-300 bg-white text-slate-400 group-hover:border-blue-300"
            : "border-indigo-400 bg-white text-slate-700 group-hover:-translate-y-0.5"
        }`}
      >
        {initials}
      </span>
      <span className={`mt-3 block text-xs font-black ${active ? "text-slate-950" : "text-slate-500"}`}>
        {label}
      </span>
    </button>
  );
}

function LiveMentors({ mentors = [] }) {
  if (!mentors.length) return null;

  return (
    <section className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
          <Users size={16} />
          Live Mentors
        </div>
        <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-black text-emerald-700">
          {mentors.length} available
        </span>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {mentors.map((mentor) => (
          <div
            key={mentor._id || mentor.email}
            className="flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/60 p-3"
          >
            <div className="flex min-w-0 items-center gap-3">
              <div className="relative">
                <Avatar user={mentor} size="sm" tone="green" />
                <span
                  className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-white ${
                    mentor.isOnline ? "bg-emerald-500" : "bg-amber-400"
                  }`}
                />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-900">{mentor.name || "Mentor"}</p>
                <p className="truncate text-xs font-semibold text-slate-400">
                  {(mentor.subjects || []).slice(0, 2).join(" / ") || "Expert Mentor"}
                </p>
              </div>
            </div>
            <a
              href={mentor.email ? `mailto:${mentor.email}` : "#"}
              className="rounded-full px-3 py-1.5 text-xs font-black text-blue-600 hover:bg-blue-50"
            >
              Chat
            </a>
          </div>
        ))}
      </div>
    </section>
  );
}

function CreateThreadModal({ open, onClose, user, courses, onSubmit, isPosting }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState([]);
  const [tagInput, setTagInput] = useState("");
  const [courseId, setCourseId] = useState("");
  const [links, setLinks] = useState([{ ...emptyLink }]);
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const imageInputRef = useRef(null);
  const previewsRef = useRef([]);

  useEffect(() => {
    if (!open) return;
    previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));
    setTitle("");
    setContent("");
    setTags([]);
    setTagInput("");
    setCourseId("");
    setLinks([{ ...emptyLink }]);
    setImages([]);
    setPreviews([]);
  }, [open]);

  useEffect(() => {
    previewsRef.current = previews;
  }, [previews]);

  useEffect(() => {
    return () => {
      previewsRef.current.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, []);

  if (!open) return null;

  const toggleTag = (tag) => {
    setTags((current) =>
      current.includes(tag)
        ? current.filter((item) => item !== tag)
        : [...current, tag].slice(0, 8)
    );
  };

  const addCustomTag = () => {
    const next = tagInput.trim().toLowerCase();
    if (!next) return;
    setTags((current) => [...new Set([...current, next])].slice(0, 8));
    setTagInput("");
  };

  const handleImageSelect = (event) => {
    const picked = Array.from(event.target.files || []);
    const valid = picked.filter((file) => file.type.startsWith("image/"));

    if (valid.length !== picked.length) {
      toast.error("Only image files are supported");
    }

    const available = Math.max(0, 4 - images.length);
    const nextFiles = valid.slice(0, available);
    const nextPreviews = nextFiles.map((file) => ({
      name: file.name,
      url: URL.createObjectURL(file),
    }));

    setImages((current) => [...current, ...nextFiles].slice(0, 4));
    setPreviews((current) => [...current, ...nextPreviews].slice(0, 4));
    event.target.value = "";
  };

  const removeImage = (index) => {
    setImages((current) => current.filter((_, itemIndex) => itemIndex !== index));
    setPreviews((current) => {
      const target = current[index];
      if (target?.url) URL.revokeObjectURL(target.url);
      return current.filter((_, itemIndex) => itemIndex !== index);
    });
  };

  const updateLink = (index, field, value) => {
    setLinks((current) =>
      current.map((link, itemIndex) =>
        itemIndex === index ? { ...link, [field]: value } : link
      )
    );
  };

  const canPost =
    title.trim() ||
    content.trim() ||
    links.some((link) => link.url.trim()) ||
    images.length > 0;

  const submit = async (event) => {
    event.preventDefault();
    if (!canPost || isPosting) return;

    const cleanLinks = links
      .map((link) => ({
        label: link.label.trim(),
        url: link.url.trim(),
      }))
      .filter((link) => link.url);

    await onSubmit({
      title: title.trim(),
      content: content.trim(),
      tags,
      courseId,
      links: cleanLinks,
      images,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6 backdrop-blur-sm">
      <form
        onSubmit={submit}
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-[28px] bg-white shadow-2xl"
      >
        <div className="flex items-center justify-between border-b border-slate-100 px-7 py-5">
          <h2 className="text-2xl font-black text-slate-950">Create New Thread</h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-950"
            aria-label="Close"
          >
            <X size={22} />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto px-7 py-6">
          <div className="flex items-center gap-3">
            <Avatar user={user} />
            <div>
              <p className="font-black text-slate-900">{getUserName(user)}</p>
              <p className="text-xs font-bold text-slate-400">Public Feed</p>
            </div>
          </div>

          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={180}
            placeholder="Add a title to your post..."
            className="w-full border-none bg-transparent text-2xl font-black text-slate-950 outline-none placeholder:text-slate-300"
          />

          <textarea
            value={content}
            onChange={(event) => setContent(event.target.value)}
            maxLength={2000}
            rows={6}
            placeholder="Start writing your thoughts here..."
            className="w-full resize-none border-none bg-transparent text-lg font-medium leading-8 text-slate-700 outline-none placeholder:text-slate-400"
          />

          <div className="grid gap-3 md:grid-cols-[1fr_220px]">
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Tag size={14} />
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {SUGGESTED_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => toggleTag(tag)}
                    className={`rounded-full px-3 py-1.5 text-xs font-black transition ${
                      tags.includes(tag)
                        ? "bg-blue-600 text-white"
                        : "bg-white text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
              <div className="mt-3 flex gap-2">
                <input
                  value={tagInput}
                  onChange={(event) => setTagInput(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      addCustomTag();
                    }
                  }}
                  placeholder="Custom tag"
                  className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400"
                />
                <button
                  type="button"
                  onClick={addCustomTag}
                  className="rounded-full bg-slate-900 px-4 text-sm font-black text-white"
                >
                  Add
                </button>
              </div>
            </div>

            <label className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
              <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <BookOpen size={14} />
                Course
              </span>
              <select
                value={courseId}
                onChange={(event) => setCourseId(event.target.value)}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 outline-none focus:border-blue-400"
              >
                <option value="">Public Feed</option>
                {courses.map((course) => (
                  <option key={course._id} value={course._id}>
                    {course.title}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                <Link2 size={14} />
                Links
              </div>
              {links.length < 5 && (
                <button
                  type="button"
                  onClick={() => setLinks((current) => [...current, { ...emptyLink }])}
                  className="text-xs font-black text-blue-600"
                >
                  Add Link
                </button>
              )}
            </div>
            <div className="space-y-2">
              {links.map((link, index) => (
                <div key={index} className="grid gap-2 md:grid-cols-[160px_1fr_auto]">
                  <input
                    value={link.label}
                    onChange={(event) => updateLink(index, "label", event.target.value)}
                    placeholder="Label"
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400"
                  />
                  <input
                    value={link.url}
                    onChange={(event) => updateLink(index, "url", event.target.value)}
                    placeholder="https://..."
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold outline-none focus:border-blue-400"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setLinks((current) =>
                        current.length === 1
                          ? [{ ...emptyLink }]
                          : current.filter((_, itemIndex) => itemIndex !== index)
                      )
                    }
                    className="rounded-xl px-3 text-slate-400 hover:bg-white hover:text-red-500"
                    aria-label="Remove link"
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {previews.length > 0 && (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              {previews.map((preview, index) => (
                <div key={preview.url} className="group relative aspect-square overflow-hidden rounded-2xl bg-slate-100">
                  <img src={preview.url} alt={preview.name} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => removeImage(index)}
                    className="absolute right-2 top-2 rounded-full bg-white/95 p-1 text-slate-700 shadow"
                    aria-label="Remove image"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col gap-3 border-t border-slate-100 bg-slate-50 px-7 py-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-2">
            <input
              ref={imageInputRef}
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageSelect}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 hover:text-blue-600"
              aria-label="Add images"
            >
              <ImageIcon size={19} />
            </button>
            <button
              type="button"
              onClick={() => setLinks((current) => (current.length ? current : [{ ...emptyLink }]))}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 hover:text-blue-600"
              aria-label="Add link"
            >
              <Link2 size={19} />
            </button>
            <button
              type="button"
              onClick={() => toggleTag("poll")}
              className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-slate-500 hover:text-blue-600"
              aria-label="Add poll tag"
            >
              <BarChart3 size={19} />
            </button>
          </div>

          <button
            type="submit"
            disabled={!canPost || isPosting}
            className="inline-flex items-center justify-center gap-2 rounded-2xl bg-blue-600 px-8 py-3.5 text-base font-black text-white shadow-lg shadow-blue-200 transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-slate-300 disabled:shadow-none"
          >
            {isPosting ? <Loader2 size={19} className="animate-spin" /> : <Send size={19} />}
            Post Content
          </button>
        </div>
      </form>
    </div>
  );
}

function PostCard({ post, onLike, onShare, onComment, liking, sharing, commenting }) {
  const [replyOpen, setReplyOpen] = useState(false);
  const [reply, setReply] = useState("");
  const author = post.author || {};
  const links = normalizePostLinks(post);
  const images = getPostImages(post);
  const comments = Array.isArray(post.comments) ? post.comments : [];

  const submitReply = async (event) => {
    event.preventDefault();
    if (!reply.trim()) return;
    await onComment(post._id, reply.trim());
    setReply("");
    setReplyOpen(true);
  };

  return (
    <article className="rounded-[22px] border border-slate-200 bg-white p-5 shadow-sm transition hover:border-blue-200 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <Avatar user={author} tone="purple" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-black text-slate-950">{author.name || "Community Member"}</h3>
              {post.isPinned && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[11px] font-black text-amber-700">
                  <Pin size={11} />
                  Pinned
                </span>
              )}
            </div>
            <p className="text-xs font-black uppercase tracking-wide text-slate-400">
              {formatRole(author.role)} • {formatRelativeTime(post.createdAt)}
            </p>
          </div>
        </div>
        <button
          type="button"
          className="rounded-full p-2 text-slate-300 hover:bg-slate-50 hover:text-slate-600"
          aria-label="Thread menu"
        >
          <MoreHorizontal size={22} />
        </button>
      </div>

      <div className="mt-5 space-y-4">
        {post.title && (
          <h2 className="text-xl font-black leading-tight text-slate-950 sm:text-2xl">
            {post.title}
          </h2>
        )}
        {post.content && (
          <p className="whitespace-pre-wrap text-[15px] font-medium leading-7 text-slate-700">
            {post.content}
          </p>
        )}

        {Array.isArray(post.tags) && post.tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="rounded-full border border-blue-100 bg-blue-50 px-3 py-1 text-xs font-black text-blue-700"
              >
                {tag}
              </span>
            ))}
          </div>
        )}

        {post.courseName && (
          <div className="inline-flex items-center gap-2 rounded-full border border-emerald-100 bg-emerald-50 px-3 py-1.5 text-xs font-black text-emerald-700">
            <BookOpen size={13} />
            {post.courseName}
          </div>
        )}

        {images.length > 0 && (
          <div className={`grid gap-2 ${images.length === 1 ? "grid-cols-1" : "grid-cols-2"}`}>
            {images.slice(0, 4).map((image, index) => (
              <a
                key={`${image.url}-${index}`}
                href={getMediaUrl(image.url)}
                target="_blank"
                rel="noreferrer"
                className="block overflow-hidden rounded-2xl border border-slate-100 bg-slate-100"
              >
                <img
                  src={getMediaUrl(image.url)}
                  alt={image.name || "Discussion image"}
                  className={`w-full object-cover ${images.length === 1 ? "max-h-[420px]" : "aspect-video"}`}
                />
              </a>
            ))}
          </div>
        )}

        {links.length > 0 && (
          <div className="grid gap-2">
            {links.map((link, index) => (
              <a
                key={`${link.url}-${index}`}
                href={link.url}
                target="_blank"
                rel="noreferrer"
                className="flex items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 hover:border-blue-200 hover:bg-blue-50"
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-black text-slate-900">
                    {link.label || link.platform || link.url}
                  </span>
                  <span className="block truncate text-xs font-semibold text-slate-400">{link.url}</span>
                </span>
                <ExternalLink size={17} className="shrink-0 text-blue-600" />
              </a>
            ))}
          </div>
        )}
      </div>

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => onLike(post._id)}
            disabled={liking}
            className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-black transition ${
              post.likedByMe
                ? "bg-rose-50 text-rose-600"
                : "bg-slate-50 text-slate-500 hover:bg-rose-50 hover:text-rose-600"
            }`}
          >
            <Heart size={16} className={post.likedByMe ? "fill-current" : ""} />
            {post.likeCount || 0}
          </button>
          <button
            type="button"
            onClick={() => setReplyOpen((current) => !current)}
            className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-black text-slate-500 hover:bg-blue-50 hover:text-blue-700"
          >
            <MessageCircle size={16} />
            {post.replyCount || comments.length || 0}
          </button>
          <button
            type="button"
            onClick={() => onShare(post)}
            disabled={sharing}
            className="inline-flex items-center gap-2 rounded-full bg-slate-50 px-3 py-2 text-sm font-black text-slate-500 hover:bg-blue-50 hover:text-blue-700"
          >
            <Share2 size={16} />
            {post.shareCount || 0}
          </button>
        </div>
        <button
          type="button"
          onClick={() => setReplyOpen((current) => !current)}
          className="rounded-full bg-blue-50 px-4 py-2 text-sm font-black text-blue-700 hover:bg-blue-100"
        >
          View Thread
        </button>
      </div>

      {replyOpen && (
        <div className="mt-4 space-y-3 rounded-2xl bg-slate-50 p-4">
          {comments.length > 0 && (
            <div className="space-y-3">
              {comments.slice(-3).map((comment) => (
                <div key={comment._id || comment.createdAt} className="flex gap-3">
                  <Avatar user={comment.author} size="sm" />
                  <div className="min-w-0 flex-1 rounded-2xl bg-white px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-black text-slate-900">
                        {comment.author?.name || "Learner"}
                      </p>
                      <p className="text-xs font-bold text-slate-400">
                        {formatRelativeTime(comment.createdAt)}
                      </p>
                    </div>
                    <p className="mt-1 whitespace-pre-wrap text-sm font-medium text-slate-600">
                      {comment.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}

          <form onSubmit={submitReply} className="flex gap-2">
            <input
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder="Write a reply..."
              className="min-w-0 flex-1 rounded-full border border-slate-200 bg-white px-4 py-3 text-sm font-semibold outline-none focus:border-blue-400"
            />
            <button
              type="submit"
              disabled={!reply.trim() || commenting}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white disabled:bg-slate-300"
              aria-label="Send reply"
            >
              {commenting ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
            </button>
          </form>
        </div>
      )}
    </article>
  );
}

export default function Discussion({ embedded = false }) {
  const { user } = useAuth();
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");

  const selectedTopic = TOPIC_TABS.find((tab) => tab.key === activeTab) || TOPIC_TABS[0];
  const discussionParams = {
    search,
    tag: selectedTopic.tag,
  };

  const {
    data: discussionsRes,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useGetDiscussionsQuery(discussionParams);
  const { data: coursesRes } = useGetPaymentMyCoursesQuery(undefined, {
    skip: user?.role === "admin",
  });
  const [createDiscussion, { isLoading: isPosting }] = useCreateDiscussionMutation();
  const [toggleLike, { isLoading: isLiking }] = useToggleDiscussionLikeMutation();
  const [recordShare, { isLoading: isSharing }] = useRecordDiscussionShareMutation();
  const [addComment, { isLoading: isCommenting }] = useAddDiscussionCommentMutation();

  const posts = discussionsRes?.data || [];
  const courses = useMemo(() => getPurchasedCourses(coursesRes), [coursesRes]);
  const liveMentors = discussionsRes?.liveMentors || [];

  const visiblePosts = useMemo(() => {
    if (activeTab !== "courses") return posts;
    return posts.filter((post) => post.course || post.courseName);
  }, [activeTab, posts]);

  const stats = useMemo(
    () => ({
      posts: posts.length,
      likes: posts.reduce((total, post) => total + (post.likeCount || 0), 0),
      replies: posts.reduce((total, post) => total + (post.replyCount || 0), 0),
    }),
    [posts]
  );

  const submitPost = async ({ title, content, tags, courseId, links, images }) => {
    const payload = new FormData();
    if (title) payload.append("title", title);
    if (content) payload.append("content", content);
    if (tags.length) payload.append("tags", JSON.stringify(tags));
    if (courseId) payload.append("courseId", courseId);
    if (links.length) payload.append("links", JSON.stringify(links));
    images.forEach((image) => payload.append("images", image));

    try {
      await createDiscussion(payload).unwrap();
      toast.success("Thread posted");
      setModalOpen(false);
    } catch (error) {
      toast.error(error?.data?.message || "Could not create thread");
    }
  };

  const handleLike = async (id) => {
    try {
      await toggleLike(id).unwrap();
    } catch (error) {
      toast.error(error?.data?.message || "Could not update like");
    }
  };

  const handleShare = async (post) => {
    const shareUrl = `${window.location.origin}/discussion?post=${post._id}`;
    try {
      await recordShare(post._id).unwrap();
      if (navigator.share) {
        await navigator.share({
          title: post.title || "Bharath Vidya Discussion",
          text: post.content || "Join this discussion",
          url: shareUrl,
        });
      } else if (navigator.clipboard) {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Thread link copied");
      } else {
        toast.success("Share counted");
      }
    } catch (error) {
      if (error?.name !== "AbortError") {
        toast.error(error?.data?.message || "Could not share thread");
      }
    }
  };

  const handleComment = async (id, body) => {
    try {
      await addComment({ id, body: { body } }).unwrap();
      toast.success("Reply added");
    } catch (error) {
      toast.error(error?.data?.message || "Could not add reply");
    }
  };

  const page = (
    <div className="min-h-screen bg-[#f6f8fc] text-slate-950">
      {!embedded && <Navbar />}

      <main className={`${embedded ? "px-2 py-2" : "px-4 pb-12 pt-20 sm:px-6 lg:px-8"}`}>
        <div className="mx-auto max-w-6xl space-y-7">
          <section className="rounded-[28px] border border-slate-200 bg-white/80 p-5 shadow-sm backdrop-blur">
            <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2">
                  <span className="rounded-md bg-blue-100 px-2.5 py-1 text-xs font-black uppercase text-blue-700">
                    Live Now
                  </span>
                  {isFetching && <Loader2 size={15} className="animate-spin text-blue-600" />}
                </div>
                <h1 className="text-4xl font-black tracking-normal text-slate-950">Student Lounge</h1>
                <p className="mt-2 text-base font-medium text-slate-500">
                  Ask questions, share progress, or just say hi!
                </p>
              </div>

              <div className="grid grid-cols-3 gap-3 sm:min-w-[360px]">
                {[
                  { label: "Threads", value: stats.posts },
                  { label: "Likes", value: stats.likes },
                  { label: "Replies", value: stats.replies },
                ].map((item) => (
                  <div key={item.label} className="rounded-2xl border border-slate-100 bg-white px-4 py-3 text-center">
                    <p className="text-xl font-black text-slate-950">{item.value}</p>
                    <p className="text-[11px] font-black uppercase tracking-widest text-slate-400">{item.label}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-7 flex gap-4 overflow-x-auto pb-2">
              <TopicRing
                label="Start Post"
                initials={<Plus size={28} />}
                muted
                onClick={() => setModalOpen(true)}
              />
              {SUGGESTED_TAGS.slice(0, 5).map((tag) => (
                <TopicRing
                  key={tag}
                  label={tag.split(" ").map((word) => word[0]?.toUpperCase() + word.slice(1)).join(" ")}
                  initials={tag
                    .split(/\s|\./)
                    .filter(Boolean)
                    .slice(0, 2)
                    .map((part) => part[0])
                    .join("")
                    .toUpperCase()}
                  active={selectedTopic.tag === tag}
                  onClick={() => {
                    const matchingTab = TOPIC_TABS.find((tab) => tab.tag === tag);
                    if (matchingTab) {
                      setActiveTab(matchingTab.key);
                    } else {
                      setSearch(tag);
                    }
                  }}
                />
              ))}
            </div>
          </section>

          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="flex w-full items-center gap-4 rounded-[20px] border border-slate-200 bg-white px-5 py-5 text-left shadow-sm hover:border-blue-200 hover:shadow-md"
          >
            <Avatar user={user} />
            <span className="min-w-0 flex-1 text-lg font-bold text-slate-400">
              What's on your mind, {getUserName(user).split(" ")[0]}?
            </span>
            <span className="hidden items-center gap-3 text-slate-400 sm:flex">
              <ImageIcon size={21} />
              <BarChart3 size={21} />
            </span>
          </button>

          <LiveMentors mentors={liveMentors} />

          <div className="flex flex-col gap-4 lg:flex-row">
            <div className="min-w-0 flex-1 space-y-5">
              <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap gap-2">
                  {TOPIC_TABS.map((tab) => (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`rounded-full border px-5 py-2.5 text-sm font-black transition ${
                        activeTab === tab.key
                          ? "border-slate-950 bg-slate-950 text-white"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-200 hover:text-blue-700"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                <label className="relative block min-w-0 md:w-80">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Search conversations..."
                    className="w-full rounded-2xl border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm font-semibold outline-none focus:border-blue-400 focus:ring-4 focus:ring-blue-100"
                  />
                </label>
              </div>

              {isLoading && (
                <div className="flex items-center justify-center rounded-[22px] border border-slate-200 bg-white py-16">
                  <Loader2 className="animate-spin text-blue-600" size={34} />
                </div>
              )}

              {isError && (
                <div className="rounded-[22px] border border-red-100 bg-white p-8 text-center">
                  <p className="font-black text-slate-900">Discussions could not load.</p>
                  <button
                    type="button"
                    onClick={refetch}
                    className="mt-4 rounded-full bg-blue-600 px-5 py-2.5 text-sm font-black text-white"
                  >
                    Retry
                  </button>
                </div>
              )}

              {!isLoading && !isError && visiblePosts.length === 0 && (
                <div className="rounded-[22px] border border-slate-200 bg-white p-10 text-center">
                  <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                    <MessageCircle size={30} />
                  </div>
                  <h2 className="text-xl font-black text-slate-950">No threads yet</h2>
                  <button
                    type="button"
                    onClick={() => setModalOpen(true)}
                    className="mt-5 rounded-full bg-blue-600 px-6 py-3 text-sm font-black text-white"
                  >
                    Start Post
                  </button>
                </div>
              )}

              <div className="space-y-5">
                {visiblePosts.map((post) => (
                  <PostCard
                    key={post._id}
                    post={post}
                    onLike={handleLike}
                    onShare={handleShare}
                    onComment={handleComment}
                    liking={isLiking}
                    sharing={isSharing}
                    commenting={isCommenting}
                  />
                ))}
              </div>
            </div>

            <aside className="space-y-5 lg:w-80">
              <section className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                  <Paperclip size={16} />
                  My Courses
                </div>
                <div className="space-y-2">
                  {courses.slice(0, 4).map((course) => (
                    <div key={course._id} className="rounded-2xl border border-slate-100 bg-slate-50 p-3">
                      <p className="text-sm font-black text-slate-900">{course.title}</p>
                      <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-slate-400">
                        <Clock size={12} />
                        Linked posts ready
                      </p>
                    </div>
                  ))}
                  {courses.length === 0 && (
                    <p className="text-sm font-semibold text-slate-400">Course links will appear here.</p>
                  )}
                </div>
              </section>

              <section className="rounded-[20px] border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-4 flex items-center gap-2 text-sm font-black uppercase tracking-widest text-slate-400">
                  <Check size={16} />
                  Top Tags
                </div>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTED_TAGS.map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setSearch(tag)}
                      className="rounded-full bg-slate-50 px-3 py-1.5 text-xs font-black text-slate-600 hover:bg-blue-50 hover:text-blue-700"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </section>
            </aside>
          </div>
        </div>
      </main>

      <CreateThreadModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        user={user}
        courses={courses}
        onSubmit={submitPost}
        isPosting={isPosting}
      />
    </div>
  );

  return page;
}
