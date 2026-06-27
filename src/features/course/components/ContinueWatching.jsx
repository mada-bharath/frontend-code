import { useNavigate } from "react-router-dom";

/**
 * ▶ CONTINUE WATCHING CARD (FINAL PRODUCTION)
 */
export default function ContinueWatching({ course }) {
  const navigate = useNavigate();

  // ❌ Safety check
  if (!course) return null;

  const handleResume = () => {
    navigate(`/course/${course._id}`);
  };

  return (
    <div className="bg-white p-5 rounded-xl shadow-md hover:shadow-lg transition mb-6">

      {/* 🔥 HEADER */}
      <h2 className="text-lg font-semibold mb-4">
        Continue Watching
      </h2>

      <div className="flex flex-col md:flex-row items-center gap-4">

        {/* 🖼 THUMBNAIL */}
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full md:w-40 h-24 object-cover rounded"
          />
        ) : (
          <div className="w-full md:w-40 h-24 bg-gray-200 rounded flex items-center justify-center text-gray-500 text-sm">
            No Image
          </div>
        )}

        {/* 📘 DETAILS */}
        <div className="flex-1 w-full">

          <h3 className="font-medium text-base">
            {course.title}
          </h3>

          {/* 📊 PROGRESS TEXT */}
          <p className="text-sm text-gray-500 mt-1">
            Progress: {course.progress || 0}%
          </p>

          {/* 📊 PROGRESS BAR */}
          <div className="bg-gray-200 h-2 rounded mt-2">
            <div
              className="bg-green-500 h-2 rounded transition-all"
              style={{ width: `${course.progress || 0}%` }}
            />
          </div>

        </div>

        {/* ▶ BUTTON */}
        <button
          onClick={handleResume}
          className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg transition"
        >
          ▶ Resume
        </button>

      </div>
    </div>
  );
}