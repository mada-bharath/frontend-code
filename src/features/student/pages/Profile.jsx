import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  ChevronRight,
  Edit3,
  Eye,
  Mail,
  Phone,
} from "lucide-react";

import Navbar from "../../../design-system/layouts/Navbar";
import { useAuth } from "../../../core/providers/AuthProvider";
import { useGetMeQuery } from "../../../core/api/endpoints/userApi";
import { useGetPaymentMyCoursesQuery } from "../../../core/api/endpoints/paymentApi";
import AccountTabs from "../components/AccountTabs";

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

const getActiveCourseCount = (courses) =>
  courses.filter((course) => course?.isActive !== false && !course?.isExpired).length;

function ProfileAvatar({ profile }) {
  const displayName = profile?.name || "User";
  const role = formatRole(profile?.role);

  return (
    <div className="relative h-[122px] w-[122px] shrink-0">
      <div className="grid h-full w-full place-items-center overflow-hidden rounded-[18px] bg-[#e6e8ec] text-4xl font-black tracking-tight text-[#0d1630]">
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
      <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 rounded-full bg-[#0d1630] px-3 py-1 text-[10px] font-black uppercase tracking-wide text-white shadow-sm">
        {role}
      </span>
    </div>
  );
}

function InfoItem({ label, value }) {
  const isMissing = !value || value === "Not added";

  return (
    <div>
      <p className="text-[13px] font-black uppercase tracking-widest text-[#65718a]">
        {label}
      </p>
      <p
        className={`mt-2 text-base font-bold ${
          isMissing ? "italic text-[#65718a]" : "text-black"
        }`}
      >
        {value || "Not added"}
      </p>
    </div>
  );
}

export default function Profile() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profileRes, isLoading } = useGetMeQuery(undefined, { skip: !user });
  const { data: coursesRes } = useGetPaymentMyCoursesQuery(undefined, { skip: !user });

  const profile = profileRes?.data || user || {};
  const displayName = profile?.name || "User";
  const courses = useMemo(() => getCourseList(coursesRes), [coursesRes]);
  const activeCourses = getActiveCourseCount(courses);
  const memberSince = formatDate(profile?.createdAt);
  const bio =
    profile?.bio ||
    "No bio added yet. Tell others a little about yourself - what you're learning, your goals, and your interests.";

  return (
    <div className="min-h-screen bg-white text-black">
      <Navbar />

      <main className="mx-auto max-w-[1340px] px-5 pb-12 pt-28 sm:px-8 lg:px-10">
        {isLoading ? (
          <section className="rounded-[18px] border border-[#dbe3ef] bg-white p-12 text-center text-[#65718a]">
            Loading profile...
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-7">
              <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
                  <ProfileAvatar profile={profile} />
                  <div>
                    <h1 className="text-[34px] font-black leading-tight tracking-normal text-black sm:text-[38px]">
                      {displayName}
                    </h1>
                    <p className="mt-2 text-base font-medium text-[#53617d]">
                      {profile?.email || "Email not added"}
                    </p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => navigate("/profile/view")}
                    className="inline-flex h-12 items-center gap-2 rounded-[10px] border border-[#dbe3ef] bg-[#f8fafc] px-5 text-base font-black text-[#0d1630] transition hover:border-[#0d1630]"
                  >
                    <Eye size={18} />
                    Public Profile
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate("/profile/personal")}
                    className="inline-flex h-12 items-center gap-2 rounded-[10px] bg-[#0d1630] px-5 text-base font-black text-white transition hover:bg-black"
                  >
                    <Edit3 size={18} />
                    Edit Details
                  </button>
                </div>
              </div>

              <AccountTabs />
            </section>

            <section className="mt-10 rounded-[18px] border border-[#dbe3ef] bg-white px-7 py-8">
              <h2 className="text-[22px] font-black text-black">About</h2>
              <p className="mt-6 text-xl font-medium leading-8 text-[#53617d]">
                {bio}
              </p>
            </section>

            <section className="mt-7 rounded-[18px] border border-[#dbe3ef] bg-white px-7 py-8">
              <h2 className="text-[22px] font-black text-black">Personal Details</h2>
              <div className="mt-9 grid gap-x-16 gap-y-8 sm:grid-cols-2">
                <InfoItem label="Full Name" value={displayName} />
                <InfoItem
                  label="Birthday"
                  value={formatDate(profile?.birthday || profile?.dateOfBirth)}
                />
                <InfoItem label="Gender" value={profile?.gender || "Not added"} />
                <InfoItem label="Language" value={profile?.language || "English"} />
              </div>
            </section>

            <section className="mt-7 rounded-[18px] bg-[#0d1630] px-7 py-8 text-white">
              <p className="text-sm font-black uppercase tracking-[0.18em] text-white/60">
                Learning Progress
              </p>
              <div className="mt-8 grid gap-7 md:grid-cols-2">
                <div>
                  <p className="text-[30px] font-black leading-none">{activeCourses}</p>
                  <p className="mt-2 text-base font-medium text-white/75">
                    Active Courses
                  </p>
                </div>
                <div className="border-t border-white/15 pt-7 md:border-l md:border-t-0 md:pl-10 md:pt-0">
                  <p className="text-[30px] font-black leading-none">{memberSince}</p>
                  <p className="mt-2 text-base font-medium text-white/75">
                    Member Since
                  </p>
                </div>
              </div>
            </section>

            <section className="mt-7 rounded-[18px] border border-[#dbe3ef] bg-white px-7 py-8">
              <h2 className="text-[22px] font-black text-black">Contact Info</h2>
              <div className="mt-7 space-y-5">
                <div className="flex items-center gap-4 text-base font-medium text-black">
                  <Mail size={20} className="text-[#65718a]" />
                  <span>{profile?.email || "Not added"}</span>
                </div>
                <div className="flex items-center gap-4 text-base font-medium text-black">
                  <Phone size={20} className="text-[#65718a]" />
                  <span>{profile?.phone || "Not added"}</span>
                </div>
              </div>
            </section>

            <button
              type="button"
              onClick={() => navigate("/profile/password")}
              className="mt-7 flex h-[68px] w-full items-center justify-between rounded-[14px] border border-[#dbe3ef] bg-[#f3f6fa] px-6 text-left text-base font-black text-black transition hover:border-[#0d1630] hover:bg-white"
            >
              Change Password
              <ChevronRight size={20} className="text-[#53617d]" />
            </button>
          </>
        )}
      </main>
    </div>
  );
}
