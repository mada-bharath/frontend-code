import { Link } from "react-router-dom";
import Footer from "../../../design-system/layouts/Footer";
import { useGetPolicyQuery } from "../../../core/api/endpoints/siteSettingsApi";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Courses", path: "/courses" },
  { label: "Login", path: "/login" },
  { label: "Contact", path: "/contact" },
  { label: "About", path: "/about" },
];

const fallbackTitles = {
  terms: "Terms and Conditions",
  privacy: "Privacy Policy",
  refund: "Refund and Return Policy",
};

const splitBlocks = (content = "") =>
  String(content || "")
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean);

export default function PolicyPage({ type = "terms" }) {
  const { data, isLoading } = useGetPolicyQuery(type);
  const policy = data?.data || {};
  const title = policy.title || fallbackTitles[type] || "Policy";
  const blocks = splitBlocks(policy.content);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-5 py-5 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="text-xl font-black uppercase tracking-normal text-slate-950">
            Bharath Vidya
          </Link>

          <nav className="flex flex-wrap gap-4 text-sm font-bold text-slate-600">
            {navItems.map((item) => (
              <Link key={item.path} to={item.path} className="hover:text-blue-600">
                {item.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-5 py-14">
        <p className="mb-3 text-sm font-black uppercase tracking-normal text-blue-600">
          Policy
        </p>
        <h1 className="text-4xl font-black leading-tight tracking-normal text-slate-950 sm:text-5xl">
          {title}
        </h1>

        <article className="mt-8 rounded-lg border border-slate-200 bg-white p-6 text-base leading-8 text-slate-700 shadow-sm sm:p-8">
          {isLoading ? (
            <div className="space-y-3">
              <div className="h-4 w-3/4 rounded bg-slate-100" />
              <div className="h-4 w-full rounded bg-slate-100" />
              <div className="h-4 w-5/6 rounded bg-slate-100" />
            </div>
          ) : blocks.length ? (
            blocks.map((block) => (
              <p key={block} className="mb-5 last:mb-0 whitespace-pre-line">
                {block}
              </p>
            ))
          ) : (
            <p>This content will be updated by the Bharath Vidya admin.</p>
          )}
        </article>
      </main>

      <Footer />
    </div>
  );
}
