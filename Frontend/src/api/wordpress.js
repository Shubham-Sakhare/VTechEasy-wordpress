// ============================================================
//  WordPress REST API client
// ============================================================
//
//  Configuration (set in .env):
//    VITE_WP_API_URL   = WordPress site root, e.g.:
//                        https://vtecheasy.great-site.net/backend
//    VITE_WP_REST_MODE = "query"  → ?rest_route=/vtech/v1/...  (default, works everywhere)
//                        "path"   → /wp-json/vtech/v1/...      (needs pretty permalinks)
//
//  Dev-mode proxy:
//    In development (import.meta.env.DEV === true), every request goes through
//    Vite's /wp-proxy path instead of hitting the live backend directly.
//    This fixes CORS and InfinityFree's bot-protection challenge.
//    The proxy is defined in vite.config.js and strips the /wp-proxy prefix
//    before forwarding to the real backend with a browser-like User-Agent.
//
//  The UI falls back to src/data/siteData.js dummy data when no URL is set.
// ============================================================

const RAW_BASE = (import.meta.env.VITE_WP_API_URL || "").replace(/\/+$/, "").replace(/\/wp-json$/, "");

// In dev mode, use the Vite proxy path (/wp-proxy) so the browser never
// makes a cross-origin request directly to the live server.
// In production the full VITE_WP_API_URL is used directly.
const BASE_URL = (import.meta.env.DEV && RAW_BASE)
  ? "/wp-proxy"
  : RAW_BASE;

// REST URL form:
//   "query"  → https://site/?rest_route=/vtech/v1/...  (universal, no pretty-permalinks)
//   "path"   → https://site/wp-json/vtech/v1/...       (needs pretty permalinks)
const REST_MODE = String(import.meta.env.VITE_WP_REST_MODE || "query").toLowerCase();
const USE_QUERY_REST_ROUTE = REST_MODE !== "path";

export const isApiConfigured = Boolean(RAW_BASE);

/** Build the full REST URL for a given route and optional query params */
function restUrl(route, params = {}) {
  // In dev mode BASE_URL is a relative path (/wp-proxy), so we need an absolute URL.
  const fullBase = BASE_URL.startsWith("/")
    ? `${window.location.origin}${BASE_URL}`
    : BASE_URL;

  const url = USE_QUERY_REST_ROUTE
    ? new URL(`${fullBase}/`)
    : new URL(`${fullBase}/wp-json${route}`);

  if (USE_QUERY_REST_ROUTE) {
    url.searchParams.set("rest_route", route);
  }

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null) {
      url.searchParams.set(key, String(value));
    }
  });

  return url.toString();
}

/** Generic GET request */
async function request(route, { params } = {}) {
  if (!isApiConfigured) {
    throw new Error("WordPress API URL is not configured (VITE_WP_API_URL in .env).");
  }

  const url = restUrl(route, params);

  if (import.meta.env.DEV) {
    console.debug("[WP API] →", url);
  }

  const res = await fetch(url, {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`WordPress API error: ${res.status} ${res.statusText} (${url})`);
  }

  const text = await res.text();

  // Guard against HTML responses (bot-protection page, WP error pages)
  if (text.trim().startsWith("<")) {
    if (import.meta.env.DEV) {
      console.error("[WP API] Got HTML instead of JSON — bot protection or server error:", text.slice(0, 300));
    }
    throw new Error("WordPress returned HTML instead of JSON. The API may be blocked or misconfigured.");
  }

  return JSON.parse(text);
}

/** Generic POST / form submit */
async function submitForm(route, payload) {
  if (!isApiConfigured) {
    throw new Error("The form service is not configured. Please contact us directly.");
  }

  const isMultipart = payload instanceof FormData;
  const url = restUrl(route);

  const res = await fetch(url, {
    method: "POST",
    headers: isMultipart
      ? { Accept: "application/json" }
      : { Accept: "application/json", "Content-Type": "application/json" },
    body: isMultipart ? payload : JSON.stringify(payload),
  });

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error(`Form submission failed (${res.status}). Please try again.`);
  }

  if (!res.ok) {
    throw new Error(data?.message || `Form submission failed (${res.status}).`);
  }

  return data;
}

// ── Public API helpers ────────────────────────────────────────

export function submitContactForm(payload) {
  return submitForm("/vtech/v1/contact", payload);
}

export function submitNewsletterForm(payload) {
  return submitForm("/vtech/v1/newsletter", payload);
}

/** Header + Footer data (served by vtech-core plugin) */
export function getLayout() {
  return request("/vtech/v1/layout");
}

/** All frontend pages registered in the plugin */
export function getVtechPages() {
  return request("/vtech/v1/pages");
}

/**
 * A single page's content:
 *   { slug, hero, sections: [{ type, order, data }] }
 * @param {string} slug  e.g. "home", "about"
 */
export function getVtechPage(slug) {
  return request(`/vtech/v1/page/${encodeURIComponent(slug)}`);
}

// ── Standard WordPress REST helpers ──────────────────────────

export function getPosts({ perPage = 6, page = 1 } = {}) {
  return request("/wp/v2/posts", {
    params: { per_page: perPage, page, _embed: 1 },
  });
}

export function getProjects({ perPage = 6 } = {}) {
  return request("/wp/v2/project", { params: { per_page: perPage, _embed: 1 } });
}

export async function getPageBySlug(slug) {
  const data = await request("/wp/v2/pages", { params: { slug } });
  return Array.isArray(data) ? data[0] : data;
}

export default {
  request,
  submitContactForm,
  submitNewsletterForm,
  getLayout,
  getVtechPages,
  getVtechPage,
  getPosts,
  getProjects,
  getPageBySlug,
  isApiConfigured,
};
