// WordPress REST API client.
//
// Set VITE_WP_API_URL in a .env file to your WordPress site root, e.g.:
//   VITE_WP_API_URL=http://localhost/Vtecheasy/Vtecheasy-Backend
//
// WordPress REST requests use the standard /wp-json/<namespace>/<route> URLs.
// Until a URL is set, requests are skipped and the UI uses the dummy data in
// src/data/siteData.js.

const RAW_BASE = import.meta.env.VITE_WP_API_URL || "";
// Normalise: strip trailing slash and any trailing /wp-json so we always
// hold the site root here.
const BASE_URL = RAW_BASE.replace(/\/+$/, "").replace(/\/wp-json$/, "");

// REST URL form:
//   - "query"  -> https://site/?rest_route=/vtech/v1/... (works on ANY WP,
//                 no pretty-permalink dependency — safest on shared hosts).
//   - "path"   -> https://site/wp-json/vtech/v1/... (needs pretty permalinks).
// Default to the universal query form unless explicitly set to "path".
// Localhost always uses the query form. Override with VITE_WP_REST_MODE.
const REST_MODE = String(import.meta.env.VITE_WP_REST_MODE || "").toLowerCase();
const USE_QUERY_REST_ROUTE = REST_MODE !== "path";

export const isApiConfigured = Boolean(BASE_URL);

/** @param {string} route REST route; @param {object} params extra query params */
function restUrl(route, params = {}) {
  const url = USE_QUERY_REST_ROUTE
    ? new URL(`${BASE_URL}/`)
    : new URL(`${BASE_URL}/wp-json${route}`);
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

async function request(route, { params } = {}) {
  if (!isApiConfigured) {
    throw new Error("WordPress API URL is not configured (VITE_WP_API_URL).");
  }

  const res = await fetch(restUrl(route, params), {
    cache: "no-store",
    headers: { Accept: "application/json" },
  });

  if (!res.ok) {
    throw new Error(`WordPress request failed: ${res.status} ${res.statusText}`);
  }

  return res.json();
}

async function submitForm(route, payload) {
  if (!isApiConfigured) {
    throw new Error("The form service is not configured. Please contact us directly.");
  }

  const isMultipart = payload instanceof FormData;
  const res = await fetch(restUrl(route), {
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

export function submitContactForm(payload) {
  return submitForm("/vtech/v1/contact", payload);
}

export function submitNewsletterForm(payload) {
  return submitForm("/vtech/v1/newsletter", payload);
}

// --- VTech layout (Header + Footer, served by the vtech-core plugin) ---

export function getLayout() {
  return request("/vtech/v1/layout");
}

// --- VTech page builder (per-page hero + ordered reusable sections) ---

/** List of frontend pages registered in the plugin. */
export function getVtechPages() {
  return request("/vtech/v1/pages");
}

/**
 * A single page's content: { slug, hero, sections: [{ type, order, data }] }.
 *
 * @param {string} slug e.g. "home", "about".
 */
export function getVtechPage(slug) {
  return request(`/vtech/v1/page/${encodeURIComponent(slug)}`);
}

// --- Example core endpoint helpers (ready for future sections) ---

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
