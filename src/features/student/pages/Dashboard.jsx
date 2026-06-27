import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../../../design-system/layouts/Navbar";
import ContinueWatching from "../../course/components/ContinueWatching";
import { useGetPaymentMyCoursesQuery } from "../../../core/api/endpoints/paymentApi";
import { useLazyGetCourseProgressQuery } from "../../../core/api/endpoints/progressApi";

export default function Dashboard() {
  const navigate = useNavigate();
  const { data, isLoading } = useGetPaymentMyCoursesQuery();
  const [getCourseProgress] = useLazyGetCourseProgressQuery();
  const [progressByCourse, setProgressByCourse] = useState({});

  const courses = useMemo(() => {
    const purchases = data?.data || data || [];
    return purchases
      .map((purchase) => ({
        ...(purchase.courseId || purchase.course || purchase),
        accessType: purchase.accessType,
      }))
      .filter((course) => course?._id);
  }, [data]);

  useEffect(() => {
    let ignore = false;

    const loadProgress = async () => {
      const entries = await Promise.all(
        courses.map(async (course) => {
          try {
            const result = await getCourseProgress(course._id).unwrap();
            return [
              course._id,
              {
                progress: result?.percentage || 0,
                lastVideo: result?.lastVideo || null,
              },
            ];
          } catch {
            return [course._id, { progress: 0, lastVideo: null }];
          }
        })
      );

      if (!ignore) setProgressByCourse(Object.fromEntries(entries));
    };

    if (!courses.length) {
      return () => {
        ignore = true;
      };
    }

    loadProgress();

    return () => {
      ignore = true;
    };
  }, [courses, getCourseProgress]);

  const enrichedCourses = courses.map((course) => ({
    ...course,
    progress: progressByCourse[course._id]?.progress || 0,
    lastVideo: progressByCourse[course._id]?.lastVideo || null,
  }));
  const continueCourse = enrichedCourses.find((course) => course.lastVideo) || null;

  if (isLoading) {
    return <div className="p-10 text-center">Loading dashboard...</div>;
  }

  return (
    <div className="bg-gray-100 min-h-screen">
      <Navbar />

      <div className="pt-20 p-6">
        <h1 className="text-2xl font-bold mb-6">Welcome Back</h1>

        {continueCourse && <ContinueWatching course={continueCourse} />}

        {enrichedCourses.length === 0 && (
          <p className="text-gray-500">
            You have not enrolled in any courses yet.
          </p>
        )}

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {enrichedCourses.map((course) => (
            <div
              key={course._id}
              className="bg-white rounded-xl shadow p-4 hover:shadow-lg transition"
            >
              {course.thumbnail ? (
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-40 object-cover rounded mb-3"
                />
              ) : (
                <div className="w-full h-40 bg-gray-200 rounded mb-3 flex items-center justify-center text-gray-500">
                  No Image
                </div>
              )}

              <h2 className="font-semibold text-lg">{course.title}</h2>
              <p className="text-sm text-gray-500 mt-2">
                Progress: {course.progress || 0}%
              </p>

              <div className="bg-gray-200 h-2 rounded mt-2">
                <div
                  className="bg-green-500 h-2 rounded transition-all"
                  style={{ width: `${course.progress || 0}%` }}
                />
              </div>

              <button
                onClick={() => navigate(`/course/${course._id}`)}
                className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white py-2 rounded"
              >
                Continue Watching
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
