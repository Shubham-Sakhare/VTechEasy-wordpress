import { getLayout } from "../api/wordpress";
import { useWordpressData } from "./useWordpressData";
import { footer as footerFallback } from "../data/siteData";

/** Map a known link label to an in-app route, else leave it as a plain anchor. */
const PATHS = {
  Home: "/",
  Services: "/services",
  Portfolio: "/portfolio",
  About: "/about",
  Pricing: "/pricing",
  Blog: "/blog",
  Contact: "/contact",
};
function labelToPath(label) {
  return PATHS[label] || "#";
}

/**
 * Fallback layout mirroring the WordPress response shape, built from the
 * existing dummy data so the UI renders identically before/if the API is off.
 */
const fallback = {
  header: {
    logo_image: "",
    logo_text: "Tech Easy",
    menu: [
      { label: "Home", url: "/", icon: "", children: [] },
      { label: "Services", url: "/services", icon: "", children: [] },
      { label: "Portfolio", url: "/portfolio", icon: "", children: [] },
      { label: "About", url: "/about", icon: "", children: [] },
      { label: "Pricing", url: "/pricing", icon: "", children: [] },
      { label: "Blog", url: "/blog", icon: "", children: [] },
      { label: "Contact", url: "/contact", icon: "", children: [] },
    ],
    button: { label: "Get Started", url: "/contact", icon: "" },
  },
  footer: {
    logo_image: footerFallback.logo_image,
    logo_text: footerFallback.logo_text,
    tagline: footerFallback.tagline,
    columns: footerFallback.columns.map((c) => ({
      title: c.title,
      links: c.links.map((l) => ({ label: l, url: labelToPath(l) })),
    })),
    contact: footerFallback.contact,
    socials: footerFallback.socials.map((icon) => ({ icon, url: "#" })),
    copyright: footerFallback.copyright,
    legal: footerFallback.legal.map((label) => ({ label, url: "#" })),
  },
};

/**
 * Loads the Header + Footer content from WordPress, falling back to dummy data.
 */
export function useLayout() {
  const { data, loading, error } = useWordpressData(getLayout, fallback);

  return {
    header: data?.header ?? fallback.header,
    footer: data?.footer ?? fallback.footer,
    loading,
    error,
  };
}
