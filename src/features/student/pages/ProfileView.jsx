import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CalendarDays,
  Edit3,
  Mail,
  Phone,
  UserRound,
} from "lucide-react";

import Navbar from "../../../design-system/layouts/Navbar";
import { useAuth } from "../../../core/providers/AuthProvider";
import { useGetMeQuery } from "../../../core/api/endpoints/userApi";
import { useGetPaymentMyCoursesQuery } from "../../../core/api/endpoints/paymentApi";

const getInitials = (value = "User") => {
  const parts = String(value || "User").trim().split(/\s+/).slice(0, 2);
  return parts.map((part) => part[0]?.toUpperCase()).join("") || "U";
};

const formatRole = (role) => {
  if (!role) return "Student";
  return `${role.charAt(0).toUpperCase()}${role.slice(1)}`;
};

const formatDate = (value) => {
  if (!value) return "Not added";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not added";
  return date.toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const getCourseList = (payload) => {
  const value = payload?.data;
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  return [];
};

const ProfileAvatar = ({ profile }) => {
  const displayName = profile?.name || "User";

  return (
    <div className="grid h-28 w-28 place-items-center overflow-hidden rounded-[24px] border-4 border-white bg-indigo-100 text-4xl font-black text-indigo-600 shadow-lg">
      {profile?.avatar ? (
        <img
          src={profile.avatar}
          alt={displayName}
          className="h-full w-full object-cover"
        />
      ) : (
        getInitials(displayName)
      )}
    </div>
  );
};

export default function ProfileView() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profileRes, isLoading } = useGetMeQuery(undefined, { skip: !user });
  const { data: coursesRes } = useGetPaymentMyCoursesQuery(undefined, { skip: !user });

  const profile = profileRes?.data || user || {};
  const displayName = profile?.name || "User";
  const courses = useMemo(() => getCourseList(coursesRes), [coursesRes]);
  const badges = [
    formatRole(profile?.role),
    courses.length > 0 ? `${courses.length} active courses` : null,
    profile?.isFreeAccess ? "Free Access" : null,
  ].filter(Boolean);

  const details = [
    { label: "Email", value: profile?.email || "Not added", Icon: Mail },
    { label: "Phone", value: profile?.phone || "Not added", Icon: Phone },
    { label: "Birthday", value: formatDate(profile?.birthday), Icon: CalendarDays },
    { label: "Gender", value: profile?.gender || "Not added", Icon: UserRound },
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-14 pt-24 md:px-6">
        <div className="mb-6 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-indigo-600"
          >
            <ArrowLeft size={18} />
            Back
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile/personal")}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-5 py-3 text-sm font-black text-white shadow-sm transition hover:bg-indigo-700"
          >
            <Edit3 size={17} />
            Edit
          </button>
        </div>

        {isLoading ? (
          <section className="rounded-xl border border-slate-200 bg-white p-12 text-center text-slate-500 shadow-sm">
            Loading profile...
          </section>
        ) : (
          <>
            <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
              <div className="h-40 bg-indigo-600" />
              <div className="-mt-16 px-6 pb-8 text-center">
                <div className="mx-auto flex justify-center">
                  <ProfileAvatar profile={profile} />
                </div>
                <h1 className="mt-5 text-3xl font-black text-slate-950">
                  {displayName}
                </h1>
                <p className="mt-2 text-base font-medium text-slate-500">
                  {profile?.bio || "No bio added"}
                </p>

                <div className="mt-5 flex flex-wrap justify-center gap-2">
                  {badges.map((badge) => (
                    <span
                      key={badge}
                      className="rounded-full bg-slate-100 px-4 py-1.5 text-sm font-bold text-slate-700"
                    >
                      {badge}
                    </span>
                  ))}
                </div>
              </div>
            </section>

            <section className="mt-8 rounded-xl border border-slate-200 bg-white p-7 shadow-sm">
              <h2 className="text-xl font-black text-slate-950">About Me</h2>
              <p className="mt-5 text-lg font-medium leading-8 text-slate-600">
                {profile?.bio || "No bio added"}
              </p>
            </section>

            <section className="mt-8 grid gap-5 md:grid-cols-2">
              {details.map((detail) => {
                const IconComponent = detail.Icon;

                return (
                  <div
                    key={detail.label}
                    className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
                  >
                    <div className="mb-3 flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                      <IconComponent size={16} />
                      {detail.label}
                    </div>
                    <p className="break-words text-xl font-black text-slate-900">
                      {detail.value}
                    </p>
                  </div>
                );
              })}
            </section>
          </>
        )}
      </main>
    </div>
  );
}
