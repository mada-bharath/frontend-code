import toast from "react-hot-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  useGetDashboardQuery,
  useGetPendingCoursesQuery,
  useUpdateAdminCourseStatusMutation,
} from "../../../core/api/endpoints/adminApi";

export default function AdminDashboard() {
  const { data: dashboardRes, isLoading: statsLoading } = useGetDashboardQuery();
  const { data: pendingRes, isLoading: pendingLoading } =
    useGetPendingCoursesQuery();
  const [updateStatus] = useUpdateAdminCourseStatusMutation();

  const pendingCourses = pendingRes?.data || [];
  const dashboard = dashboardRes?.data || {};
  const stats = {
    users: dashboard.users || dashboard.totalUsers || 0,
    courses: dashboard.courses || dashboard.totalCourses || 0,
    revenue: dashboard.revenue || dashboard.totalRevenue || 0,
    pending: pendingCourses.length,
  };
  const loading = statsLoading || pendingLoading;

  const chartData = [
    { name: "Jan", revenue: 4000 },
    { name: "Feb", revenue: 8000 },
    { name: "Mar", revenue: 6000 },
    { name: "Apr", revenue: 12000 },
  ];

  const setStatus = async (id, status) => {
    try {
      await updateStatus({ id, status }).unwrap();
      toast.success(status === "approved" ? "Course Approved" : "Course Rejected");
    } catch (err) {
      toast.error(err?.data?.message || "Status update failed");
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      <div className="grid grid-cols-4 gap-4 mb-6">
        <StatCard title="Users" value={stats.users} />
        <StatCard title="Courses" value={stats.courses} />
        <StatCard title="Revenue" value={`Rs ${stats.revenue}`} />
        <StatCard title="Pending" value={stats.pending} />
      </div>

      <div className="bg-white p-4 rounded-xl shadow mb-6">
        <h2 className="mb-3 font-semibold">Revenue Overview</h2>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart data={chartData}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Line type="monotone" dataKey="revenue" />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-xl shadow p-4">
        <h2 className="text-lg font-semibold mb-4">Pending Course Approvals</h2>

        {loading ? (
          <Skeleton />
        ) : pendingCourses.length === 0 ? (
          <p className="text-gray-500">No pending courses</p>
        ) : (
          <table className="w-full">
            <thead>
              <tr className="text-left border-b text-sm">
                <th className="p-2">Course</th>
                <th className="p-2">Instructor</th>
                <th className="p-2">Price</th>
                <th className="p-2">Action</th>
              </tr>
            </thead>

            <tbody>
              {pendingCourses.map((course) => (
                <tr key={course._id} className="border-b hover:bg-gray-50">
                  <td className="p-2 font-medium">{course.title}</td>
                  <td className="p-2 text-sm text-gray-600">
                    {course?.createdBy?.email || "N/A"}
                  </td>
                  <td className="p-2">
                    Rs {course.finalPrice || course.price || 0}
                  </td>
                  <td className="p-2 flex gap-2">
                    <button
                      onClick={() => setStatus(course._id, "approved")}
                      className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => setStatus(course._id, "rejected")}
                      className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                    >
                      Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <div className="bg-white p-4 rounded-xl shadow hover:shadow-md transition">
      <p className="text-gray-500 text-sm">{title}</p>
      <h2 className="text-xl font-bold">{value}</h2>
    </div>
  );
}

function Skeleton() {
  return (
    <div className="animate-pulse space-y-3">
      <div className="h-6 bg-gray-200 rounded" />
      <div className="h-6 bg-gray-200 rounded" />
      <div className="h-6 bg-gray-200 rounded" />
    </div>
  );
}
