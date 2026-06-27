import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  Bell,
  BookOpen,
  Gift,
  MessageSquare,
  Ticket,
  GraduationCap,
  PlusCircle,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../core/providers/AuthProvider";
import { canAccessAdminPage } from "../../constants/adminPages";

export default function Sidebar() {
  const { user } = useAuth();

  const linkClass =
    "flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200";

  const activeClass =
    "bg-white text-black font-semibold shadow";

  const inactiveClass =
    "text-gray-300 hover:bg-gray-800 hover:text-white";

  const menuItems = [
    {
      name: "Dashboard",
      path: "/admin/dashboard",
      key: "dashboard",
      icon: <LayoutDashboard size={18} />,
    },
    {
      name: "Users",
      path: "/admin/users",
      key: "users",
      icon: <Users size={18} />,
    },
    {
      name: "Free Users",
      path: "/admin/free-users",
      key: "free-users",
      icon: <Gift size={18} />,
    },
    {
      name: "Admin Access",
      path: "/admin/admin-access",
      key: "admin-access",
      icon: <ShieldCheck size={18} />,
    },
    {
      name: "Create Course",
      path: "/admin/create-course",
      key: "create-course",
      icon: <PlusCircle size={18} />,
    },
    {
      name: "Courses",
      path: "/admin/courses",
      key: "courses",
      icon: <BookOpen size={18} />,
    },
    {
      name: "Discussion",
      path: "/admin/discussion",
      key: "discussion",
      icon: <MessageSquare size={18} />,
    },
    {
      name: "Coupons",
      path: "/admin/coupons",
      key: "coupons",
      icon: <Ticket size={18} />,
    },
    {
      name: "Instructors",
      path: "/admin/instructors",
      key: "instructors",
      icon: <GraduationCap size={18} />,
    },
    {
      name: "Notifications",
      path: "/admin/notifications",
      key: "notifications",
      icon: <Bell size={18} />,
    },
  ];

  const visibleMenuItems = menuItems.filter((item) =>
    canAccessAdminPage(user, item.key)
  );

  return (
    <div className="w-64 h-screen bg-black text-white fixed p-6 shadow-xl flex flex-col">
      <h1 className="text-2xl font-bold mb-10 tracking-wide">
        BV Admin
      </h1>

      <nav className="flex flex-col gap-3">
        {visibleMenuItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              `${linkClass} ${
                isActive ? activeClass : inactiveClass
              }`
            }
          >
            {item.icon}
            {item.name}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto text-sm text-gray-400 pt-6">
        (c) 2026 BharathVidya
      </div>
    </div>
  );
}
