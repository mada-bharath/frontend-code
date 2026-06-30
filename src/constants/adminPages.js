export const ADMIN_PAGE_KEYS = {
  DASHBOARD: "dashboard",
  USERS: "users",
  FREE_USERS: "free-users",
  ADMIN_ACCESS: "admin-access",
  SITE_SETTINGS: "site-settings",
  INSTRUCTORS: "instructors",
  CREATE_COURSE: "create-course",
  COURSES: "courses",
  DISCUSSION: "discussion",
  COUPONS: "coupons",
  NOTIFICATIONS: "notifications",
};

export const ADMIN_PAGES = [
  {
    key: ADMIN_PAGE_KEYS.DASHBOARD,
    label: "Dashboard",
    path: "/admin/dashboard",
    description: "Stats and course approvals",
  },
  {
    key: ADMIN_PAGE_KEYS.USERS,
    label: "Users",
    path: "/admin/users",
    description: "User roles and student access",
  },
  {
    key: ADMIN_PAGE_KEYS.FREE_USERS,
    label: "Free Users",
    path: "/admin/free-users",
    description: "Complimentary access users",
  },
  {
    key: ADMIN_PAGE_KEYS.ADMIN_ACCESS,
    label: "Admin Access",
    path: "/admin/admin-access",
    description: "Admin page permissions",
  },
  {
    key: ADMIN_PAGE_KEYS.SITE_SETTINGS,
    label: "Site Settings",
    path: "/admin/site-settings",
    description: "Footer, contact, and legal policies",
  },
  {
    key: ADMIN_PAGE_KEYS.INSTRUCTORS,
    label: "Instructors",
    path: "/admin/instructors",
    description: "Instructor approvals and assignments",
  },
  {
    key: ADMIN_PAGE_KEYS.CREATE_COURSE,
    label: "Create Course",
    path: "/admin/create-course",
    description: "Add new courses",
  },
  {
    key: ADMIN_PAGE_KEYS.COURSES,
    label: "Edit Courses",
    path: "/admin/courses",
    description: "Edit and manage courses",
  },
  {
    key: ADMIN_PAGE_KEYS.DISCUSSION,
    label: "Discussion",
    path: "/admin/discussion",
    description: "Community discussion page",
  },
  {
    key: ADMIN_PAGE_KEYS.COUPONS,
    label: "Coupons",
    path: "/admin/coupons",
    description: "Coupon management",
  },
  {
    key: ADMIN_PAGE_KEYS.NOTIFICATIONS,
    label: "Notifications",
    path: "/admin/notifications",
    description: "Broadcast notifications",
  },
];

export const ADMIN_PAGE_KEY_SET = new Set(ADMIN_PAGES.map((page) => page.key));

export const normalizeAdminAccess = (adminAccess) => ({
  managed: Boolean(adminAccess?.managed),
  fullAccess: Boolean(adminAccess?.fullAccess),
  pages: Array.isArray(adminAccess?.pages) ? adminAccess.pages : [],
});

export const canAccessAdminPage = (user, pageKey) => {
  if (!user || user.role !== "admin") return false;
  if (!ADMIN_PAGE_KEY_SET.has(pageKey)) return false;

  const access = normalizeAdminAccess(user.adminAccess);

  if (!access.managed) return true;
  if (access.fullAccess) return true;

  return access.pages.includes(pageKey);
};

export const canAccessAnyAdminPage = (user, pageKeys = []) =>
  pageKeys.some((pageKey) => canAccessAdminPage(user, pageKey));

export const getAccessibleAdminPages = (user) =>
  ADMIN_PAGES.filter((page) => canAccessAdminPage(user, page.key));

export const getDefaultAdminPath = (user) =>
  getAccessibleAdminPages(user)[0]?.path || "/courses";
