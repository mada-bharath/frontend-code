import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Download,
  Expand,
  FileText,
  ListVideo,
  Lock,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  RotateCw,
  Settings,
  UserCircle2,
  Volume2,
  VolumeX,
  ZoomIn,
  ZoomOut,
} from "lucide-react";

import { useAuth } from "../../../core/providers/AuthProvider";
import { useGetCoursePlayerQuery } from "../../../core/api/endpoints/courseApi";
import { useCheckCourseAccessQuery } from "../../../core/api/endpoints/paymentApi";
import {
  useGetCourseProgressQuery,
  useSaveProgressMutation,
} from "../../../core/api/endpoints/progressApi";
import { getMediaUrl } from "../../../utils/mediaUrl";

const HLS_CDN_URL = "https://cdn.jsdelivr.net/npm/hls.js@latest";

const isHlsUrl = (src = "") => /\.m3u8($|\?)/i.test(src);

const isPreviewVideo = (video) =>
  Boolean(video?.isPreview || video?.isFreePreview);

const getVideoSource = (video) =>
  getMediaUrl(video?.hlsUrl || video?.videoUrl || video?.fileUrl || video?.url || video?.src, "");

const normalizePlayerPayload = (payload) => payload?.data || payload || {};

const getProgressVideoId = (progress) =>
  progress?.video?._id || progress?.videoId || progress?.video;

const getProgressPercent = (progress) => {
  if (!progress) return 0;
  if (progress.completed) return 100;
  return Math.max(0, Math.min(100, Number(progress.progress) || 0));
};

const getUserCourseAccess = (user, courseId) => {
  if (!user || !courseId) return false;
  if (user.role === "admin" || user.isFreeAccess) return true;

  const courseIds = [
    ...(Array.isArray(user?.purchasedCourses) ? user.purchasedCourses : []),
    ...(Array.isArray(user?.assignedCourses) ? user.assignedCourses : []),
  ];

  return courseIds.some((item) => {
    const id =
      item?.courseId?._id ||
      item?.courseId ||
      item?.course?._id ||
      item?.course ||
      item?._id ||
      item;

    return String(id) === String(courseId);
  });
};

const formatDuration = (seconds = 0) => {
  const total = Math.max(0, Math.floor(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const mins = Math.floor((total % 3600) / 60);
  const secs = total % 60;

  if (hours > 0) {
    return `${hours}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  }

  return `${mins}:${String(secs).padStart(2, "0")}`;
};

const loadHls = () =>
  new Promise((resolve) => {
    if (window.Hls) return resolve(window.Hls);

    const script = document.createElement("script");
    script.src = HLS_CDN_URL;
    script.async = true;
    script.onload = () => resolve(window.Hls || null);
    script.onerror = () => resolve(null);
    document.body.appendChild(script);
  });

const getResourceTypeLabel = (resource) => {
  const value = String(resource?.category || resource?.type || "material")
    .replace(/-/g, " ")
    .trim();

  return value || "Material";
};

const isAssignmentResource = (resource) => {
  const value = `${resource?.category || ""} ${resource?.type || ""}`.toLowerCase();
  return value.includes("assignment");
};

const getViewerSrc = (resource, zoom) => {
  if (!resource?.fileUrl) return "";
  const separator = resource.fileUrl.includes("#") ? "&" : "#";
  return `${resource.fileUrl}${separator}zoom=${zoom}`;
};

const getInitialPanel = (search) => {
  const tab = new URLSearchParams(search).get("tab");
  return tab === "materials" || tab === "assignments" ? tab : "content";
};

function BrandMark() {
  return (
    <div className="flex items-center gap-2">
      <span className="relative h-6 w-7 shrink-0">
        <span className="absolute left-0 top-1 h-4 w-4 rotate-45 rounded-[3px] bg-[#1d4ed8]" />
        <span className="absolute left-3 top-0 h-5 w-5 rotate-45 rounded-[3px] bg-[#2563eb]" />
        <span className="absolute left-2 top-3 h-3 w-3 rotate-45 rounded-[2px] bg-[#60a5fa]" />
      </span>
      <span className="whitespace-nowrap text-[15px] font-black text-[#111827]">
        DATA VIDHYA
      </span>
    </div>
  );
}

function EmptyMediaState({ title, subtitle }) {
  return (
    <div className="flex h-full min-h-[420px] w-full flex-col items-center justify-center bg-black px-6 text-center text-white">
      <div className="grid h-16 w-16 place-items-center rounded-full border border-white/15 bg-white/10">
        <Play size={26} />
      </div>
      <h2 className="mt-5 text-xl font-black">{title}</h2>
      {subtitle && <p className="mt-2 max-w-md text-sm font-semibold text-white/60">{subtitle}</p>}
    </div>
  );
}

function ResourceIcon({ resource }) {
  const label = getResourceTypeLabel(resource).toLowerCase();
  const Icon = isAssignmentResource(resource) ? ClipboardList : FileText;
  const color = label.includes("ppt")
    ? "bg-[#f97316]/10 text-[#c2410c]"
    : isAssignmentResource(resource)
      ? "bg-[#7c3aed]/10 text-[#6d28d9]"
      : "bg-[#2563eb]/10 text-[#1d4ed8]";

  return (
    <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${color}`}>
      <Icon size={16} />
    </span>
  );
}

export default function CoursePlayer() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const videoRef = useRef(null);
  const hlsRef = useRef(null);
  const mediaShellRef = useRef(null);
  const lastSaveRef = useRef(0);

  const [selectedVideoId, setSelectedVideoId] = useState(null);
  const [selectedResourceId, setSelectedResourceId] = useState(null);
  const [activePanel, setActivePanel] = useState(() => getInitialPanel(location.search));
  const [openSections, setOpenSections] = useState({});
  const [localProgress, setLocalProgress] = useState({});
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [playbackRate, setPlaybackRate] = useState("1");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [materialZoom, setMaterialZoom] = useState(100);
  const [statusText, setStatusText] = useState("");
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  const {
    data: playerRes,
    isLoading: playerLoading,
    isError: playerError,
    refetch: refetchPlayer,
  } = useGetCoursePlayerQuery(courseId, { skip: !courseId });

  const { data: accessData } = useCheckCourseAccessQuery(courseId, {
    skip: !courseId || !user,
  });

  const { data: progressRes, refetch: refetchProgress } =
    useGetCourseProgressQuery(courseId, {
      skip: !courseId || !user,
    });

  const [saveProgress, { isLoading: isSavingProgress }] = useSaveProgressMutation();

  const playerData = useMemo(() => normalizePlayerPayload(playerRes), [playerRes]);
  const course = playerData.course || {};
  const sections = useMemo(() => {
    const rawSections = Array.isArray(playerData.sections)
      ? playerData.sections
      : Array.isArray(course.sections)
        ? course.sections
        : [];

    return rawSections
      .slice()
      .sort((left, right) => (left.order || 0) - (right.order || 0));
  }, [course.sections, playerData.sections]);

  const hasAccess = Boolean(
    playerData.hasAccess ||
      accessData?.data?.hasAccess ||
      location.state?.isPurchased ||
      getUserCourseAccess(user, courseId) ||
      course?.isFree ||
      course?.isPurchased ||
      course?.hasAccess ||
      course?.isEnrolled
  );

  const progressByVideo = useMemo(() => {
    const progressMap = {};

    if (progressRes?.progressByVideo) {
      Object.entries(progressRes.progressByVideo).forEach(([videoId, progress]) => {
        progressMap[String(videoId)] = progress;
      });
    }

    if (Array.isArray(progressRes?.data)) {
      progressRes.data.forEach((progress) => {
        const videoId = getProgressVideoId(progress);
        if (videoId) progressMap[String(videoId)] = progress;
      });
    }

    Object.entries(localProgress).forEach(([videoId, progress]) => {
      const existing = progressMap[String(videoId)];
      progressMap[String(videoId)] = {
        ...(existing || {}),
        ...progress,
        progress: Math.max(getProgressPercent(existing), getProgressPercent(progress)),
        completed: Boolean(existing?.completed || progress?.completed),
      };
    });

    return progressMap;
  }, [localProgress, progressRes]);

  const videos = useMemo(
    () =>
      sections.flatMap((section) =>
        (section.videos || [])
          .slice()
          .sort((left, right) => (left.order || 0) - (right.order || 0))
          .map((video) => ({
            ...video,
            sectionId: section._id,
            sectionTitle: section.title,
            isLocked: video.isLocked ?? (!hasAccess && !isPreviewVideo(video)),
          }))
      ),
    [hasAccess, sections]
  );

  const resources = useMemo(
    () =>
      sections.flatMap((section) =>
        (section.studyMaterials || [])
          .slice()
          .sort((left, right) => (left.order || 0) - (right.order || 0))
          .map((resource) => ({
            ...resource,
            sectionId: section._id,
            sectionTitle: section.title,
            fileUrl: getMediaUrl(resource.fileUrl || resource.url || resource.videoUrl, ""),
            isLocked: resource.isLocked ?? !hasAccess,
          }))
      ),
    [hasAccess, sections]
  );

  const studyResources = useMemo(
    () => resources.filter((resource) => !isAssignmentResource(resource)),
    [resources]
  );

  const assignmentResources = useMemo(
    () => resources.filter((resource) => isAssignmentResource(resource)),
    [resources]
  );

  const selectedVideo = useMemo(() => {
    if (!videos.length) return null;

    const selected = videos.find((video) => String(video._id) === String(selectedVideoId));
    if (selected) return selected;

    const lastVideoId = progressRes?.lastVideo;
    const lastVideo = videos.find(
      (video) => String(video._id) === String(lastVideoId) && !video.isLocked
    );
    const firstIncomplete = videos.find((video) => {
      const progress = progressByVideo[String(video._id)];
      return !video.isLocked && !progress?.completed;
    });
    const firstPlayable = videos.find((video) => !video.isLocked);

    return lastVideo || firstIncomplete || firstPlayable || videos[0];
  }, [progressByVideo, progressRes?.lastVideo, selectedVideoId, videos]);

  const selectedResource = useMemo(
    () =>
      resources.find((resource) => String(resource._id) === String(selectedResourceId)) || null,
    [resources, selectedResourceId]
  );

  const selectedIndex = selectedVideo
    ? videos.findIndex((video) => String(video._id) === String(selectedVideo._id))
    : -1;

  const selectedProgress = selectedVideo?._id
    ? progressByVideo[String(selectedVideo._id)]
    : null;
  const selectedPercent = getProgressPercent(selectedProgress);
  const completedVideoCount = videos.filter(
    (video) => progressByVideo[String(video._id)]?.completed
  ).length;
  const coursePercent = videos.length
    ? Math.round((completedVideoCount / videos.length) * 100)
    : Number(progressRes?.percentage) || 0;

  const profileImage = user?.avatar || user?.profileImage || course?.profileImage || "";
  const currentPanelResources = activePanel === "assignments" ? assignmentResources : studyResources;

  useEffect(() => {
    const videoEl = videoRef.current;
    const source = getVideoSource(selectedVideo);

    if (hlsRef.current) {
      hlsRef.current.destroy();
      hlsRef.current = null;
    }

    if (!videoEl || !selectedVideo || selectedVideo.isLocked || !source || selectedResource) {
      if (videoEl) videoEl.removeAttribute("src");
      return undefined;
    }

    let cancelled = false;

    const loadVideo = async () => {
      if (!isHlsUrl(source)) {
        videoEl.src = source;
        videoEl.load();
        return;
      }

      if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = source;
        videoEl.load();
        return;
      }

      const Hls = await loadHls();
      if (cancelled) return;

      if (!Hls?.isSupported?.()) {
        videoEl.src = source;
        videoEl.load();
        return;
      }

      const hls = new Hls({ startLevel: -1 });
      hlsRef.current = hls;
      hls.loadSource(source);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels
          .map((level, index) => ({
            index,
            label: level.height ? `${level.height}p` : `Level ${index + 1}`,
          }))
          .filter(
            (level, index, allLevels) =>
              allLevels.findIndex((item) => item.label === level.label) === index
          );

        setQualityLevels(levels);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (data.level === -1) {
          setCurrentQuality("auto");
          return;
        }

        const level = hls.levels[data.level];
        setCurrentQuality(level?.height ? `${level.height}p` : `Level ${data.level + 1}`);
      });
    };

    loadVideo();

    return () => {
      cancelled = true;
      if (hlsRef.current) {
        hlsRef.current.destroy();
        hlsRef.current = null;
      }
    };
  }, [selectedResource, selectedVideo]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.playbackRate = Number(playbackRate);
  }, [playbackRate]);

  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;
    videoEl.muted = isMuted;
    videoEl.volume = Number(volume);
  }, [isMuted, volume]);

  const saveCurrentProgress = useCallback(
    async ({ forcePercent, forceComplete = false } = {}) => {
      if (!selectedVideo?._id || selectedVideo.isLocked || !courseId) return;

      const video = videoRef.current;
      const watchedTime = Number(video?.currentTime || 0);
      const videoDuration = Number(video?.duration || selectedVideo.duration || 0);
      const calculatedPercent =
        videoDuration > 0 ? Math.round((watchedTime / videoDuration) * 100) : 0;
      const nextPercent = forceComplete
        ? 100
        : Math.max(Number(forcePercent ?? calculatedPercent) || 0, selectedPercent);

      setLocalProgress((current) => ({
        ...current,
        [selectedVideo._id]: {
          ...(current[selectedVideo._id] || {}),
          progress: forceComplete || nextPercent >= 90 ? 100 : nextPercent,
          completed: forceComplete || nextPercent >= 90,
          watchedTime,
          duration: videoDuration,
        },
      }));

      const response = await saveProgress({
        courseId,
        videoId: selectedVideo._id,
        progress: nextPercent,
        watchedTime,
        duration: videoDuration,
      }).unwrap();

      if (response?.progress) {
        setLocalProgress((current) => ({
          ...current,
          [selectedVideo._id]: response.progress,
        }));
      }

      setStatusText(forceComplete || nextPercent >= 90 ? "Completed" : "Saved");
      refetchProgress();
    },
    [courseId, refetchProgress, saveProgress, selectedPercent, selectedVideo]
  );

  const handleTimeUpdate = () => {
    const video = videoRef.current;
    if (!video?.duration || !selectedVideo?._id) return;

    const nextPercent = Math.round((video.currentTime / video.duration) * 100);
    setCurrentTime(video.currentTime);
    setDuration(video.duration);

    const current = progressByVideo[String(selectedVideo._id)];
    if (!current?.completed) {
      setLocalProgress((value) => ({
        ...value,
        [selectedVideo._id]: {
          ...(value[selectedVideo._id] || {}),
          progress: Math.max(nextPercent, getProgressPercent(value[selectedVideo._id])),
          watchedTime: video.currentTime,
          duration: video.duration,
        },
      }));
    }

    const now = Date.now();
    if (!current?.completed && now - lastSaveRef.current > 10_000) {
      lastSaveRef.current = now;
      saveCurrentProgress({ forcePercent: nextPercent }).catch(() => {
        setStatusText("Progress save failed");
      });
    }
  };

  const handleLoadedMetadata = () => {
    const video = videoRef.current;
    if (!video) return;

    setDuration(video.duration || Number(selectedVideo?.duration) || 0);

    if (!selectedProgress || selectedProgress.completed) return;

    const resumeAt = Number(selectedProgress.watchedTime) || 0;
    if (resumeAt > 0 && resumeAt < video.duration - 8) {
      video.currentTime = resumeAt;
      setCurrentTime(resumeAt);
    }
  };

  const togglePlay = async () => {
    const video = videoRef.current;
    if (!video || !selectedVideo || selectedVideo.isLocked || selectedResource) return;

    if (video.paused) {
      await video.play();
      setIsPlaying(true);
    } else {
      video.pause();
      setIsPlaying(false);
      saveCurrentProgress().catch(() => setStatusText("Progress save failed"));
    }
  };

  const handleSeek = (value) => {
    const video = videoRef.current;
    if (!video?.duration) return;
    const nextTime = (Number(value) / 100) * video.duration;
    video.currentTime = nextTime;
    setCurrentTime(nextTime);
  };

  const skipBy = (seconds) => {
    const video = videoRef.current;
    if (!video?.duration) return;
    video.currentTime = Math.max(0, Math.min(video.duration, video.currentTime + seconds));
  };

  const changeQuality = (value) => {
    const hls = hlsRef.current;
    if (!hls) {
      setCurrentQuality(value);
      return;
    }

    if (value === "auto") {
      hls.currentLevel = -1;
      setCurrentQuality("auto");
      return;
    }

    const level = qualityLevels.find((item) => item.label === value);
    if (level) {
      hls.currentLevel = level.index;
      setCurrentQuality(level.label);
    }
  };

  const selectVideo = (video) => {
    if (!video || video.isLocked) return;
    setSelectedVideoId(video._id);
    setSelectedResourceId(null);
    setActivePanel("content");
    setSettingsOpen(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(Number(video.duration) || 0);
    setQualityLevels([]);
    setCurrentQuality("auto");
    setStatusText("");
  };

  const selectVideoByOffset = (offset) => {
    const next = videos[selectedIndex + offset];
    if (!next || next.isLocked) return;
    selectVideo(next);
  };

  const markCompleted = () => {
    saveCurrentProgress({ forcePercent: 100, forceComplete: true }).catch(() =>
      setStatusText("Progress save failed")
    );
  };

  const openResource = (resource, panelName = activePanel) => {
    if (!resource || resource.isLocked) return;
    setSelectedResourceId(resource._id);
    setActivePanel(panelName);
    setMaterialZoom(100);
    videoRef.current?.pause();
    setIsPlaying(false);
  };

  const openResourceLibrary = (panelName) => {
    const items = panelName === "assignments" ? assignmentResources : studyResources;
    setActivePanel(panelName);
    if (items[0]) openResource(items[0], panelName);
  };

  const closeResource = () => {
    setSelectedResourceId(null);
    setActivePanel("content");
  };

  const downloadResource = (resource) => {
    if (!resource?.fileUrl || resource.isLocked) return;
    window.open(resource.fileUrl, "_blank", "noopener,noreferrer");
  };

  const seekPercent = duration > 0 ? Math.min(100, (currentTime / duration) * 100) : 0;
  const playable = Boolean(selectedVideo && !selectedVideo.isLocked && getVideoSource(selectedVideo));
  const lessonTitle = selectedResource?.title || selectedVideo?.title || course.title;
  const lessonContext = selectedResource?.sectionTitle || selectedVideo?.sectionTitle || "Course";
  const selectedStatusText = statusText || `${selectedPercent}% complete`;

  if (playerLoading) {
    return (
      <div className="grid min-h-screen place-items-center bg-white text-sm font-black text-slate-600">
        Loading player...
      </div>
    );
  }

  if (playerError || !course?._id) {
    return (
      <div className="grid min-h-screen place-items-center bg-white px-6 text-center">
        <div>
          <h1 className="text-2xl font-black text-slate-950">Course player unavailable</h1>
          <button
            type="button"
            onClick={refetchPlayer}
            className="mt-6 rounded-md bg-slate-950 px-5 py-3 text-sm font-black text-white"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-[#20232d]">
      <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-200 bg-white px-3 sm:px-4">
        <div className="flex min-w-0 items-center gap-3">
          <button
            type="button"
            onClick={() => navigate("/my-courses")}
            className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[#808080] text-white transition hover:bg-[#6f6f6f]"
            aria-label="Back to my courses"
          >
            <ArrowLeft size={22} />
          </button>

          <BrandMark />

          <span className="hidden h-8 w-px bg-slate-200 md:block" />

          <h1 className="min-w-0 truncate text-[15px] font-black text-[#161923] sm:text-lg">
            {course.title}
          </h1>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <div className="hidden items-center gap-3 rounded-full bg-[#f3f5f8] px-4 py-2 text-sm font-black text-[#2f3340] sm:flex">
            <span className="grid h-5 w-5 place-items-center rounded-[4px] bg-[#687282] text-white">
              <Play size={12} fill="currentColor" />
            </span>
            <span>
              {completedVideoCount} of {videos.length} complete
            </span>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen((value) => !value)}
            className="grid h-10 w-10 place-items-center rounded-full border border-slate-200 text-slate-600 transition hover:border-slate-400"
            aria-label={isSidebarOpen ? "Hide content panel" : "Show content panel"}
          >
            <ListVideo size={19} />
          </button>

          {profileImage ? (
            <img
              src={profileImage}
              alt={user?.name || "Profile"}
              className="h-10 w-10 rounded-full border border-slate-200 object-cover"
            />
          ) : (
            <UserCircle2 size={40} className="text-[#737373]" />
          )}
        </div>
      </header>

      <main className="flex h-[calc(100vh-64px)] overflow-hidden bg-[#05070b] max-lg:h-auto max-lg:min-h-[calc(100vh-64px)] max-lg:flex-col max-lg:overflow-y-auto">
        <section className="relative flex min-w-0 flex-1 flex-col bg-[#05070b]">
          <button
            type="button"
            onClick={() => selectVideoByOffset(-1)}
            disabled={selectedIndex <= 0 || Boolean(selectedResource)}
            className="absolute left-4 top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white shadow-xl backdrop-blur transition hover:bg-black/70 disabled:hidden"
            aria-label="Previous lesson"
          >
            <ChevronLeft size={25} />
          </button>

          <button
            type="button"
            onClick={() => selectVideoByOffset(1)}
            disabled={selectedIndex < 0 || selectedIndex >= videos.length - 1 || Boolean(selectedResource)}
            className={`absolute top-1/2 z-20 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full border border-white/20 bg-black/45 text-white shadow-xl backdrop-blur transition hover:bg-black/70 disabled:hidden ${
              isSidebarOpen ? "right-4" : "right-4"
            }`}
            aria-label="Next lesson"
          >
            <ChevronRight size={25} />
          </button>

          <div
            ref={mediaShellRef}
            className="group/player relative flex min-h-0 flex-1 items-center justify-center overflow-hidden bg-black"
          >
            {selectedResource ? (
              <div className="flex h-full w-full flex-col bg-[#f5f5f5]">
                <div className="flex min-h-12 items-center justify-between gap-3 border-b border-slate-300 bg-[#2f2f2f] px-4 text-white">
                  <div className="flex min-w-0 items-center gap-3">
                    <FileText size={18} className="shrink-0" />
                    <p className="truncate text-sm font-black">{selectedResource.title}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setMaterialZoom((value) => Math.max(50, value - 10))}
                      className="grid h-8 w-8 place-items-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                      aria-label="Zoom out"
                    >
                      <ZoomOut size={16} />
                    </button>
                    <span className="w-12 text-center text-xs font-black">{materialZoom}%</span>
                    <button
                      type="button"
                      onClick={() => setMaterialZoom((value) => Math.min(200, value + 10))}
                      className="grid h-8 w-8 place-items-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                      aria-label="Zoom in"
                    >
                      <ZoomIn size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => downloadResource(selectedResource)}
                      className="grid h-8 w-8 place-items-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                      aria-label="Download material"
                    >
                      <Download size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={() => mediaShellRef.current?.requestFullscreen?.()}
                      className="grid h-8 w-8 place-items-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                      aria-label="Fullscreen material"
                    >
                      <Maximize2 size={16} />
                    </button>
                    <button
                      type="button"
                      onClick={closeResource}
                      className="grid h-8 w-8 place-items-center rounded-md text-white/80 transition hover:bg-white/10 hover:text-white"
                      aria-label="Close material"
                    >
                      <Minimize2 size={16} />
                    </button>
                  </div>
                </div>

                {selectedResource.fileUrl ? (
                  <iframe
                    title={selectedResource.title}
                    src={getViewerSrc(selectedResource, materialZoom)}
                    className="min-h-[520px] flex-1 border-0 bg-white"
                  />
                ) : (
                  <div className="grid flex-1 place-items-center px-6 text-center">
                    <p className="text-sm font-black text-slate-500">No file is attached.</p>
                  </div>
                )}
              </div>
            ) : playable ? (
              <video
                ref={videoRef}
                className="h-full max-h-full w-full bg-black object-contain"
                onClick={togglePlay}
                onLoadedMetadata={handleLoadedMetadata}
                onTimeUpdate={handleTimeUpdate}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onEnded={() => {
                  setIsPlaying(false);
                  saveCurrentProgress({ forcePercent: 100, forceComplete: true }).catch(() =>
                    setStatusText("Progress save failed")
                  );
                }}
                playsInline
              />
            ) : (
              <EmptyMediaState
                title={videos.length ? "Select an unlocked lesson" : "Course videos will appear after upload"}
                subtitle={
                  videos.length
                    ? "Locked lessons open after course access is active."
                    : "Instructor and admin uploads are saved to S3 and then shown here from the database."
                }
              />
            )}

            {!selectedResource && playable && (
              <>
                <div className="pointer-events-none absolute left-5 top-5 z-10 max-w-[70%] rounded-lg border border-white/10 bg-black/45 px-3 py-2 text-white shadow-xl backdrop-blur">
                  <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#35c7f3]">
                    Now Playing
                  </p>
                  <p className="mt-1 truncate text-sm font-black">{lessonTitle}</p>
                </div>

                {!isPlaying && (
                  <button
                    type="button"
                    onClick={togglePlay}
                    className="absolute left-1/2 top-1/2 z-10 grid h-20 w-20 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border border-white/25 bg-black/45 text-white shadow-2xl backdrop-blur transition hover:scale-105 hover:bg-black/65"
                    aria-label="Play lesson"
                  >
                    <Play size={34} fill="currentColor" className="ml-1" />
                  </button>
                )}

                <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black via-black/85 to-transparent px-4 pb-4 pt-24 text-white sm:px-5">
                  <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-white/45">
                        {lessonContext}
                      </p>
                      <h2 className="mt-1 max-w-3xl truncate text-base font-black text-white sm:text-lg">
                        {lessonTitle}
                      </h2>
                    </div>
                    <div className="rounded-full bg-white/10 px-3 py-1 text-xs font-black text-white/80">
                      {selectedStatusText}
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-12 text-sm font-black tabular-nums text-white/85">
                      {formatDuration(currentTime)}
                    </span>
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={seekPercent}
                      onChange={(event) => handleSeek(event.target.value)}
                      className="h-1.5 flex-1 cursor-pointer accent-[#22b9e8]"
                      aria-label="Seek"
                    />
                    <span className="w-12 text-right text-sm font-black tabular-nums text-white/85">
                      {formatDuration(duration || selectedVideo?.duration)}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => skipBy(-10)}
                      className="grid h-9 w-9 place-items-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white"
                      aria-label="Back 10 seconds"
                    >
                      <RotateCcw size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={togglePlay}
                      className="grid h-11 w-11 place-items-center rounded-full bg-white text-black shadow-lg transition hover:bg-[#22b9e8]"
                      aria-label={isPlaying ? "Pause" : "Play"}
                    >
                      {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => skipBy(10)}
                      className="grid h-9 w-9 place-items-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white"
                      aria-label="Forward 10 seconds"
                    >
                      <RotateCw size={18} />
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsMuted((value) => !value)}
                      className="grid h-9 w-9 place-items-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white"
                      aria-label={isMuted ? "Unmute" : "Mute"}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={isMuted ? 0 : volume}
                      onChange={(event) => {
                        setVolume(event.target.value);
                        setIsMuted(Number(event.target.value) === 0);
                      }}
                      className="hidden h-1 w-24 accent-[#22b9e8] sm:block"
                      aria-label="Volume"
                    />

                    <div className="relative ml-auto">
                      <button
                        type="button"
                        onClick={() => setSettingsOpen((value) => !value)}
                        className="grid h-9 w-9 place-items-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white"
                        aria-label="Settings"
                      >
                        <Settings size={18} />
                      </button>

                      {settingsOpen && (
                        <div className="absolute bottom-12 right-0 z-30 w-72 rounded-lg border border-white/10 bg-[#111827] p-3 text-sm shadow-2xl">
                          <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                            <span className="font-black text-white/70">Speed</span>
                            <div className="flex gap-1">
                              {["0.75", "1", "1.25", "1.5", "2"].map((rate) => (
                                <button
                                  key={rate}
                                  type="button"
                                  onClick={() => setPlaybackRate(rate)}
                                  className={`h-8 rounded-md px-2 text-xs font-black transition ${
                                    playbackRate === rate
                                      ? "bg-[#22b9e8] text-black"
                                      : "bg-white/10 text-white hover:bg-white/15"
                                  }`}
                                >
                                  {rate}x
                                </button>
                              ))}
                            </div>
                          </div>

                          <div className="mt-3 flex items-center justify-between gap-3">
                            <span className="font-black text-white/70">Quality</span>
                            <select
                              value={currentQuality}
                              onChange={(event) => changeQuality(event.target.value)}
                              className="h-9 rounded-md border border-white/10 bg-black px-3 text-sm font-black text-white outline-none"
                            >
                              <option value="auto">Auto</option>
                              {qualityLevels.length > 0 ? (
                                qualityLevels.map((level) => (
                                  <option key={level.label} value={level.label}>
                                    {level.label}
                                  </option>
                                ))
                              ) : (
                                <option value="original">Original</option>
                              )}
                            </select>
                          </div>
                        </div>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => mediaShellRef.current?.requestFullscreen?.()}
                      className="grid h-9 w-9 place-items-center rounded-full text-white/85 transition hover:bg-white/10 hover:text-white"
                      aria-label="Fullscreen"
                    >
                      <Expand size={18} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>

          <div className="border-t border-white/10 bg-[#05070b] px-4 py-3 text-white sm:px-5">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-black uppercase tracking-[0.14em] text-white/40">
                  {lessonContext}
                </p>
                <h2 className="mt-1 truncate text-base font-black text-white">
                  {lessonTitle}
                </h2>
                {!selectedResource && (
                  <div className="mt-2 flex items-center gap-3">
                    <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/10">
                      <div
                        className="h-full rounded-full bg-[#22b9e8] transition-all"
                        style={{ width: `${selectedPercent}%` }}
                      />
                    </div>
                    <span className="shrink-0 text-xs font-black text-white/55">
                      {selectedStatusText}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {selectedResource ? (
                  <button
                    type="button"
                    onClick={closeResource}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 px-4 text-sm font-black text-white transition hover:bg-white/10"
                  >
                    <ListVideo size={16} />
                    Back to Videos
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => openResourceLibrary("materials")}
                    disabled={studyResources.length === 0}
                    className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 px-4 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/35"
                  >
                    <BookOpen size={16} />
                    Materials
                    <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px]">
                      {studyResources.length}
                    </span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => openResourceLibrary("assignments")}
                  disabled={assignmentResources.length === 0}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 px-4 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/35"
                >
                  <ClipboardList size={16} />
                  Assignments
                  <span className="rounded bg-white/10 px-1.5 py-0.5 text-[11px]">
                    {assignmentResources.length}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={markCompleted}
                  disabled={!selectedVideo || selectedVideo.isLocked || isSavingProgress || Boolean(selectedResource)}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#23a455] px-4 text-sm font-black text-white transition hover:bg-[#1f914c] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/35"
                >
                  <CheckCircle2 size={17} />
                  Completed
                </button>
              </div>
            </div>
          </div>

          <div className="hidden border-t border-white/10 bg-black px-3 pb-3 pt-2 text-white">
            {!selectedResource && (
              <>
                <div className="flex items-center gap-3">
                  <span className="w-12 text-sm font-black tabular-nums">
                    {formatDuration(currentTime)}
                  </span>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={seekPercent}
                    onChange={(event) => handleSeek(event.target.value)}
                    disabled={!playable}
                    className="h-1 flex-1 accent-[#22b9e8]"
                    aria-label="Seek"
                  />
                  <span className="w-12 text-right text-sm font-black tabular-nums">
                    {formatDuration(duration || selectedVideo?.duration)}
                  </span>
                </div>

                <div className="mt-2 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => skipBy(-10)}
                    disabled={!playable}
                    className="grid h-9 w-9 place-items-center rounded-md text-white/85 transition hover:bg-white/10 disabled:opacity-40"
                    aria-label="Back 10 seconds"
                  >
                    <RotateCcw size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={togglePlay}
                    disabled={!playable}
                    className="grid h-10 w-10 place-items-center rounded-md text-white transition hover:bg-white/10 disabled:opacity-40"
                    aria-label={isPlaying ? "Pause" : "Play"}
                  >
                    {isPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" />}
                  </button>
                  <button
                    type="button"
                    onClick={() => skipBy(10)}
                    disabled={!playable}
                    className="grid h-9 w-9 place-items-center rounded-md text-white/85 transition hover:bg-white/10 disabled:opacity-40"
                    aria-label="Forward 10 seconds"
                  >
                    <RotateCw size={18} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsMuted((value) => !value)}
                    disabled={!playable}
                    className="grid h-9 w-9 place-items-center rounded-md text-white/85 transition hover:bg-white/10 disabled:opacity-40"
                    aria-label={isMuted ? "Unmute" : "Mute"}
                  >
                    {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                  </button>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={isMuted ? 0 : volume}
                    onChange={(event) => {
                      setVolume(event.target.value);
                      setIsMuted(Number(event.target.value) === 0);
                    }}
                    disabled={!playable}
                    className="h-1 w-24 accent-[#22b9e8]"
                    aria-label="Volume"
                  />

                  <div className="relative ml-auto">
                    <button
                      type="button"
                      onClick={() => setSettingsOpen((value) => !value)}
                      disabled={!playable}
                      className="grid h-9 w-9 place-items-center rounded-md text-white/85 transition hover:bg-white/10 disabled:opacity-40"
                      aria-label="Settings"
                    >
                      <Settings size={18} />
                    </button>

                    {settingsOpen && (
                      <div className="absolute bottom-11 right-0 z-30 w-72 rounded-md border border-white/10 bg-[#111827] p-3 text-sm shadow-2xl">
                        <div className="flex items-center justify-between gap-3 border-b border-white/10 pb-3">
                          <span className="font-black text-white/70">Speed</span>
                          <div className="flex gap-1">
                            {["0.75", "1", "1.25", "1.5", "2"].map((rate) => (
                              <button
                                key={rate}
                                type="button"
                                onClick={() => setPlaybackRate(rate)}
                                className={`h-8 rounded-md px-2 text-xs font-black transition ${
                                  playbackRate === rate
                                    ? "bg-[#22b9e8] text-black"
                                    : "bg-white/10 text-white hover:bg-white/15"
                                }`}
                              >
                                {rate}x
                              </button>
                            ))}
                          </div>
                        </div>

                        <div className="mt-3 flex items-center justify-between gap-3">
                          <span className="font-black text-white/70">Quality</span>
                          <select
                            value={currentQuality}
                            onChange={(event) => changeQuality(event.target.value)}
                            className="h-9 rounded-md border border-white/10 bg-black px-3 text-sm font-black text-white outline-none"
                          >
                            <option value="auto">Auto</option>
                            {qualityLevels.length > 0 ? (
                              qualityLevels.map((level) => (
                                <option key={level.label} value={level.label}>
                                  {level.label}
                                </option>
                              ))
                            ) : (
                              <option value="original">Original</option>
                            )}
                          </select>
                        </div>
                      </div>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() => mediaShellRef.current?.requestFullscreen?.()}
                    className="grid h-9 w-9 place-items-center rounded-md text-white/85 transition hover:bg-white/10"
                    aria-label="Fullscreen"
                  >
                    <Expand size={18} />
                  </button>
                </div>
              </>
            )}

            <div className={`flex flex-wrap items-center gap-2 ${selectedResource ? "" : "mt-3"}`}>
              <button
                type="button"
                onClick={() => openResourceLibrary("materials")}
                disabled={studyResources.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#6554d9] px-4 text-sm font-black text-white transition hover:bg-[#5748c5] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
              >
                <BookOpen size={16} />
                Study Materials
              </button>

              <button
                type="button"
                onClick={() => openResourceLibrary("assignments")}
                disabled={assignmentResources.length === 0}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/15 px-4 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:text-white/40"
              >
                <ClipboardList size={16} />
                Assignments
              </button>

              <button
                type="button"
                onClick={markCompleted}
                disabled={!selectedVideo || selectedVideo.isLocked || isSavingProgress || Boolean(selectedResource)}
                className="ml-auto inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#23a455] px-4 text-sm font-black text-white transition hover:bg-[#1f914c] disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
              >
                <CheckCircle2 size={17} />
                Completed
              </button>
            </div>

            {!selectedResource && (
              <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs font-bold text-white/55">
                <span className="truncate">
                  {selectedVideo?.sectionTitle || "Module"} / {selectedVideo?.title || course.title}
                </span>
                <span>{statusText || `${selectedPercent}% complete`}</span>
              </div>
            )}
          </div>
        </section>

        {isSidebarOpen && (
          <aside className="flex w-[400px] shrink-0 flex-col border-l border-slate-200 bg-white text-[#252936] max-lg:w-full max-lg:border-l-0">
            <div className="flex items-center justify-between border-b border-slate-200 px-4 py-4">
              <div>
                <h2 className="text-2xl font-black">Content</h2>
                <p className="mt-1 text-sm font-bold text-slate-500">
                  {videos.length} videos / {resources.length} resources
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsSidebarOpen(false)}
                className="grid h-9 w-9 place-items-center rounded-full text-slate-500 transition hover:bg-slate-100"
                aria-label="Close content panel"
              >
                <ChevronRight size={22} />
              </button>
            </div>

            <div className="grid grid-cols-3 border-b border-slate-200 text-xs font-black">
              {[
                ["content", "Videos", videos.length],
                ["materials", "Materials", studyResources.length],
                ["assignments", "Assignments", assignmentResources.length],
              ].map(([key, label, count]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActivePanel(key)}
                  className={`flex h-12 items-center justify-center gap-2 border-b-2 transition ${
                    activePanel === key
                      ? "border-[#6554d9] text-[#6554d9]"
                      : "border-transparent text-slate-500 hover:bg-slate-50"
                  }`}
                >
                  <span>{label}</span>
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                      activePanel === key ? "bg-[#ede9fe]" : "bg-slate-100"
                    }`}
                  >
                    {count}
                  </span>
                </button>
              ))}
            </div>

            {activePanel === "content" ? (
              <div className="min-h-0 flex-1 overflow-y-auto">
                {sections.map((section) => {
                  const sectionVideos = (section.videos || [])
                    .slice()
                    .sort((left, right) => (left.order || 0) - (right.order || 0));
                  const sectionCompleted = sectionVideos.filter(
                    (video) => progressByVideo[String(video._id)]?.completed
                  ).length;
                  const open = openSections[section._id] ?? true;

                  return (
                    <section key={section._id} className="border-b border-slate-100">
                      <button
                        type="button"
                        onClick={() =>
                          setOpenSections((current) => ({
                            ...current,
                            [section._id]: !open,
                          }))
                        }
                        className="flex w-full items-start justify-between gap-3 px-4 py-4 text-left transition hover:bg-slate-50"
                      >
                        <div className="min-w-0">
                          <h3 className="text-base font-black text-[#2b2f3a]">{section.title}</h3>
                          <p className="mt-1 text-sm font-bold text-slate-500">
                            {sectionCompleted} of {sectionVideos.length}
                          </p>
                        </div>
                        <ChevronDown
                          size={18}
                          className={`mt-1 shrink-0 transition ${open ? "rotate-180" : ""}`}
                        />
                      </button>

                      {open && (
                        <div>
                          {sectionVideos.length === 0 ? (
                            <p className="px-4 pb-4 text-sm font-semibold text-slate-500">
                              No videos uploaded yet.
                            </p>
                          ) : (
                            sectionVideos.map((video, index) => {
                              const locked = video.isLocked ?? (!hasAccess && !isPreviewVideo(video));
                              const active =
                                String(video._id) === String(selectedVideo?._id) &&
                                !selectedResource;
                              const progress = progressByVideo[String(video._id)];

                              return (
                                <button
                                  key={video._id}
                                  type="button"
                                  onClick={() => selectVideo({ ...video, isLocked: locked })}
                                  className={`group flex w-full items-center gap-3 border-l-4 px-4 py-3 text-left transition ${
                                    active
                                      ? "border-[#22b9e8] bg-[#eef8fc]"
                                      : locked
                                        ? "cursor-not-allowed border-transparent text-slate-400"
                                        : "border-transparent hover:bg-slate-50"
                                  }`}
                                >
                                  <span className="w-7 shrink-0 text-sm font-black text-slate-600">
                                    {String(index + 1).padStart(2, "0")}
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block truncate text-sm font-black">
                                      {video.title}
                                    </span>
                                    <span className="mt-1 flex items-center justify-between gap-2 text-xs font-bold text-slate-500">
                                      <span>Video</span>
                                      {!locked && !progress?.completed && (
                                        <span>{getProgressPercent(progress)}%</span>
                                      )}
                                    </span>
                                    {!locked && !progress?.completed && (
                                      <span className="mt-2 block h-1 overflow-hidden rounded-full bg-slate-200">
                                        <span
                                          className="block h-full rounded-full bg-[#22b9e8]"
                                          style={{ width: `${getProgressPercent(progress)}%` }}
                                        />
                                      </span>
                                    )}
                                  </span>
                                  {locked ? (
                                    <Lock size={17} className="shrink-0 text-slate-400" />
                                  ) : progress?.completed ? (
                                    <CheckCircle2 size={18} className="shrink-0 text-[#16a34a]" fill="#16a34a" stroke="white" />
                                  ) : (
                                    <span
                                      className={`h-4 w-4 shrink-0 rounded-full border-2 ${
                                        active ? "border-[#22b9e8]" : "border-slate-200"
                                      }`}
                                    />
                                  )}
                                </button>
                              );
                            })
                          )}
                        </div>
                      )}
                    </section>
                  );
                })}
              </div>
            ) : (
              <div className="min-h-0 flex-1 overflow-y-auto p-4">
                <div className="mb-4 rounded-md border border-[#ded9ff] bg-[#f7f5ff] px-4 py-3">
                  <p className="text-sm font-black text-[#4f46a5]">
                    {activePanel === "assignments"
                      ? `${assignmentResources.length} assignments`
                      : `${studyResources.length} study materials`}
                  </p>
                </div>

                {currentPanelResources.length === 0 ? (
                  <div className="flex min-h-48 flex-col items-center justify-center rounded-md border border-dashed border-slate-300 px-5 text-center">
                    <span className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-500">
                      {activePanel === "assignments" ? (
                        <ClipboardList size={22} />
                      ) : (
                        <BookOpen size={22} />
                      )}
                    </span>
                    <p className="mt-3 text-sm font-bold text-slate-500">
                      {activePanel === "assignments"
                        ? "Assignments will appear after instructor or admin upload."
                        : "Study materials will appear after instructor or admin upload."}
                    </p>
                    <button
                      type="button"
                      onClick={() => setActivePanel("content")}
                      className="mt-4 inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#252936] px-3 text-xs font-black text-white transition hover:bg-[#111827]"
                    >
                      <ListVideo size={14} />
                      Back to Videos
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {sections.map((section) => {
                      const sectionItems = currentPanelResources.filter(
                        (resource) => String(resource.sectionId) === String(section._id)
                      );
                      if (sectionItems.length === 0) return null;

                      return (
                        <section key={section._id}>
                          <h3 className="mb-2 text-base font-black text-[#252936]">
                            {section.title}
                          </h3>
                          <div className="space-y-2">
                            {sectionItems.map((resource) => {
                              const active =
                                String(resource._id) === String(selectedResource?._id);

                              return (
                                <article
                                  key={resource._id}
                                  className={`rounded-md border px-3 py-3 ${
                                    active
                                      ? "border-[#6554d9] bg-[#f7f5ff]"
                                      : "border-slate-200 bg-white"
                                  }`}
                                >
                                  <div className="flex items-start gap-3">
                                    <ResourceIcon resource={resource} />
                                    <div className="min-w-0 flex-1">
                                      <p className="truncate text-sm font-black text-[#252936]">
                                        {resource.title}
                                      </p>
                                      <p className="mt-1 text-xs font-bold text-slate-500">
                                        {getResourceTypeLabel(resource)}
                                      </p>
                                    </div>
                                  </div>

                                  <div className="mt-3 grid grid-cols-2 gap-2">
                                    <button
                                      type="button"
                                      onClick={() => openResource(resource, activePanel)}
                                      disabled={resource.isLocked}
                                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-[#252936] px-3 text-xs font-black text-white transition hover:bg-[#111827] disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-500"
                                    >
                                      <FileText size={14} />
                                      Open
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => downloadResource(resource)}
                                      disabled={resource.isLocked}
                                      className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-slate-200 px-3 text-xs font-black text-slate-700 transition hover:border-slate-500 disabled:cursor-not-allowed disabled:text-slate-400"
                                    >
                                      <Download size={14} />
                                      Download
                                    </button>
                                  </div>
                                </article>
                              );
                            })}
                          </div>
                        </section>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            <div className="border-t border-slate-200 px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-xs font-black text-slate-500">
                <span>Course Progress</span>
                <span>{coursePercent}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-slate-200">
                <div
                  className="h-full rounded-full bg-[#22b9e8] transition-all"
                  style={{ width: `${coursePercent}%` }}
                />
              </div>
            </div>
          </aside>
        )}
      </main>
    </div>
  );
}
