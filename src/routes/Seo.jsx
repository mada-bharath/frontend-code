import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://www.bharathvidya.com";

const pages = {
  "/": {
    title: "Bharath Vidya - Online Courses and Learner Portal",
    description:
      "Learn programming, technology and career skills online with Bharath Vidya. Browse courses and login to continue your learning.",
  },
  "/courses": {
    title: "Courses - Bharath Vidya",
    description:
      "Browse Bharath Vidya online courses in programming, technology, and career skills.",
  },
  "/login": {
    title: "Login - Bharath Vidya",
    description:
      "Login to the Bharath Vidya learner portal to access courses, videos, study materials, and progress tracking.",
  },
  "/contact": {
    title: "Contact - Bharath Vidya",
    description:
      "Contact Bharath Vidya for course access, learner support, account help, and online learning questions.",
  },
  "/about": {
    title: "About - Bharath Vidya",
    description:
      "Learn about Bharath Vidya, an online learning platform for programming, technology, and career skills.",
  },
};

const publicPaths = new Set(Object.keys(pages));

const normalizePath = (pathname) => {
  const path = pathname.replace(/\/+$/, "");
  return path || "/";
};

const canonicalFor = (pathname) => {
  const path = normalizePath(pathname);
  return `${SITE_URL}${path === "/" ? "/" : path}`;
};

const ensureMeta = (attribute, key) => {
  let element = document.head.querySelector(`meta[${attribute}="${key}"]`);

  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }

  return element;
};

const setMeta = (attribute, key, content) => {
  ensureMeta(attribute, key).setAttribute("content", content);
};

const setCanonical = (href) => {
  let element = document.head.querySelector('link[rel="canonical"]');

  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }

  element.setAttribute("href", href);
};

export default function Seo() {
  const location = useLocation();

  useEffect(() => {
    const pathname = normalizePath(location.pathname);
    const page = pages[pathname] || pages["/"];
    const canonical = canonicalFor(pathname);
    const robots = publicPaths.has(pathname) ? "index, follow" : "noindex, follow";

    document.title = page.title;
    setMeta("name", "description", page.description);
    setMeta("name", "robots", robots);
    setCanonical(canonical);
    setMeta("property", "og:site_name", "Bharath Vidya");
    setMeta("property", "og:title", page.title);
    setMeta("property", "og:description", page.description);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:url", canonical);
  }, [location.pathname]);

  return null;
}
