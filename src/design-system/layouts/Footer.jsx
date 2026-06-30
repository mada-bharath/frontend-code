import { Link } from "react-router-dom";
import { Mail, Phone } from "lucide-react";
import { useGetSiteSettingsQuery } from "../../core/api/endpoints/siteSettingsApi";

const fallbackSettings = {
  brandName: "Bharath Vidya",
  footerDescription:
    "Bharath Vidya provides practical online courses and learning support for students, beginners, and working professionals.",
  emails: [],
  phones: [],
  resources: [
    { label: "Courses", href: "/courses" },
    { label: "My Courses", href: "/my-courses" },
    { label: "Discussion", href: "/discussion" },
    { label: "Wishlist", href: "/wishlist" },
    { label: "Level Up", href: "/levelup" },
  ],
  supportLinks: [
    { label: "Contact Us", href: "/contact" },
    { label: "Terms and Conditions", href: "/terms-and-conditions" },
    { label: "Refund and Return Policy", href: "/refund-and-return-policy" },
    { label: "Privacy Policy", href: "/privacy-policy" },
  ],
};

const legacyPathMap = {
  "/learner": "/my-courses",
  "/learner#discussion": "/discussion",
  "/learner#wishlist": "/wishlist",
  "/learner#level-up": "/levelup",
};

const normalizeHref = (href = "") => legacyPathMap[href] || href || "/";

const normalizeLinks = (links = [], fallback = []) => {
  const source = Array.isArray(links) && links.length ? links : fallback;

  return source
    .map((link) => ({
      label: String(link?.label || "").trim(),
      href: normalizeHref(String(link?.href || "").trim()),
    }))
    .filter((link) => link.label && link.href);
};

const isExternalHref = (href = "") =>
  /^(https?:|mailto:|tel:)/i.test(String(href));

function FooterLink({ link }) {
  if (isExternalHref(link.href)) {
    return (
      <a href={link.href} className="text-slate-300 transition hover:text-white">
        {link.label}
      </a>
    );
  }

  return (
    <Link to={link.href} className="text-slate-300 transition hover:text-white">
      {link.label}
    </Link>
  );
}

export default function Footer() {
  const { data } = useGetSiteSettingsQuery();
  const settings = data?.data || fallbackSettings;
  const resources = normalizeLinks(settings.resources, fallbackSettings.resources);
  const supportLinks = normalizeLinks(
    settings.supportLinks,
    fallbackSettings.supportLinks
  );
  const emails = Array.isArray(settings.emails) ? settings.emails.filter(Boolean) : [];
  const phones = Array.isArray(settings.phones) ? settings.phones.filter(Boolean) : [];

  return (
    <footer className="bg-slate-50 px-4 pb-24 sm:px-6 lg:px-8 lg:pb-8">
      <div className="mx-auto grid max-w-[1360px] gap-6 rounded-lg bg-slate-950 px-6 py-7 text-white shadow-sm md:grid-cols-[1.35fr_0.8fr_1fr_1fr]">
        <section>
          <h2 className="text-lg font-black tracking-normal">
            {settings.brandName || fallbackSettings.brandName}
          </h2>
          <p className="mt-3 max-w-md text-sm font-medium leading-6 text-slate-300">
            {settings.footerDescription || fallbackSettings.footerDescription}
          </p>
        </section>

        <section>
          <h3 className="text-xs font-black uppercase tracking-normal text-slate-300">
            Resources
          </h3>
          <nav className="mt-3 grid gap-2 text-sm font-medium">
            {resources.map((link) => (
              <FooterLink key={`${link.label}-${link.href}`} link={link} />
            ))}
          </nav>
        </section>

        <section>
          <h3 className="text-xs font-black uppercase tracking-normal text-slate-300">
            Support
          </h3>
          <nav className="mt-3 grid gap-2 text-sm font-medium">
            {supportLinks.map((link) => (
              <FooterLink key={`${link.label}-${link.href}`} link={link} />
            ))}
          </nav>
        </section>

        <section>
          <h3 className="text-xs font-black uppercase tracking-normal text-slate-300">
            Contact
          </h3>
          <div className="mt-3 grid gap-2 text-sm font-medium text-slate-300">
            {emails.map((email) => (
              <a
                key={email}
                href={`mailto:${email}`}
                className="flex min-w-0 items-center gap-2 transition hover:text-white"
              >
                <Mail size={15} className="shrink-0" />
                <span className="break-all">{email}</span>
              </a>
            ))}
            {phones.map((phone) => (
              <a
                key={phone}
                href={`tel:${phone}`}
                className="flex min-w-0 items-center gap-2 transition hover:text-white"
              >
                <Phone size={15} className="shrink-0" />
                <span>{phone}</span>
              </a>
            ))}
            {!emails.length && !phones.length && (
              <span>Contact details will be updated soon.</span>
            )}
          </div>
        </section>
      </div>
    </footer>
  );
}
