import { useState } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, Mail, Phone, Save } from "lucide-react";

import Navbar from "../../../design-system/layouts/Navbar";
import { useAuth } from "../../../core/providers/AuthProvider";
import {
  useGetMeQuery,
  useUpdateMeMutation,
} from "../../../core/api/endpoints/userApi";
import AccountTabs from "../components/AccountTabs";

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-5 py-4 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10";

const buildContactForm = (profile = {}) => ({
  email: profile?.email || "",
  phone: profile?.phone || "",
});

export default function ContactDetails() {
  const navigate = useNavigate();
  const { user, setUser, refreshUser } = useAuth();
  const { data: profileRes, isLoading } = useGetMeQuery(undefined, { skip: !user });
  const [updateMe, { isLoading: isSaving }] = useUpdateMeMutation();

  const profile = profileRes?.data || user || {};
  const initialForm = buildContactForm(profile);

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
        email: form.email,
        phone: form.phone,
      }).unwrap();

      await syncUser(response?.data);
      toast.success("Contact details updated");
      navigate("/profile");
    } catch (error) {
      toast.error(error?.data?.message || "Could not update contact details");
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
            Keep your contact details connected to your account.
          </p>
        </div>

        <AccountTabs />

        <section className="mt-8 rounded-xl border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="mb-8">
            <h2 className="text-2xl font-black text-slate-950">
              Update contact details
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Keep your account email and phone number current.
            </p>
          </div>

          {isLoading ? (
            <div className="py-16 text-center text-slate-500">
              Loading contact details...
            </div>
          ) : (
            <ContactForm
              key={[profile?._id, profile?.email, profile?.phone].join("|")}
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

function ContactForm({ initialForm, isSaving, onCancel, onSave }) {
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
        <Field
          label="Email Address"
          icon={<Mail size={17} className="text-indigo-600" />}
        >
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            required
            className={INPUT_CLASS}
          />
        </Field>

        <Field
          label="Phone Number"
          icon={<Phone size={17} className="text-indigo-600" />}
        >
          <input
            type="tel"
            name="phone"
            value={form.phone}
            onChange={handleChange}
            className={INPUT_CLASS}
          />
        </Field>
      </div>

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
          {isSaving ? "Saving..." : "Save Contact Details"}
        </button>
      </div>
    </form>
  );
}

function Field({ label, icon, children }) {
  return (
    <label className="block">
      <span className="mb-3 flex items-center gap-2 text-sm font-black text-slate-800">
        {icon}
        {label}
      </span>
      {children}
    </label>
  );
}
