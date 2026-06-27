import { useGetMyNotificationsQuery } from "../../../core/api/endpoints/notificationApi";

export default function NotificationList() {
  const { data, isLoading, isError } = useGetMyNotificationsQuery({
    page: 1,
    limit: 20,
  });

  const notifications = data?.data || [];

  if (isLoading) return <div className="p-6">Loading notifications...</div>;
  if (isError) {
    return <div className="p-6 text-red-500">Failed to load notifications.</div>;
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-bold mb-4">Notifications</h1>

      {notifications.length === 0 ? (
        <p className="text-sm text-gray-500">No notifications yet.</p>
      ) : (
        notifications.map((notification) => (
          <div key={notification._id} className="p-3 border rounded mb-2">
            {notification.message}
          </div>
        ))
      )}
    </div>
  );
}
