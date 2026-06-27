import Hls from "hls.js";
import { useEffect, useRef, useState } from "react";

/**
 * =========================================================
 * 🎬 HLS PLAYER (FINAL PRODUCTION 🔥)
 * =========================================================
 *
 * ✅ Auto quality (adaptive streaming)
 * ✅ Manual quality selection
 * ✅ Safe fallback
 * ✅ Clean UI
 * ✅ No breaking changes
 *
 * =========================================================
 */

export default function HLSPlayer({ src }) {
  const videoRef = useRef(null);

  // 🔥 QUALITY STATES
  const [qualityLevels, setQualityLevels] = useState([]);
  const [currentQuality, setCurrentQuality] = useState("auto");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!videoRef.current || !src) return;

    const video = videoRef.current;

    setLoading(true);

    if (Hls.isSupported()) {
      const hls = new Hls({
        autoStartLoad: true,
        startLevel: -1, // 🔥 AUTO QUALITY
      });

      hls.loadSource(src);
      hls.attachMedia(video);

      /* =========================
         🎯 LOAD QUALITY LEVELS
      ========================= */
      hls.on(Hls.Events.MANIFEST_PARSED, () => {
        setLoading(false);

        const levels = hls.levels.map((l, i) => ({
          index: i,
          label: `${l.height}p`,
        }));

        setQualityLevels(levels);
      });

      /* =========================
         🔄 TRACK CURRENT QUALITY
      ========================= */
      hls.on(Hls.Events.LEVEL_SWITCHED, (_, data) => {
        if (data.level === -1) {
          setCurrentQuality("auto");
        } else {
          const level = hls.levels[data.level];
          setCurrentQuality(`${level.height}p`);
        }
      });

      // attach instance for manual control
      videoRef.current.hls = hls;

      return () => {
        hls.destroy();
      };
    } else {
      // fallback (Safari native HLS)
      video.src = src;
      setLoading(false);
    }
  }, [src]);

  /* =========================================================
     🎯 CHANGE QUALITY
  ========================================================= */
  const changeQuality = (level) => {
    const hls = videoRef.current?.hls;

    if (!hls) return;

    if (level === "auto") {
      hls.currentLevel = -1;
      setCurrentQuality("auto");
    } else {
      hls.currentLevel = level;
      setCurrentQuality(
        `${hls.levels[level].height}p`
      );
    }
  };

  return (
    <div className="bg-black rounded-xl overflow-hidden relative">

      {/* VIDEO */}
      <video
        ref={videoRef}
        controls
        className="w-full h-[400px]"
      />

      {/* LOADING */}
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center text-white">
          Loading video...
        </div>
      )}

      {/* QUALITY CONTROLS */}
      <div className="bg-gray-900 text-white p-3 flex gap-2 flex-wrap">

        {/* AUTO */}
        <button
          onClick={() => changeQuality("auto")}
          className={`px-3 py-1 rounded ${
            currentQuality === "auto"
              ? "bg-indigo-500"
              : "bg-gray-700"
          }`}
        >
          Auto
        </button>

        {/* MANUAL LEVELS */}
        {qualityLevels.map((q) => (
          <button
            key={q.index}
            onClick={() => changeQuality(q.index)}
            className={`px-3 py-1 rounded ${
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
  );
}