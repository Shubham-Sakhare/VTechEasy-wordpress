# Vtecheasy

Portfolio / agency website front-end for **Tech Easy**, built with React + Vite + Tailwind CSS.
The UI is designed to pull its content from a **WordPress REST API** backend, with dummy data used until the backend is ready.

## Tech stack

- **React 19** + **Vite 8**
- **Tailwind CSS v4** (via `@tailwindcss/vite`)
- **react-icons** for iconography
- Google Fonts: Poppins + Sora

## Getting started

```bash
npm install
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build
npm run preview  # preview the build
npm run lint     # run ESLint
```

## Deploying to InfinityFree

Run `npm run build`, then upload the **contents** of `dist/` into the
`htdocs/` directory. The production build uses the domain root as its asset
base, and the included `.htaccess` rewrites client-side routes to `index.html`
so pages also work when opened or refreshed directly. It excludes `/backend/`
so WordPress requests are not rewritten to the frontend.

The build splits route pages into separate JavaScript chunks. The root
`/sitemap.xml` URL is rewritten to a public VTech WordPress endpoint, which
generates the sitemap from current pages, services, projects, and published
blog articles. Deploy the updated frontend `.htaccess` and activate the updated
VTech Core plugin for dynamic sitemap output. Set **VTech Layout → Settings →
Frontend Origin** when the frontend uses a different domain from WordPress.

Unknown routes render a not-found page and are marked `noindex`. The static
hosting rewrite still serves the React shell, so the HTTP response status for
an unknown route may remain 200 unless the hosting server is configured to
return a real 404 status.

For clean WordPress REST URLs, upload `Vtecheasy-Backend/.htaccess` to
`htdocs/backend/.htaccess`, then visit **WP Admin → Settings → Permalinks** and
save the current setting once to refresh WordPress rewrite rules. API routes
then use URLs such as
`https://your-domain.com/backend/wp-json/vtech/v1/page/home`.

## Project structure

```
src/
  api/
    wordpress.js          # WordPress REST API client + endpoint helpers
  hooks/
    usePageContent.jsx    # route content from WordPress with offline fallback
  data/
    siteData.js           # local content used only when WordPress is unavailable
  components/
    ui/                   # shared visual controls
    layout/               # shared app shell and WordPress-driven header/footer
    sections/             # page-builder section renderers
  App.jsx                 # composes the home page
  index.css               # Tailwind theme, colors, gradients
```

## Connecting the WordPress backend

1. Copy `.env.example` to `.env`.
2. Set the WordPress **site root** (do not append `/wp-json` or `/wp-json/wp/v2`):

   ```
   VITE_WP_API_URL=https://your-wordpress-site.com
   ```

3. For production, configure `VITE_WP_API_URL` in your hosting provider's environment
   settings before building, then rebuild/redeploy the frontend. Vite embeds `VITE_*`
   values into the browser bundle, so never put passwords, tokens, or other secrets in them.

The variable is optional: when it is missing, the UI uses local fallback data
from `src/data/siteData.js`. When it is configured, the frontend waits for
WordPress content before rendering and does not substitute fallback content if
the API request fails.

## SEO metadata

The React app sets a title, meta description, canonical URL, robots directive,
Open Graph tags, and Twitter tags for each route. It uses route-specific defaults
and prefers Yoast's `yoast_head_json` when WordPress exposes it through REST.
For Yoast values to match, create WordPress Pages with the same slugs as the
React routes (`home`, `services`, `portfolio`, `about`, `pricing`, `blog`, and
`contact`); blog articles use the matching WordPress post slug, and portfolio
details use the matching project slug. If a matching entry or Yoast metadata is
unavailable, the React route defaults are used.

These tags are updated in the browser after the React app loads. For HTML
metadata to be present in the initial response for crawlers and social preview
bots that do not execute JavaScript, the frontend also needs server-side
rendering or prerendering.

The static shell includes Organization and WebSite structured data for the
Tech Easy brand and its VTechEasy aliases, plus `robots.txt` and a sitemap for
the main routes. Update the domain in `index.html`, `public/robots.txt`, and
`public/sitemap.xml` if the production domain changes. Submit the sitemap URL
in Google Search Console after deployment. Search rankings are determined by
search engines and cannot be guaranteed by metadata or structured data alone.

## Editing page content

With the `vtech-core` WordPress plugin active, edit About, Pricing, and Contact
content from their VTech Layout page screens. The Sections screen controls where
reusable sections appear and their order; enable a section on additional pages
there to reuse it. The frontend renders live section data without substituting
sample copy when a configured list is intentionally empty. Local fallback data
is still used when the API is unavailable.

## Forms and production setup

The Contact form and footer newsletter signup submit to the public
`/vtech/v1/contact` and `/vtech/v1/newsletter` WordPress endpoints. Both send
notification emails to the address configured under **WP Admin → VTech Layout
→ Settings** (defaults to `vtecheasy@gmail.com`). Newsletter submissions are
emailed as signup requests; connect a mailing-list provider separately if
subscribers should be added to an automated campaign list.

Contact form fields are managed under **WP Admin → VTech Layout → Contact**.
Add/reorder fields there without frontend code changes. Supported fields include
text, long text, email, phone, number, URL, dropdown, radio, checkbox, multiple
checkboxes, date/time, image, PDF, and document uploads. Dropdown/radio/checkbox
choices are entered one per line. Uploads are attached to the notification
email, limited to 8 MB per file (or the lower WordPress/PHP upload limit) and
5 files per submission; allowed formats are images (JPG/PNG/GIF/WEBP) and
documents (PDF/DOC/DOCX/TXT/CSV/XLS/XLSX).

Before deploying a separately hosted frontend, enter its exact origin in the
same VTech Settings screen (for example `https://www.example.com`, without a
path). For reliable email delivery, configure SMTP for WordPress and send a
test message from the live host. Form endpoints apply basic honeypot and
per-IP rate limiting; production deployments should also use HTTPS.

## Chat assistant

The floating assistant gives rule-based answers about services, project
timelines, pricing, apps, redesign, support, the portfolio, location, SEO, and
privacy. It is not a generative AI and has no per-message AI API cost. Visitors
can start a project enquiry; the assistant collects their name, project type,
one contact method (phone or email), and requirements/timeline one question at
a time. The chatbot asks for consent before sending the enquiry to the
configured WordPress notification email. After a send attempt, three options
appear whether email delivery succeeds or fails: WhatsApp opens a prefilled
message for the visitor to review and send, Instagram opens the Tech Easy
profile, and Contact opens the enquiry flow in the chat again. The site does
not send WhatsApp messages automatically.

The chatbot lead submission uses the `chat_assistant` mode of the WordPress
contact endpoint. Deploy the updated `vtech-core` plugin as well as the frontend
`dist/` files for this flow to work on the live site. The endpoint applies the
existing per-IP submission rate limit.

Edit the assistant in **WP Admin → VTech Layout → Chat Assistant**. The CMS
supports CRUD and ordering for quick questions, FAQ answers, FAQ page links,
post-enquiry icons and URLs, lead prompts, and fallback messages. The Contact
action uses one exclusive behavior at a time: open the form in the chat or
redirect to a configured URL. Chatbot content is served with the public
`/vtech/v1/layout` response.

## Images

Dummy images currently use `placehold.co` placeholders. Replace the `image` / `avatar`
fields in `src/data/siteData.js` (or the WordPress media URLs) with your real assets.
```
