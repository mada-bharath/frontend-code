import { useEffect, useRef } from "react";
import { useSaveProgressMutation } from "../../../core/api/endpoints/progressApi";

const getProgressVideoId = (progress) =>
  progress?.video?._id || progress?.videoId || progress?.video;

export default function useVideoPlayer({
  videoRef,
  video,
  courseId,
  progressData = [],
}) {
  const intervalRef = useRef(null);
  const hasResumed = useRef(false);
  const [saveProgress] = useSaveProgressMutation();

  useEffect(() => {
    if (!videoRef.current || !video) return;

    const player = videoRef.current;
    const saved = progressData.find(
      (progress) => String(getProgressVideoId(progress)) === String(video._id)
    );

    if (saved?.watchedTime && !hasResumed.current) {
      player.currentTime = saved.watchedTime;
      hasResumed.current = true;
    }
  }, [video, progressData, videoRef]);

  useEffect(() => {
    if (!videoRef.current || !video?._id || !courseId) return;

    const player = videoRef.current;

    const saveCurrentProgress = async () => {
      try {
        if (!player.duration) return;

        await saveProgress({
          courseId,
          videoId: video._id,
          watchedTime: Math.floor(player.currentTime),
          duration: Math.floor(player.duration),
        }).unwrap();
      } catch {
        console.error("Progress save failed");
      }
    };

    intervalRef.current = setInterval(saveCurrentProgress, 5000);

    return () => {
      clearInterval(intervalRef.current);
    };
  }, [video, courseId, saveProgress, videoRef]);

  useEffect(() => {
    if (!videoRef.current || !video?._id || !courseId) return;

    const player = videoRef.current;

    const handleEnd = async () => {
      try {
        await saveProgress({
          courseId,
          videoId: video._id,
          progress: 100,
        }).unwrap();
      } catch {
        console.error("End progress save failed");
      }
    };

    player.addEventListener("ended", handleEnd);

    return () => {
      player.removeEventListener("ended", handleEnd);
    };
  }, [video, courseId, saveProgress, videoRef]);

  useEffect(() => {
    hasResumed.current = false;
  }, [video]);
}
