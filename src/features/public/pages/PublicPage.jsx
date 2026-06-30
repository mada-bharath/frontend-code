import { Link } from "react-router-dom";
import Footer from "../../../design-system/layouts/Footer";

const navItems = [
  { label: "Home", path: "/" },
  { label: "Courses", path: "/courses" },
  { label: "Login", path: "/login" },
  { label: "Contact", path: "/contact" },
  { label: "About", path: "/about" },
];

const content = {
  home: {
    eyebrow: "Online learning",
    title: "Bharath Vidya",
    body: "Build practical skills through structured online courses, guided lessons, videos, study materials, and learner progress tracking.",
    primaryLabel: "Browse Courses",
    primaryHref: "/courses",
    secondaryLabel: "Login",
    secondaryHref: "/login",
  },
  about: {
    eyebrow: "About",
    title: "Learning built for progress",
    body: "Bharath Vidya helps learners access programming, technology, and career skill courses through a secure online learning portal.",
    primaryLabel: "Browse Courses",
    primaryHref: "/courses",
    secondaryLabel: "Login",
    secondaryHref: "/login",
  },
  contact: {
    eyebrow: "Contact",
    title: "Get learner support",
    body: "Need help with course access, login, payments, or your learner account? Contact the Bharath Vidya team for support.",
    primaryLabel: "Login",
    primaryHref: "/login",
    secondaryLabel: "Browse Courses",
    secondaryHref: "/courses",
  },
};

export default function PublicPage({ type = "home" }) {
  const page = content[type] || content.home;

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

      <main className="mx-auto grid min-h-[calc(100vh-81px)] max-w-7xl items-center px-5 py-16">
        <section className="max-w-3xl">
          <p className="mb-3 text-sm font-black uppercase tracking-normal text-blue-600">
            {page.eyebrow}
          </p>
          <h1 className="text-5xl font-black leading-none tracking-normal text-slate-950 sm:text-7xl">
            {page.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600">
            {page.body}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              to={page.primaryHref}
              className="inline-flex min-h-12 items-center justify-center rounded-lg bg-blue-600 px-5 text-sm font-black text-white shadow-sm hover:bg-blue-700"
            >
              {page.primaryLabel}
            </Link>
            <Link
              to={page.secondaryHref}
              className="inline-flex min-h-12 items-center justify-center rounded-lg border border-slate-200 bg-white px-5 text-sm font-black text-slate-950 shadow-sm hover:border-blue-600"
            >
              {page.secondaryLabel}
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
