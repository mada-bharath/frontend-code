import { useEffect, useRef, useState } from "react";

export default function useOtpTimer(initial = 60) {
  const [time, setTime] = useState(initial);
  const intervalRef = useRef(null);

  // ✅ Start timer
  useEffect(() => {
    // If already running, don't create another interval
    if (intervalRef.current) return;

    intervalRef.current = setInterval(() => {
      setTime((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // ✅ Cleanup on unmount
    return () => {
      clearInterval(intervalRef.current);
    };
  }, []);

  // ✅ Reset timer (used for resend OTP)
  const resetTimer = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
    setTime(initial);
  };

  return { time, resetTimer };
}