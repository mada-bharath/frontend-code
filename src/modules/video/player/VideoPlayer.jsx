import { useEffect, useRef, useState } from "react";
import useVideoPlayer from "../hooks/useVideoPlayer";

/**
 * =========================================================
 * 🎬 VIDEO PLAYER (ULTIMATE PRODUCTION 🔥)
 * =========================================================
 *
 * ✅ Auto + Manual Quality
 * ✅ Resume Support
 * ✅ Auto Save Progress
 * ✅ Safe Handling
 * ✅ Clean UI
 *
 * =========================================================
 */

const HLS_CDN_URL = "https://cdn.jsdelivr.net/npm/hls.js@latest";

const isHlsUrl = (src = "") => /\.m3u8($|\?)/i.test(src);

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

export default function VideoPlayer({
  url,
  video,
  courseId,
  progressData = [],
  onEnded,
}) {
  const videoRef = useRef(null);

  /* ================= STATES ================= */
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [volume, setVolume] = useState(1);
  const [speed, setSpeed] = useState(1);
  const [loading, setLoading] = useState(true);

  // 🔥 QUALITY
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState("auto");

  /* ================= HOOK ================= */
  useVideoPlayer({
    videoRef,
    video,
    courseId,
    progressData,
  });

  /* =========================================================
     🎥 LOAD VIDEO (HLS)
  ========================================================= */
  useEffect(() => {
    if (!videoRef.current) return;

    const videoEl = videoRef.current;
    let cancelled = false;
    let hls;

    if (!url) {
      videoEl.removeAttribute("src");
      setLoading(false);
      return;
    }

    setLoading(true);
    setQualityLevels([]);
    setCurrentQuality("auto");

    const loadVideo = async () => {
      if (!isHlsUrl(url)) {
        videoEl.src = url;
        videoEl.load();
        setLoading(false);
        return;
      }

      if (videoEl.canPlayType("application/vnd.apple.mpegurl")) {
        videoEl.src = url;
        videoEl.load();
        setLoading(false);
        return;
      }

      const Hls = await loadHls();
      if (cancelled) return;

      if (!Hls?.isSupported?.()) {
        videoEl.src = url;
        videoEl.load();
        setLoading(false);
        return;
      }

      hls = new Hls({ startLevel: -1 });
      hls.loadSource(url);
      hls.attachMedia(videoEl);

      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        const levels = hls.levels.map((l, i) => ({
          index: i,
          label: `${l.height}p`,
        }));

        setQualityLevels(levels);
        setLoading(false);
      });

      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (data.level === -1) {
          setCurrentQuality("auto");
        } else {
          const level = hls.levels[data.level];
          setCurrentQuality(`${level.height}p`);
        }
      });

      videoRef.current.hls = hls;
    };

    loadVideo();

    return () => {
      cancelled = true;
      if (hls) hls.destroy();
      if (videoRef.current?.hls === hls) {
        videoRef.current.hls = null;
      }
    };
  }, [url]);

  /* ================= CONTROLS ================= */

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;

    if (v.paused) {
      v.play();
      setIsPlaying(true);
    } else {
      v.pause();
      setIsPlaying(false);
    }
  };

  const handleTimeUpdate = () => {
    const v = videoRef.current;
    if (!v?.duration) return;

    setProgress((v.currentTime / v.duration) * 100);
  };

  const handleSeek = (e) => {
    const v = videoRef.current;
    if (!v?.duration) return;

    const value = e.target.value;
    v.currentTime = (value / 100) * v.duration;
    setProgress(value);
  };

  const handleVolume = (e) => {
    const v = videoRef.current;
    if (!v) return;

    const value = e.target.value;
    v.volume = value;
    setVolume(value);
  };

  const handleSpeed = (rate) => {
    const v = videoRef.current;
    if (!v) return;

    v.playbackRate = rate;
    setSpeed(rate);
  };

  /* ================= QUALITY ================= */

  const changeQuality = (level) => {
    const hls = videoRef.current?.hls;
    if (!hls) return;

    if (level === "auto") {
      hls.currentLevel = -1;
      setCurrentQuality("auto");
    } else {
      hls.currentLevel = level;
      setCurrentQuality(`${hls.levels[level].height}p`);
    }
  };

  /* ================= END ================= */

  const handleEnded = () => {
    setIsPlaying(false);
    if (onEnded) onEnded();
  };

  /* ================= UI ================= */

  return (
    <div className="bg-black rounded-xl overflow-hidden relative">

      {!video ? (
        <div className="h-[400px] flex items-center justify-center text-white">
          Select a video to start learning 🎬
        </div>
      ) : (
        <>
          {/* VIDEO */}
          <video
            ref={videoRef}
            className="w-full h-[400px]"
            onTimeUpdate={handleTimeUpdate}
            onEnded={handleEnded}
          />

          {/* LOADING */}
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center text-white">
              Loading video...
            </div>
          )}

          {/* CONTROLS */}
          <div className="p-3 bg-gray-900 text-white flex flex-col gap-2">

            {/* PLAY */}
            <button onClick={togglePlay}>
              {isPlaying ? "Pause ⏸" : "Play ▶"}
            </button>

            {/* SEEK */}
            <input type="range" value={progress} onChange={handleSeek} />

            {/* VOLUME */}
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={volume}
              onChange={handleVolume}
            />

            {/* SPEED */}
            <div className="flex gap-2">
              {[0.5, 1, 1.5, 2].map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeed(s)}
                  className={`px-2 py-1 ${
                    speed === s
                      ? "bg-indigo-500"
                      : "bg-gray-700"
                  }`}
                >
                  {s}x
                </button>
              ))}
            </div>

            {/* 🔥 QUALITY */}
            <div className="flex gap-2 flex-wrap">
              <button
                onClick={() => changeQuality("auto")}
                className={`px-2 py-1 ${
                  currentQuality === "auto"
                    ? "bg-indigo-500"
                    : "bg-gray-700"
                }`}
              >
                Auto
              </button>

              {qualityLevels.map((q) => (
                <button
                  key={q.index}
                  onClick={() => changeQuality(q.index)}
                  className={`px-2 py-1 ${
                    currentQuality === q.label
                      ? "bg-indigo-500"
                      : "bg-gray-700"
                  }`}
                >
                  {q.label}
                </button>
              ))}
            </div>

          </div>
        </>
      )}
    </div>
  );
}
