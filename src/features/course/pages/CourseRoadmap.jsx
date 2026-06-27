import { ArrowLeft, ImageOff, Loader2, Map } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import Navbar from "../../../design-system/layouts/Navbar";
import { useGetCourseByIdQuery } from "../../../core/api/endpoints/courseApi";
import { getMediaUrl } from "../../../utils/mediaUrl";

const extractCourse = (payload) =>
  payload?.data?.course || payload?.course || payload?.data || payload || null;

export default function CourseRoadmap() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const { data, isLoading } = useGetCourseByIdQuery(courseId, {
    skip: !courseId,
  });

  const course = extractCourse(data);
  const roadmapUrl = getMediaUrl(course?.roadmap);

  if (isLoading) {
    return (
      <div className="font-course-body min-h-screen bg-[#eef5ff] text-slate-950">
        <Navbar />
        <main className="flex min-h-screen items-center justify-center pt-20">
          <Loader2 className="h-10 w-10 animate-spin text-blue-600" />
        </main>
      </div>
    );
  }

  return (
    <div className="font-course-body min-h-screen bg-[#eef5ff] text-slate-950">
      <Navbar />

      <main className="mx-auto max-w-[1216px] px-4 pb-14 pt-24 sm:px-6 lg:px-8">
        <div className="mb-5 flex flex-wrap items-center gap-2 text-sm font-semibold text-slate-500">
          <button
            type="button"
            onClick={() => navigate(`/courses/${courseId}`)}
            className="inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white px-3 py-2 text-sm font-black text-slate-700 transition hover:border-blue-200 hover:text-blue-700"
          >
            <ArrowLeft size={16} />
            Back to Course
          </button>
          <span>/</span>
          <span>Roadmap</span>
        </div>

        <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-xl shadow-slate-200/70 sm:p-8">
          <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="inline-flex items-center gap-2 rounded-md bg-amber-50 px-3 py-1.5 text-xs font-black uppercase tracking-widest text-amber-800">
                <Map size={15} />
                Course Roadmap
              </p>
              <h1 className="font-course-heading mt-4 text-[36px] font-black leading-tight text-slate-950 sm:text-[48px]">
                {course?.title || "Course roadmap"}
              </h1>
              {course?.subtitle && (
                <p className="mt-3 max-w-3xl text-[20px] font-medium leading-8 text-slate-700">
                  {course.subtitle}
                </p>
              )}
            </div>
          </div>

          {roadmapUrl ? (
            <div className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50 p-3">
              <img
                src={roadmapUrl}
                alt={`${course?.title || "Course"} roadmap`}
                className="mx-auto max-h-[calc(100vh-260px)] min-h-[360px] w-full object-contain"
              />
            </div>
          ) : (
            <div className="flex min-h-[360px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-200 bg-slate-50 p-8 text-center">
              <ImageOff size={44} className="text-slate-300" />
              <h2 className="mt-4 text-2xl font-black text-slate-900">
                Roadmap image not available
              </h2>
              <p className="mt-2 max-w-xl text-sm font-semibold leading-6 text-slate-500">
                Upload a roadmap image from the admin course editor to show it here.
              </p>
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
