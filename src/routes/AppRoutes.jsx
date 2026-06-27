import React from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../core/providers/AuthProvider";

import Login from "../features/auth/pages/Login";
import Signup from "../features/auth/pages/Signup";
import VerifyOTP from "../features/auth/pages/VerifyOTP";

import Courses from "../features/course/pages/Courses";
import CourseDetail from "../features/course/pages/CourseDetail";
import CoursePlayer from "../features/course/pages/CoursePlayer";
import CourseRoadmap from "../features/course/pages/CourseRoadmap";

import Dashboard from "../features/student/pages/Dashboard";
import Profile from "../features/student/pages/Profile";
import ProfileView from "../features/student/pages/ProfileView";
import PersonalDetails from "../features/student/pages/PersonalDetails";
import ContactDetails from "../features/student/pages/ContactDetails";
import ChangePassword from "../features/student/pages/ChangePassword";
import MyCourses from "../features/student/pages/MyCourses";
import Billing from "../features/student/pages/Billing";
import Discussion from "../features/student/pages/Discussion";
import LevelUp from "../features/student/pages/LevelUp";
import Wishlist from "../features/student/pages/Wishlist";

import AdminDashboard from "../features/admin/pages/Dashboard";
import ManageUsers from "../features/admin/pages/ManageUsers";
import Notifications from "../features/admin/pages/Notifications";
import Coupons from "../features/admin/pages/Coupons";
import FreeUsers from "../features/admin/pages/FreeUsers";
import Instructors from "../features/admin/pages/Instructors";
import EditCourse from "../features/admin/pages/EditCourse";
import CreateCourseAdmin from "../features/admin/pages/CreateCourse";
import AdminAccess from "../features/admin/pages/AdminAccess";

import AdminLayout from "../design-system/layouts/AdminLayout";
import Navbar from "../design-system/layouts/Navbar";

import InstructorDashboard from "../features/instructor/pages/Dashboard";
import InstructorMyCourses from "../features/instructor/pages/MyCourses";
import UploadVideo from "../features/instructor/pages/UploadVideo";

import Checkout from "../features/payment/pages/Checkout";
import PaymentSuccess from "../features/payment/pages/PaymentSuccess";
import PaymentFailed from "../features/payment/pages/PaymentFailed";

import ProtectedRoute from "./ProtectedRoute";
import { getDefaultAdminPath } from "../constants/adminPages";

const getRedirectPath = (user) => {
  if (!user) return "/login";

  const role = user?.role?.toLowerCase();

  if (role === "admin") return getDefaultAdminPath(user);
  if (role === "instructor") return "/instructor/dashboard";

  return "/courses";
};

const isSafeRedirectPath = (path) =>
  Boolean(path && path.startsWith("/") && !path.startsWith("//"));

const LoginRoute = ({ user }) => {
  const location = useLocation();
  const redirect = new URLSearchParams(location.search).get("redirect");

  if (!user) return <Login />;

  return (
    <Navigate
      to={isSafeRedirectPath(redirect) ? redirect : getRedirectPath(user)}
      replace
    />
  );
};

const InstructorShell = ({ children }) => (
  <>
    <Navbar />
    <main className="pt-16 bg-slate-50 min-h-screen">
      {children}
    </main>
  </>
);

export default function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center text-lg">
        Loading...
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Navigate to={getRedirectPath(user)} replace />} />

      <Route
        path="/login"
        element={<LoginRoute user={user} />}
      />

      <Route
        path="/signup"
        element={!user ? <Signup /> : <Navigate to={getRedirectPath(user)} replace />}
      />

      <Route
        path="/verify-otp"
        element={!user ? <VerifyOTP /> : <Navigate to={getRedirectPath(user)} replace />}
      />

      <Route
        path="/courses"
        element={
          <ProtectedRoute>
            <Courses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/course/:courseId"
        element={
          <ProtectedRoute>
            <CoursePlayer />
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/:courseId/roadmap"
        element={
          <ProtectedRoute>
            <CourseRoadmap />
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/:courseId"
        element={
          <ProtectedRoute>
            <CourseDetail />
          </ProtectedRoute>
        }
      />

      <Route
        path="/courses/:courseId/player"
        element={
          <ProtectedRoute>
            <CoursePlayer />
          </ProtectedRoute>
        }
      />

      <Route
        path="/discussion"
        element={
          <ProtectedRoute>
            <Discussion />
          </ProtectedRoute>
        }
      />

      <Route path="/feed" element={<Navigate to="/discussion" replace />} />

      <Route
        path="/levelup"
        element={
          <ProtectedRoute>
            <LevelUp />
          </ProtectedRoute>
        }
      />

      <Route path="/level-up" element={<Navigate to="/levelup" replace />} />

      <Route
        path="/wishlist"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor"]}>
            <Wishlist />
          </ProtectedRoute>
        }
      />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute allowedRoles={["student"]}>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/my-courses"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor"]}>
            <MyCourses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/view"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor"]}>
            <ProfileView />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/personal"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor"]}>
            <PersonalDetails />
          </ProtectedRoute>
        }
      />

      <Route path="/profile/edit" element={<Navigate to="/profile/personal" replace />} />

      <Route
        path="/profile/contact"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor"]}>
            <ContactDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/account"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor"]}>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="/account/profile" element={<Navigate to="/profile/view" replace />} />
      <Route path="/account/personal" element={<Navigate to="/profile/personal" replace />} />
      <Route path="/account/contact" element={<Navigate to="/profile/contact" replace />} />
      <Route path="/account/password" element={<Navigate to="/profile/password" replace />} />

      <Route
        path="/account/my-courses"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor"]}>
            <MyCourses />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/password"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor"]}>
            <ChangePassword />
          </ProtectedRoute>
        }
      />

      <Route
        path="/billing"
        element={
          <ProtectedRoute allowedRoles={["student", "instructor"]}>
            <Billing />
          </ProtectedRoute>
        }
      />

      <Route path="/purchases" element={<Navigate to="/billing" replace />} />
      <Route path="/account/billing" element={<Navigate to="/billing" replace />} />
      <Route path="/account/purchases" element={<Navigate to="/billing" replace />} />
      <Route path="/profile/billing" element={<Navigate to="/billing" replace />} />
      <Route path="/profile/purchases" element={<Navigate to="/billing" replace />} />

      <Route
        path="/instructor/dashboard"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorShell>
              <InstructorDashboard />
            </InstructorShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor/create-course"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <Navigate to="/instructor/dashboard" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor/add-course"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <Navigate to="/instructor/dashboard" replace />
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor/my-courses"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorShell>
              <InstructorMyCourses />
            </InstructorShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/instructor/upload-video"
        element={
          <ProtectedRoute allowedRoles={["instructor"]}>
            <InstructorShell>
              <UploadVideo />
            </InstructorShell>
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to={getDefaultAdminPath(user)} replace />} />
        <Route
          path="dashboard"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPage="dashboard">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="users"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPage="users">
              <ManageUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="free-users"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPages={["free-users", "users"]}>
              <FreeUsers />
            </ProtectedRoute>
          }
        />
        <Route
          path="admin-access"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPage="admin-access">
              <AdminAccess />
            </ProtectedRoute>
          }
        />
        <Route
          path="instructors"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPage="instructors">
              <Instructors />
            </ProtectedRoute>
          }
        />
        <Route
          path="notifications"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPage="notifications">
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="coupons"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPage="coupons">
              <Coupons />
            </ProtectedRoute>
          }
        />
        <Route
          path="create-course"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPage="create-course">
              <CreateCourseAdmin />
            </ProtectedRoute>
          }
        />
        <Route
          path="courses"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPage="courses">
              <EditCourse />
            </ProtectedRoute>
          }
        />
        <Route
          path="upload-video"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPage="courses">
              <UploadVideo />
            </ProtectedRoute>
          }
        />
        <Route path="courses/edit" element={<Navigate to="/admin/courses" replace />} />
        <Route
          path="discussion"
          element={
            <ProtectedRoute allowedRoles={["admin"]} adminPage="discussion">
              <Discussion embedded />
            </ProtectedRoute>
          }
        />
      </Route>

      <Route
        path="/checkout/:courseId"
        element={
          <ProtectedRoute>
            <Checkout />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/success"
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-success"
        element={
          <ProtectedRoute>
            <PaymentSuccess />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment/failed"
        element={
          <ProtectedRoute>
            <PaymentFailed />
          </ProtectedRoute>
        }
      />

      <Route
        path="/payment-failed"
        element={
          <ProtectedRoute>
            <PaymentFailed />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={getRedirectPath(user)} replace />} />
    </Routes>
  );
}

