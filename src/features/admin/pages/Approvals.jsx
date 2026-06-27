import {
  useGetPendingCoursesQuery,
  useUpdateAdminCourseStatusMutation,
} from "../../../core/api/endpoints/adminApi";

export default function Approvals() {
  const { data, isLoading, isError } = useGetPendingCoursesQuery();
  const [updateStatus, { isLoading: isUpdating }] =
    useUpdateAdminCourseStatusMutation();

  const courses = data?.data || [];

  const setStatus = async (id, status) => {
    await updateStatus({ id, status }).unwrap();
  };

  if (isLoading) return <div className="p-6">Loading approvals...</div>;
  if (isError) {
    return <div className="p-6 text-red-500">Failed to load approvals.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Pending Approvals</h1>

      {courses.length === 0 ? (
        <p className="text-sm text-gray-500">No pending courses.</p>
      ) : (
        courses.map((course) => (
          <div key={course._id} className="p-4 mb-3 bg-white shadow rounded">
            <h2>{course.title}</h2>
            <p className="text-sm text-gray-500">
              Instructor: {course.createdBy?.email || "N/A"}
            </p>

            <div className="flex gap-2 mt-2">
              <button
                disabled={isUpdating}
                className="bg-green-500 text-white px-3 py-1 rounded disabled:opacity-60"
                onClick={() => setStatus(course._id, "approved")}
              >
                Approve
              </button>

              <button
                disabled={isUpdating}
                className="bg-red-500 text-white px-3 py-1 rounded disabled:opacity-60"
                onClick={() => setStatus(course._id, "rejected")}
              >
                Reject
              </button>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
