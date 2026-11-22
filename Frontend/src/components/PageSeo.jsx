import { useEffect, useMemo, useState } from "react";
import { useLocation } from "react-router-dom";
import { getYoastMetadata, isApiConfigured } from "../api/wordpress";
import { usePageContext } from "../hooks/PageContentContext";
import { slugify } from "../utils/slug";

const PAGE_SEO = {
  "/": {
    entity: "page",
    slug: "home",
    title: "VTechEasy (Tech Easy) | Websites & Mobile Apps",
    description:
      "VTechEasy, also known as Tech Easy, builds modern websites, mobile apps and UI/UX designs in Hyderabad. Get a free consultation for your project.",
  },
  "/services": {
    entity: "page",
    slug: "services",
    title: "Web, Mobile App & UI/UX Services | VTechEasy",
    description:
      "Explore Tech Easy services, including web development, mobile apps, UI/UX design, cloud solutions and custom software.",
  },
  "/portfolio": {
    entity: "page",
    slug: "portfolio",
    title: "Our Projects & Portfolio | VTechEasy",
    description:
      "Explore websites, mobile apps and digital products designed and developed by the Tech Easy team.",
  },
  "/about": {
    entity: "page",
    slug: "about",
    title: "About Tech Easy | VTechEasy",
    description:
      "Meet Tech Easy, a digital solutions team building modern websites, mobile apps and software for businesses.",
  },
  "/pricing": {
    entity: "page",
    slug: "pricing",
    title: "Website & App Development Pricing | VTechEasy",
    description:
      "Explore Tech Easy project packages and find a web, mobile app or custom software solution for your business.",
  },
  "/blog": {
    entity: "page",
    slug: "blog",
    title: "Technology & Digital Insights | VTechEasy Blog",
    description:
      "Read the latest Tech Easy insights on web development, mobile apps, UI/UX design and digital growth.",
  },
  "/contact": {
    entity: "page",
    slug: "contact",
    title: "Contact VTechEasy | Get a Free Consultation",
    description:
      "Contact Tech Easy about your website, mobile app or software project. Tell us what you need and our team will be in touch.",
  },
};

function resolvePage(pathname, sections) {
  const page = PAGE_SEO[pathname];
  if (page) return { ...page, item: null };

  const match = pathname.match(/^\/(services|portfolio|blog)\/([^/]+)\/?$/);
  if (!match) {
    return {
      title: "VTechEasy (Tech Easy) | Web & Mobile App Development",
      description: PAGE_SEO["/"].description,
      robots: "noindex,follow",
      item: null,
    };
  }

  const [, kind, slug] = match;
  const sectionType = {
    services: "services",
    portfolio: "projects",
    blog: "blog_content",
  }[kind];
  const section = sections.find((entry) => entry?.type === sectionType)?.data;
  const collection = kind === "blog" ? section?.posts : section?.items;
  const item = (Array.isArray(collection) ? collection : []).find(
    (entry) => (entry.slug || slugify(entry.title)) === slug,
  );
  const title = item?.title || slug.replace(/[-_]+/g, " ");
  const description =
    item?.excerpt || item?.desc || item?.description || PAGE_SEO[`/${kind}`].description;

  return {
    entity: kind === "blog" ? "post" : kind === "portfolio" ? "project" : "page",
    slug,
    title: `${title} | VTechEasy`,
    description,
    robots: item ? undefined : "noindex,follow",
    image: item?.image || "",
    item,
    kind,
  };
}

function yoastRobots(robots) {
  if (!robots || typeof robots !== "object") return "";
  return Object.values(robots)
    .filter((value) => typeof value === "string" || typeof value === "number")
    .join(",");
}

function setMeta(selector, attribute, key, content) {
  let element = document.head.querySelector(selector);
  if (!content) {
    element?.remove();
    return;
  }
  if (!element) {
    element = document.createElement("meta");
    element.setAttribute(attribute, key);
    document.head.appendChild(element);
  }
  element.setAttribute("content", content);
}

function setCanonical(url) {
  let element = document.head.querySelector('link[rel="canonical"]');
  if (!element) {
    element = document.createElement("link");
    element.setAttribute("rel", "canonical");
    document.head.appendChild(element);
  }
  element.setAttribute("href", url);
}

export default function PageSeo() {
  const { pathname } = useLocation();
  const { sections } = usePageContext();
  const normalizedPath = pathname.replace(/\/+$/, "") || "/";
  const page = useMemo(() => resolvePage(normalizedPath, sections), [normalizedPath, sections]);
  const [yoastResult, setYoastResult] = useState({ key: "", metadata: null });
  const requestKey = page.entity && page.slug ? `${page.entity}:${page.slug}` : "";

  useEffect(() => {
    if (!isApiConfigured || !requestKey) return undefined;
    let active = true;

    getYoastMetadata(page.entity, page.slug)
      .then((metadata) => {
        if (active) setYoastResult({ key: requestKey, metadata });
      })
      .catch((error) => {
        if (import.meta.env.DEV) {
          console.warn("[SEO] Yoast metadata is unavailable; using React defaults.", error);
        }
      });

    return () => {
      active = false;
    };
  }, [page.entity, page.slug, requestKey]);

  const yoast = yoastResult.key === requestKey ? yoastResult.metadata : null;
  const title = yoast?.title || page.title;
  const description = yoast?.description || page.description;
  const socialTitle = yoast?.og_title || title;
  const socialDescription = yoast?.og_description || description;
  const socialImage = yoast?.og_image?.[0]?.url || page.image;
  const twitterImage = Array.isArray(yoast?.twitter_image)
    ? yoast.twitter_image[0]?.url
    : yoast?.twitter_image;
  const robots = yoastRobots(yoast?.robots) || page.robots || "index,follow";

  useEffect(() => {
    const canonicalUrl = `${window.location.origin}${normalizedPath}`;
    document.title = title;
    setMeta('meta[name="description"]', "name", "description", description);
    setMeta('meta[name="robots"]', "name", "robots", robots);
    setMeta('meta[property="og:title"]', "property", "og:title", socialTitle);
    setMeta('meta[property="og:description"]', "property", "og:description", socialDescription);
    setMeta('meta[property="og:type"]', "property", "og:type", page.kind === "blog" ? "article" : "website");
    setMeta('meta[property="og:url"]', "property", "og:url", canonicalUrl);
    setMeta('meta[property="og:image"]', "property", "og:image", socialImage);
    setMeta('meta[name="twitter:card"]', "name", "twitter:card", socialImage ? "summary_large_image" : "summary");
    setMeta('meta[name="twitter:title"]', "name", "twitter:title", yoast?.twitter_title || socialTitle);
    setMeta('meta[name="twitter:description"]', "name", "twitter:description", yoast?.twitter_description || socialDescription);
    setMeta('meta[name="twitter:image"]', "name", "twitter:image", twitterImage || socialImage);
    setCanonical(canonicalUrl);
  }, [description, normalizedPath, page.kind, robots, socialDescription, socialImage, socialTitle, title, twitterImage, yoast]);

  return null;
}
