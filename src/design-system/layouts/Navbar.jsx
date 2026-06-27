import { createElement, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import {
  Bell,
  BookOpen,
  Box,
  Heart,
  LogOut,
  MessageSquare,
  Newspaper,
  PlayCircle,
  ShieldCheck,
  Trash2,
  User,
} from "lucide-react";
import { useAuth } from "../../core/providers/AuthProvider";
import {
  useDeleteNotificationMutation,
  useGetMyNotificationsQuery,
  useGetUnreadCountQuery,
} from "../../core/api/endpoints/notificationApi";

const getInitials = (value = "") => {
  const parts = String(value || "User")
    .trim()
    .split(/\s+/)
    .slice(0, 2);

  return parts.map((part) => part[0]?.toUpperCase()).join("") || "U";
};

const formatRole = (role) => {
  if (!role) return "Learner";
  return `${role[0].toUpperCase()}${role.slice(1)}`;
};

export default function Navbar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const [profileOpen, setProfileOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [notificationSwipe, setNotificationSwipe] = useState({
    id: null,
    startX: 0,
    deltaX: 0,
  });
  const [deleteNotification, { isLoading: isDeletingNotification }] =
    useDeleteNotificationMutation();

  const isActiveInstructor =
    user?.role === "instructor" && user?.isInstructorActive === true;
  const { data: notificationsRes } = useGetMyNotificationsQuery(
    { page: 1, limit: 6 },
    { skip: !user || !notificationOpen }
  );
  const { data: unreadRes } = useGetUnreadCountQuery(undefined, {
    skip: !user,
    pollingInterval: 60000,
  });
  const notifications = notificationsRes?.data || [];
  const count = Number(unreadRes?.count || unreadRes?.data?.count || 0);

  const navItems = useMemo(() => {
    const items = [
      { label: "Discussion", path: "/discussion", icon: MessageSquare },
      { label: "Courses", path: "/courses", icon: BookOpen },
      { label: "My Courses", path: "/my-courses", icon: PlayCircle },
    ];

    if (isActiveInstructor) {
      items.push({
        label: "Upload Course",
        path: "/instructor/my-courses",
        icon: PlayCircle,
      });
    }

    if (user?.role === "admin") {
      return [
        { label: "Admin", path: "/admin/dashboard", icon: ShieldCheck },
        { label: "Courses", path: "/courses", icon: BookOpen },
        { label: "Discussion", path: "/discussion", icon: MessageSquare },
      ];
    }

    return items;
  }, [isActiveInstructor, user?.role]);

  const mobileItems = useMemo(
    () => [
      { label: "Discussion", path: "/discussion", icon: MessageSquare },
      { label: "Courses", path: "/courses", icon: BookOpen },
      {
        label: isActiveInstructor ? "Upload" : "Learning",
        path: isActiveInstructor ? "/instructor/my-courses" : "/my-courses",
        icon: PlayCircle,
      },
      { label: "Profile", path: "/profile", icon: User },
    ],
    [isActiveInstructor]
  );

  const isActive = (path) => {
    if (path === "/courses") {
      return location.pathname === "/courses" || location.pathname.startsWith("/course/");
    }

    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const handleNavigate = (path) => {
    setProfileOpen(false);
    setNotificationOpen(false);
    if (location.pathname !== path) navigate(path);
  };

  const handleDeleteNotification = async (id) => {
    if (!id || isDeletingNotification) return;

    try {
      await deleteNotification(id).unwrap();
    } catch (error) {
      console.error("Failed to delete notification", error);
    }
  };

  const handleNotificationSwipeStart = (event, id) => {
    if (!id || event.button > 0) return;

    setNotificationSwipe({
      id,
      startX: event.clientX,
      deltaX: 0,
    });
  };

  const handleNotificationSwipeMove = (event, id) => {
    if (notificationSwipe.id !== id) return;

    const deltaX = event.clientX - notificationSwipe.startX;
    setNotificationSwipe((prev) => ({
      ...prev,
      deltaX: Math.max(-120, Math.min(120, deltaX)),
    }));
  };

  const handleNotificationSwipeEnd = (id) => {
    if (notificationSwipe.id !== id) return;

    const shouldDelete = Math.abs(notificationSwipe.deltaX) >= 80;
    setNotificationSwipe({ id: null, startX: 0, deltaX: 0 });

    if (shouldDelete) {
      handleDeleteNotification(id);
    }
  };

  const userName = user?.name || user?.email || "Learner";

  return (
    <>
      <header className="fixed left-0 top-0 z-50 w-full border-b border-slate-200 bg-white">
        <div className="flex h-20 items-center justify-between px-5">
          <button
            type="button"
            onClick={() => handleNavigate("/courses")}
            className="flex shrink-0 items-center gap-2.5 text-left"
          >
            <span className="relative h-8 w-8" aria-hidden="true">
              <span className="absolute left-1 top-3.5 h-3 w-3 rotate-45 rounded-[3px] bg-blue-600" />
              <span className="absolute left-3 top-1 h-3 w-3 rotate-45 rounded-[3px] bg-blue-600" />
              <span className="absolute left-3 top-5 h-3 w-3 rotate-45 rounded-[3px] bg-blue-600" />
            </span>
            <span className="text-[21px] font-bold uppercase tracking-tight text-slate-950">
              Bharath Vidya
            </span>
          </button>

          <nav className="absolute left-1/2 hidden -translate-x-1/2 items-stretch gap-6 lg:flex">
            {navItems.map(({ label, path, icon }) => {
              const active = isActive(path);

              return (
                <button
                  type="button"
                  key={`${label}-${path}`}
                  onClick={() => handleNavigate(path)}
                  className={`relative flex h-20 min-w-[104px] flex-col items-center justify-center gap-1.5 px-2 text-[13px] font-bold uppercase tracking-[0.18em] transition ${
                    active ? "text-blue-600" : "text-slate-700 hover:text-slate-950"
                  }`}
                >
                  {createElement(icon, {
                    size: 27,
                    strokeWidth: active ? 2.8 : 2.3,
                    className: active ? "" : "text-slate-600",
                  })}
                  <span>{label}</span>
                  <span
                    className={`absolute bottom-0 h-1 w-[120px] rounded-t-full bg-blue-600 transition ${
                      active ? "opacity-100" : "opacity-0"
                    }`}
                  />
                </button>
              );
            })}
          </nav>

          <div className="flex shrink-0 items-center gap-3">
            {user && (
              <div className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    const nextOpen = !notificationOpen;
                    setNotificationOpen(nextOpen);
                    setProfileOpen(false);
                  }}
                    className="relative grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-slate-200"
                    title="Notifications"
                  >
                  <Bell size={21} />
                  {count > 0 && (
                    <span className="absolute right-2.5 top-2.5 h-2.5 w-2.5 rounded-full border-2 border-white bg-red-500" />
                  )}
                </button>

                {notificationOpen && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="absolute right-0 top-14 w-80 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl"
                  >
                    <div className="border-b border-slate-100 px-5 py-4">
                      <p className="text-base font-black text-slate-950">Notifications</p>
                      <p className="text-sm text-slate-500">
                        {count > 0 ? `${count} unread updates` : "No unread updates"}
                      </p>
                    </div>

                    <div className="max-h-80 overflow-y-auto p-2">
                      {notifications.length === 0 ? (
                        <p className="rounded-lg px-4 py-8 text-center text-sm font-medium text-slate-500">
                          Nothing new right now.
                        </p>
                      ) : (
                        notifications.slice(0, 6).map((notification) => {
                          const swipeActive =
                            notificationSwipe.id === notification._id;
                          const translateX = swipeActive
                            ? notificationSwipe.deltaX
                            : 0;

                          return (
                            <div
                              key={notification._id}
                              className="relative overflow-hidden rounded-lg bg-red-50"
                            >
                              <div className="absolute inset-y-0 right-4 flex items-center text-[11px] font-black uppercase tracking-widest text-red-500">
                                Release to delete
                              </div>
                              <div
                                onPointerDown={(event) =>
                                  handleNotificationSwipeStart(event, notification._id)
                                }
                                onPointerMove={(event) =>
                                  handleNotificationSwipeMove(event, notification._id)
                                }
                                onPointerUp={() =>
                                  handleNotificationSwipeEnd(notification._id)
                                }
                                onPointerCancel={() =>
                                  setNotificationSwipe({ id: null, startX: 0, deltaX: 0 })
                                }
                                style={{
                                  transform: `translateX(${translateX}px)`,
                                  touchAction: "pan-y",
                                }}
                                className="relative flex gap-3 rounded-lg bg-white px-4 py-3 transition hover:bg-slate-50"
                              >
                                <div className="min-w-0 flex-1">
                                  <p className="text-sm font-bold text-slate-950">
                                    {notification.title}
                                  </p>
                                  <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                                    {notification.message}
                                  </p>
                                </div>
                                <button
                                  type="button"
                                  onClick={(event) => {
                                    event.stopPropagation();
                                    handleDeleteNotification(notification._id);
                                  }}
                                  disabled={isDeletingNotification}
                                  className="grid h-8 w-8 shrink-0 place-items-center rounded-full text-slate-400 transition hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-50"
                                  title="Delete notification"
                                  aria-label="Delete notification"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {user ? (
              <div className="relative">
                <button
                  type="button"
                  onClick={(event) => {
                    event.stopPropagation();
                    setProfileOpen((prev) => !prev);
                    setNotificationOpen(false);
                  }}
                  className="grid h-11 w-11 place-items-center rounded-full border border-slate-200 bg-white text-slate-700 shadow-sm transition hover:border-slate-300"
                  title="Profile"
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-200 text-sm font-black">
                    {getInitials(userName)}
                  </span>
                </button>

                {profileOpen && (
                  <div
                    onClick={(event) => event.stopPropagation()}
                    className="absolute right-0 top-14 w-80 max-w-[calc(100vw-24px)] rounded-lg border border-slate-200 bg-white p-3 shadow-xl"
                  >
                    <div className="flex items-center gap-3 px-2 py-2">
                      <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-200 text-base font-black text-slate-700">
                        {getInitials(userName)}
                      </span>
                      <div className="min-w-0">
                        <p className="truncate text-base font-black text-slate-950">
                          {userName}
                        </p>
                        <p className="text-xs font-medium text-slate-500">{formatRole(user?.role)}</p>
                      </div>
                    </div>

                    <div className="mt-3 space-y-1.5">
                      <button
                        type="button"
                        onClick={() => handleNavigate("/profile")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-semibold text-slate-800 transition hover:bg-slate-50"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600">
                          <Newspaper size={19} />
                        </span>
                        My account
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavigate("/levelup")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-semibold text-slate-800 transition hover:bg-slate-50"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600">
                          <Box size={19} />
                        </span>
                        Level Up
                      </button>

                      <button
                        type="button"
                        onClick={() => handleNavigate("/wishlist")}
                        className="flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left text-base font-semibold text-slate-800 transition hover:bg-slate-50"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-slate-100 text-slate-600">
                          <Heart size={19} />
                        </span>
                        Wishlist
                      </button>

                      <button
                        type="button"
                        onClick={logout}
                        className="flex w-full items-center gap-3 rounded-lg bg-red-50 px-3 py-3 text-left text-base font-semibold text-red-600 transition hover:bg-red-100"
                      >
                        <span className="grid h-9 w-9 place-items-center rounded-full bg-red-100 text-red-600">
                          <LogOut size={19} />
                        </span>
                        Logout
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                type="button"
                onClick={() => handleNavigate("/login")}
                className="rounded-lg bg-black px-5 py-3 text-sm font-black text-white transition hover:bg-blue-600"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {user && (
        <nav className="fixed bottom-4 left-1/2 z-50 grid w-[92%] max-w-md -translate-x-1/2 grid-cols-4 rounded-xl border border-slate-200 bg-white p-1 shadow-xl lg:hidden">
          {mobileItems.map(({ label, path, icon }) => {
            const active = isActive(path);

            return (
              <button
                type="button"
                key={path}
                onClick={() => handleNavigate(path)}
                className={`flex h-14 flex-col items-center justify-center gap-1 rounded-lg text-[11px] font-bold ${
                  active ? "bg-blue-50 text-blue-600" : "text-slate-500"
                }`}
              >
                {createElement(icon, { size: 18 })}
                {label}
              </button>
            );
          })}
        </nav>
      )}
    </>
  );
}
