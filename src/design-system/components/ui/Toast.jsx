import { useEffect } from "react";

export default function Toast({
  message = "",
  type = "success", // success | error | warning | info
  duration = 3000,
  onClose,
}) {
  // ✅ Auto close after duration
  useEffect(() => {
    if (!onClose) return;

    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [onClose, duration]);

  // ✅ Type-based styles
  const bgColor = {
    success: "bg-green-500",
    error: "bg-red-500",
    warning: "bg-yellow-500 text-black",
    info: "bg-blue-500",
  }[type];

  return (
    <div
      className={`fixed top-5 right-5 flex items-center justify-between gap-3 
      px-4 py-3 min-w-[250px] max-w-sm rounded-xl shadow-lg 
      text-white z-50 animate-slideIn ${bgColor}`}
    >
      {/* ✅ Message */}
      <span className="text-sm font-medium">{message}</span>

      {/* ❌ Close Button */}
      <button
        onClick={onClose}
        className="ml-2 text-lg font-bold opacity-80 hover:opacity-100"
      >
        ✕
      </button>
    </div>
  );
}