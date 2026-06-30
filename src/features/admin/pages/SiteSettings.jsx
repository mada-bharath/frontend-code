import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FileText, Mail, Phone, RefreshCcw, Save, Settings } from "lucide-react";
import {
  useGetAdminSiteSettingsQuery,
  useUpdateAdminSiteSettingsMutation,
} from "../../../core/api/endpoints/siteSettingsApi";

const emptyPolicy = (title) => ({
  title,
  content: "",
  version: "1.0",
});

const initialForm = {
  brandName: "Bharath Vidya",
  footerDescription: "",
  emailsText: "",
  phonesText: "",
  policies: {
    terms: emptyPolicy("Terms and Conditions"),
    privacy: emptyPolicy("Privacy Policy"),
    refund: emptyPolicy("Refund and Return Policy"),
  },
};

const listToText = (list = []) => (Array.isArray(list) ? list.join("\n") : "");

const textToList = (text = "") =>
  String(text || "")
    .split(/\r?\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);

const policyFields = [
  { key: "terms", label: "Terms and Conditions" },
  { key: "privacy", label: "Privacy Policy" },
  { key: "refund", label: "Refund and Return Policy" },
];

function TextInput({ label, icon: Icon, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-normal text-slate-500">
        {Icon && <Icon size={15} />}
        {label}
      </span>
      <input
        {...props}
        className="h-12 w-full rounded-lg border border-slate-200 bg-white px-4 text-sm font-semibold text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
    </label>
  );
}

function TextArea({ label, icon: Icon, rows = 4, ...props }) {
  return (
    <label className="block">
      <span className="mb-2 flex items-center gap-2 text-xs font-black uppercase tracking-normal text-slate-500">
        {Icon && <Icon size={15} />}
        {label}
      </span>
      <textarea
        {...props}
        rows={rows}
        className="w-full rounded-lg border border-slate-200 bg-white px-4 py-3 text-sm font-medium leading-6 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10"
      />
    </label>
  );
}

export default function SiteSettings() {
  const { data, isLoading, refetch } = useGetAdminSiteSettingsQuery();
  const [updateSettings, { isLoading: isSaving }] =
    useUpdateAdminSiteSettingsMutation();
  const [form, setForm] = useState(initialForm);

  useEffect(() => {
    const settings = data?.data;
    if (!settings) return;

    setForm({
      brandName: settings.brandName || initialForm.brandName,
      footerDescription:
        settings.footerDescription || initialForm.footerDescription,
      emailsText: listToText(settings.emails),
      phonesText: listToText(settings.phones),
      policies: {
        terms: {
          ...initialForm.policies.terms,
          ...(settings.policies?.terms || {}),
        },
        privacy: {
          ...initialForm.policies.privacy,
          ...(settings.policies?.privacy || {}),
        },
        refund: {
          ...initialForm.policies.refund,
          ...(settings.policies?.refund || {}),
        },
      },
    });
  }, [data]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const updatePolicy = (type, field, value) => {
    setForm((prev) => ({
      ...prev,
      policies: {
        ...prev.policies,
        [type]: {
          ...prev.policies[type],
          [field]: value,
        },
      },
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      await updateSettings({
        brandName: form.brandName,
        footerDescription: form.footerDescription,
        emails: textToList(form.emailsText),
        phones: textToList(form.phonesText),
        policies: form.policies,
      }).unwrap();

      toast.success("Site settings updated");
      refetch();
    } catch (error) {
      toast.error(error?.data?.message || "Failed to update site settings");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 text-slate-950 md:p-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-normal text-indigo-600">
              Admin
            </p>
            <h1 className="mt-1 flex items-center gap-3 text-3xl font-black tracking-tight">
              <Settings className="text-indigo-600" size={32} />
              Site Settings
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Edit footer contact details and legal policy content.
            </p>
          </div>

          <button
            type="button"
            onClick={() => refetch()}
            disabled={isLoading}
            className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 shadow-sm transition hover:border-indigo-300 hover:text-indigo-600 disabled:opacity-50"
          >
            <RefreshCcw size={17} className={isLoading ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6">
            <div className="mb-5">
              <h2 className="text-xl font-black">Footer</h2>
              <p className="mt-1 text-sm font-medium text-slate-500">
                These details appear in the frontend footer.
              </p>
            </div>

            <div className="grid gap-5 md:grid-cols-2">
              <TextInput
                label="Brand Name"
                value={form.brandName}
                onChange={(event) => updateField("brandName", event.target.value)}
              />
              <TextArea
                label="Footer Description"
                rows={5}
                value={form.footerDescription}
                onChange={(event) =>
                  updateField("footerDescription", event.target.value)
                }
              />
              <TextArea
                label="Emails"
                icon={Mail}
                rows={4}
                placeholder="support@bharathvidya.com"
                value={form.emailsText}
                onChange={(event) => updateField("emailsText", event.target.value)}
              />
              <TextArea
                label="Phone Numbers"
                icon={Phone}
                rows={4}
                placeholder="+91 98765 43210"
                value={form.phonesText}
                onChange={(event) => updateField("phonesText", event.target.value)}
              />
            </div>
          </section>

          {policyFields.map((policy) => (
            <section
              key={policy.key}
              className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-6"
            >
              <div className="mb-5 flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                  <FileText size={20} />
                </span>
                <div>
                  <h2 className="text-xl font-black">{policy.label}</h2>
                  <p className="mt-1 text-sm font-medium text-slate-500">
                    This content appears on the public policy page.
                  </p>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_140px]">
                <TextInput
                  label="Title"
                  value={form.policies[policy.key].title}
                  onChange={(event) =>
                    updatePolicy(policy.key, "title", event.target.value)
                  }
                />
                <TextInput
                  label="Version"
                  value={form.policies[policy.key].version}
                  onChange={(event) =>
                    updatePolicy(policy.key, "version", event.target.value)
                  }
                />
                <div className="md:col-span-2">
                  <TextArea
                    label="Content"
                    rows={10}
                    value={form.policies[policy.key].content}
                    onChange={(event) =>
                      updatePolicy(policy.key, "content", event.target.value)
                    }
                  />
                </div>
              </div>
            </section>
          ))}

          <div className="sticky bottom-4 flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-indigo-600 px-6 text-sm font-black text-white shadow-lg shadow-indigo-200 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? (
                <RefreshCcw size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              {isSaving ? "Saving..." : "Save Settings"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
