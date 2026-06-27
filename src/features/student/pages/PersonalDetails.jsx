import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Save } from "lucide-react";

import Navbar from "../../../design-system/layouts/Navbar";
import { useAuth } from "../../../core/providers/AuthProvider";
import {
  useGetMeQuery,
  useUpdateMeMutation,
} from "../../../core/api/endpoints/userApi";
import AccountTabs from "../components/AccountTabs";

const toDateInput = (value) => {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 10);
};

const buildFormFromProfile = (profile = {}) => ({
  name: profile?.name || "",
  email: profile?.email || "",
  phone: profile?.phone || "",
  bio: profile?.bio || "",
  gender: profile?.gender || "",
  birthday: toDateInput(profile?.birthday),
});

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-5 py-4 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10";
const TEXTAREA_CLASS = `${INPUT_CLASS} min-h-36 resize-none leading-7`;

export default function PersonalDetails() {
  const navigate = useNavigate();
  const { user, setUser, refreshUser } = useAuth();
  const { data: profileRes, isLoading } = useGetMeQuery(undefined, { skip: !user });
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();

  const profile = profileRes?.data || user || {};
  const initialForm = buildFormFromProfile(profile);

  const syncUser = async (updatedUser) => {
    if (updatedUser) {
      const nextUser = {
        ...(user || {}),
        ...updatedUser,
        role: (updatedUser.role || user?.role || "student").toLowerCase(),
      };
      localStorage.setItem("user", JSON.stringify(nextUser));
      setUser(nextUser);
    }

    await refreshUser?.();
  };

  const handleSave = async (form) => {
    try {
      const response = await updateMe({
        name: form.name,
        email: form.email,
        phone: form.phone,
        bio: form.bio,
        gender: form.gender,
        birthday: form.birthday || null,
      }).unwrap();

      await syncUser(response?.data);
      toast.success("Profile updated");
      navigate("/profile");
    } catch (error) {
      toast.error(error?.data?.message || "Could not update profile");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-5xl px-4 pb-14 pt-24 md:px-6">
        <button
          type="button"
          onClick={() => navigate("/profile")}
          className="mb-6 inline-flex items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-indigo-600"
        >
          <ArrowLeft size={18} />
          Back
        </button>

        <div className="mb-6 flex flex-col gap-2">
          <h1 className="text-4xl font-black tracking-tight text-slate-950">
            My Account
          </h1>
          <p className="text-sm font-bold text-slate-500">
            Keep your profile details connected to your account.
          </p>
        </div>

        <AccountTabs />

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          {isLoading ? (
            <div className="py-16 text-center text-slate-500">Loading profile...</div>
          ) : (
            <ProfileDetailsForm
              key={[
                profile?._id,
                profile?.name,
                profile?.email,
                profile?.phone,
                profile?.bio,
                profile?.gender,
                profile?.birthday,
              ].join("|")}
              initialForm={initialForm}
              isSaving={isSaving}
              onCancel={() => navigate("/profile")}
              onSave={handleSave}
            />
          )}
        </section>
      </main>
    </div>
  );
}

function ProfileDetailsForm({ initialForm, isSaving, onCancel, onSave }) {
  const [form, setForm] = useState(initialForm);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    onSave(form);
  };

  return (
    <form onSubmit={handleSubmit}>
      <div className="grid gap-7 md:grid-cols-2">
        <Field label="Display Name">
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            minLength={2}
            required
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Email Address">
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Phone Number">
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Birthday">
          <input
            type="date"
            name="birthday"
            value={form.birthday}
            onChange={handleChange}
            className={INPUT_CLASS}
          />
        </Field>

        <Field label="Gender">
          <select
            name="gender"
            value={form.gender}
            onChange={handleChange}
            className={INPUT_CLASS}
          >
            <option value="">Not added</option>
            <option value="male">Male</option>
            <option value="female">Female</option>
            <option value="other">Other</option>
          </select>
        </Field>
      </div>

      <Field label="Bio Description" className="mt-7">
        <textarea
          name="bio"
          value={form.bio}
          onChange={handleChange}
          rows={5}
          className={TEXTAREA_CLASS}
        />
      </Field>

      <div className="mt-9 flex flex-col justify-end gap-3 sm:flex-row">
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg bg-slate-100 px-8 py-4 text-base font-black text-slate-700 transition hover:bg-slate-200"
        >
          Discard Changes
        </button>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 text-base font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
        >
          <Save size={19} />
          {isSaving ? "Saving..." : "Save Profile Changes"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <label className={`block ${className}`}>
      <span className="mb-3 block text-sm font-black text-slate-800">{label}</span>
      {children}
    </label>
  );
}
