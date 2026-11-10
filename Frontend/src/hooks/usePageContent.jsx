import { useEffect, useState } from "react";
import { isApiConfigured, getVtechPage } from "../api/wordpress";

/**
 * Loads a page's hero + ordered reusable sections from the vtech-core plugin.
 * Uses local data (siteData.js) when the API is unavailable or the request
 * fails. Successful configured API requests use live page content.
 *
 * Returns: { hero, sections, loading, error, live }
 *   - hero:     object | null
 *   - sections: [{ type, order, data }]
 *   - live:     true when the data came from WordPress
 *
 * @param {string} slug                page slug ("home", "about", ...)
 * @param {object} fallback            { hero, sections } used when API is off or fails
 */
export function usePageContent(slug, fallback = {}) {
  const enabled = isApiConfigured && Boolean(slug);
  const [state, setState] = useState({
    slug,
    hero: enabled ? null : fallback.hero ?? null,
    sections: enabled ? [] : fallback.sections ?? [],
    loading: enabled,
    error: null,
    live: false,
  });

  useEffect(() => {
    if (!enabled) return;
    let active = true;

    getVtechPage(slug)
      .then((res) => {
        if (!active) return;
        setState({
          slug,
          hero: normalizeHero(res?.hero),
          sections: Array.isArray(res?.sections) ? res.sections : [],
          loading: false,
          error: null,
          live: true,
        });
      })
      .catch((err) => {
        if (!active) return;
        setState({
          slug,
          hero: fallback.hero ?? null,
          sections: fallback.sections ?? [],
          loading: false,
          error: err,
          live: false,
        });
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slug]);

  if (!enabled) {
    return {
      slug,
      hero: fallback.hero ?? null,
      sections: fallback.sections ?? [],
      loading: false,
      error: null,
      live: false,
      enabled: false,
    };
  }

  return state.slug === slug
    ? { ...state, enabled: true }
    : {
        slug,
        hero: null,
        sections: [],
        loading: true,
        error: null,
        live: false,
        enabled: true,
      };
}

const btn = (b) => (b && b.label ? { label: b.label, url: b.url, icon: b.icon } : null);

/**
 * Normalize ONE hero slide into the props PageHero expects.
 * - `note` is stored as a "|"-separated string in admin; turn it into JSX.
 * - buttons with an empty label are dropped.
 */
function normalizeSlide(slide) {
  const s = slide && typeof slide === "object" ? slide : {};

  const noteLines = String(s.note || "")
    .split("|")
    .map((t) => t.trim())
    .filter(Boolean);

  const note =
    noteLines.length > 0
      ? noteLines.map((line, i) => (
          <span key={i} className="block">
            {line}
          </span>
        ))
      : null;

  return {
    eyebrow: s.eyebrow || "",
    title: s.title || "",
    accent: s.accent || "",
    titleEnd: s.title_end || "",
    description: s.description || "",
    image: s.image || "",
    note,
    points: Array.isArray(s.points) ? s.points : [],
    primary: btn(s.primary),
    secondary: btn(s.secondary),
  };
}

/**
 * Normalize the WP hero (slider) shape.
 * Produces a `slides` array (each a PageHero-ready object), slider behaviour
 * options, and the hero-level `visible` flag. Legacy flat heroes (fields at
 * the top level, no `slides`) are migrated into a single slide so older
 * content keeps rendering.
 */
function normalizeHero(hero) {
  if (!hero || typeof hero !== "object") return null;

  let rawSlides = Array.isArray(hero.slides) ? hero.slides : [];
  if (rawSlides.length === 0) {
    // Legacy flat hero -> single slide.
    const hasFlat =
      hero.title || hero.accent || hero.description || hero.image || hero.eyebrow;
    if (hasFlat) rawSlides = [hero];
  }

  const slides = rawSlides.map(normalizeSlide).filter(
    (s) => s.title || s.accent || s.description || s.image || s.eyebrow
  );

  const sliderOpts = hero.slider && typeof hero.slider === "object" ? hero.slider : {};
  const truthy = (v, def) =>
    v === undefined || v === null || v === "" ? def : ![0, "0", false, "false"].includes(v);

  const slider = {
    autoplay: truthy(sliderOpts.autoplay, true),
    interval: Number(sliderOpts.interval) > 0 ? Number(sliderOpts.interval) : 6000,
    loop: truthy(sliderOpts.loop, true),
    arrows: truthy(sliderOpts.arrows, true),
    dots: truthy(sliderOpts.dots, true),
  };

  const visible =
    !hero.advanced ||
    !Object.prototype.hasOwnProperty.call(hero.advanced, "visible") ||
    ![0, "0", false].includes(hero.advanced.visible);

  return {
    visible,
    slides,
    slider,
    advanced: hero.advanced || {},
    // First slide spread at the top level for backward compatibility with any
    // consumer still spreading <PageHero {...hero} />.
    ...(slides[0] || {}),
  };
}
