import { useState } from "react";
import toast from "react-hot-toast";
import { ArrowLeft, Eye, EyeOff, KeyRound, Save } from "lucide-react";
import { useNavigate } from "react-router-dom";

import Navbar from "../../../design-system/layouts/Navbar";
import { useChangePasswordMutation } from "../../../core/api/endpoints/userApi";
import AccountTabs from "../components/AccountTabs";

const initialForm = {
  currentPassword: "",
  newPassword: "",
  confirmPassword: "",
};

const INPUT_CLASS =
  "w-full rounded-lg border border-slate-200 bg-white px-5 py-4 pr-12 text-base font-medium text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:ring-4 focus:ring-indigo-500/10";

export default function ChangePassword() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [visible, setVisible] = useState({});
  const [changePassword, { isLoading }] = useChangePasswordMutation();

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const toggleVisible = (name) => {
    setVisible((prev) => ({ ...prev, [name]: !prev[name] }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (form.newPassword.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }

    if (form.newPassword !== form.confirmPassword) {
      toast.error("New password and confirmation do not match");
      return;
    }

    try {
      await changePassword({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword,
      }).unwrap();

      setForm(initialForm);
      setVisible({});
      toast.success("Password changed");
    } catch (error) {
      toast.error(error?.data?.message || "Could not change password");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <main className="mx-auto max-w-[1340px] px-5 pb-14 pt-28 sm:px-8 lg:px-10">
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
            Update your login password.
          </p>
        </div>

        <AccountTabs />

        <section className="mt-8 rounded-[18px] border border-slate-200 bg-white p-6 shadow-sm md:p-10">
          <div className="mb-8 flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
              <KeyRound size={22} />
            </span>
            <div>
              <h2 className="text-2xl font-black text-slate-950">
                Change Password
              </h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                Your current password is required.
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-7">
            <PasswordField
              label="Current Password"
              name="currentPassword"
              value={form.currentPassword}
              visible={Boolean(visible.currentPassword)}
              onChange={handleChange}
              onToggle={() => toggleVisible("currentPassword")}
              autoComplete="current-password"
            />

            <div className="grid gap-7 md:grid-cols-2">
              <PasswordField
                label="New Password"
                name="newPassword"
                value={form.newPassword}
                visible={Boolean(visible.newPassword)}
                onChange={handleChange}
                onToggle={() => toggleVisible("newPassword")}
                autoComplete="new-password"
              />

              <PasswordField
                label="Confirm New Password"
                name="confirmPassword"
                value={form.confirmPassword}
                visible={Boolean(visible.confirmPassword)}
                onChange={handleChange}
                onToggle={() => toggleVisible("confirmPassword")}
                autoComplete="new-password"
              />
            </div>

            <div className="flex flex-col justify-end gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => setForm(initialForm)}
                className="rounded-lg bg-slate-100 px-8 py-4 text-base font-black text-slate-700 transition hover:bg-slate-200"
              >
                Clear
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 px-8 py-4 text-base font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:opacity-60"
              >
                <Save size={19} />
                {isLoading ? "Saving..." : "Save Password"}
              </button>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

function PasswordField({
  label,
  name,
  value,
  visible,
  onChange,
  onToggle,
  autoComplete,
}) {
  const ToggleIcon = visible ? EyeOff : Eye;

  return (
    <label className="block">
      <span className="mb-3 block text-sm font-black text-slate-800">{label}</span>
      <span className="relative block">
        <input
          type={visible ? "text" : "password"}
          name={name}
          value={value}
          onChange={onChange}
          minLength={6}
          required
          autoComplete={autoComplete}
          className={INPUT_CLASS}
        />
        <button
          type="button"
          onClick={onToggle}
          className="absolute right-4 top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-lg text-slate-400 transition hover:bg-slate-100 hover:text-slate-700"
          aria-label={visible ? "Hide password" : "Show password"}
        >
          <ToggleIcon size={18} />
        </button>
      </span>
    </label>
  );
}
