// Per-page fallbacks for the vtech-core page builder, built from the existing
// dummy data so the site renders identically when the WordPress API is off.
//
// Shape matches the REST response of /vtech/v1/page/{slug}:
//   { hero, sections: [{ type, order, data }] }
//
// `sections` lists the reusable blocks a page shows by default and their
// order. This mirrors the default placement declared in the plugin registry.

import {
  services,
  process,
  projects,
  testimonials,
  homeTeam,
  footerCta,
  aboutPage,
  portfolioPage,
  contactPage,
  blogPage,
  pricingPage,
  servicesPage,
  hero as homeHero,
} from "./siteData";

const servicesData = {
  eyebrow: services.eyebrow,
  title: services.title,
  title_accent: services.titleAccent,
  description: services.description,
  cta: services.cta,
  items: services.items,
};
const processData = {
  eyebrow: process.eyebrow,
  title: process.title,
  title_accent: process.titleAccent,
  description: process.description,
  cta: process.cta,
  cta_url: process.ctaUrl,
  cta_icon: process.ctaIcon,
  cta_visible: process.ctaVisible,
  steps: process.steps,
};
const projectsData = {
  eyebrow: projects.eyebrow,
  title: projects.title,
  description: projects.description,
  cta: projects.cta,
  items: projects.items,
};
const testimonialsData = {
  eyebrow: testimonials.eyebrow,
  title: testimonials.title,
  description: testimonials.description,
  items: testimonials.items,
};
const teamData = {
  eyebrow: homeTeam.eyebrow,
  title: homeTeam.title,
  accent: homeTeam.accent,
  description: homeTeam.description,
  cta: homeTeam.cta,
  cta_url: homeTeam.cta_url,
  cta_visible: homeTeam.cta_visible,
  members: homeTeam.members,
};
const aboutStoryData = {
  ...aboutPage.story,
  cta_text: aboutPage.story.cta,
  image_alt: "Our journey",
};
const aboutPillarsData = {
  mission: aboutPage.pillars[0],
  vision: aboutPage.pillars[1],
  values: {
    ...aboutPage.pillars[2],
    items: aboutPage.pillars[2].list.map((text) => ({ text })),
  },
};
const aboutTeamData = {
  ...aboutPage.team,
  members: aboutPage.team.members.map((member) => ({
    ...member,
    socials: [
      { icon: "linkedin", url: "#" },
      { icon: "twitter", url: "#" },
      { icon: "github", url: "#" },
    ],
  })),
};
const aboutWhyData = aboutPage.whyUs;
const aboutBannerData = {
  ...aboutPage.banner,
  primary_label: aboutPage.banner.primary,
  primary_url: "/contact",
  secondary_label: aboutPage.banner.secondary,
};
const pricingData = {
  ...pricingPage.heading,
  popular_label: "Most Popular",
  plans: pricingPage.plans.map((plan) => ({
    ...plan,
    features: plan.features.map((text) => ({ text })),
    cta_url: "/contact",
    cta_icon: "arrow-right",
  })),
};
const contactData = {
  info: contactPage.info,
  form: {
    ...contactPage.form,
    name_label: "Your Name",
    name_placeholder: "Enter your name",
    email_label: "Email Address",
    email_placeholder: "Enter your email",
    phone_label: "Phone Number",
    phone_placeholder: "Enter your phone number",
    service_label: "Service Interested In",
    service_placeholder: "Select a service",
    services: contactPage.form.services.map((name) => ({ name })),
    details_label: "Project Details",
    details_placeholder: "Tell us about your project or how we can help...",
    terms_text: "Terms & Conditions",
    privacy_text: "Privacy Policy",
    submit_label: "Send Message",
    privacy_notice: "Your information is safe with us. We respect your privacy.",
  },
  office: {
    ...contactPage.office,
    address: "Tech Easy, Bhopal",
    map_image: "https://placehold.co/640x520/0a0f29/1b2550?text=Map",
  },
  faq: contactPage.faq,
};

const sec = (type, order, data) => ({ type, order, data });

const defaultSlider = { autoplay: true, interval: 6000, loop: true, arrows: true, dots: true };

/** Build a single hero slide object from a siteData hero block. */
function slideFrom(h = {}, extra = {}) {
  return {
    eyebrow: h.eyebrow || "",
    title: h.title || "",
    accent: h.accent || "",
    titleEnd: h.titleEnd || h.title_end || "",
    description: h.description || "",
    image: h.image || "",
    note: extra.note ?? null,
    points: h.points || [],
    primary: h.primary || null,
    secondary: h.secondary || null,
  };
}

/**
 * Build hero fallback for a page. Supports one or many slides so the offline
 * look matches the live slider shape ({ slides, slider, visible }).
 */
function heroFrom(h = {}, extra = {}) {
  const slides = Array.isArray(h.slides)
    ? h.slides.map((s) => slideFrom(s))
    : [slideFrom(h, extra)];
  const first = slides[0] || slideFrom({});
  return {
    visible: true,
    slides,
    slider: defaultSlider,
    advanced: {},
    ...first,
  };
}

export const pageFallbacks = {
  home: {
    hero: heroFrom({
      eyebrow: "Innovative • Creative • Reliable",
      title: homeHero.titleLines?.[0]?.text,
      accent: "Modern Websites & Powerful Apps",
      description: homeHero.description,
      image: homeHero.image,
      points: homeHero.highlights,
    }),
    sections: [
      sec("services", 1, servicesData),
      sec("process", 3, processData),
      sec("projects", 4, projectsData),
      sec("team", 5, teamData),
      sec("testimonials", 6, testimonialsData),
    ],
  },
  services: {
    hero: heroFrom(servicesPage.hero),
    sections: [sec("services", 1, servicesData), sec("process", 2, processData)],
  },
  portfolio: {
    hero: heroFrom(portfolioPage.hero),
    sections: [sec("testimonials", 3, testimonialsData)],
  },
  about: {
    hero: heroFrom(aboutPage.hero),
    sections: [
      sec("about_story", 1, aboutStoryData),
      sec("about_pillars", 2, aboutPillarsData),
      sec("about_team", 3, aboutTeamData),
      sec("about_why", 4, aboutWhyData),
      sec("about_banner", 5, aboutBannerData),
    ],
  },
  contact: {
    hero: heroFrom(contactPage.hero),
    sections: [sec("contact_content", 1, contactData)],
  },
  blog: { hero: heroFrom(blogPage.hero), sections: [] },
  pricing: {
    hero: heroFrom(pricingPage.hero),
    sections: [sec("pricing_content", 1, pricingData)],
  },
};

export const ctaFallback = {
  eyebrow: footerCta.eyebrow,
  title: footerCta.title,
  description: footerCta.description,
  placeholder: footerCta.placeholder,
  button: footerCta.button,
};

/** Map a router pathname to a page slug. */
export function pathToSlug(pathname) {
  if (!pathname || pathname === "/") return "home";
  return pathname.replace(/^\/+/, "").split("/")[0] || "home";
}
