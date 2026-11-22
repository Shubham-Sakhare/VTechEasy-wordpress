# Tech Easy Chat Assistant

A rule-based guided chatbot and lead manager for WordPress. It does not call an
external AI API. The plugin includes a WordPress shortcode and a REST API for a
separately hosted React frontend.

## Folder structure

```text
techeasy-chat-assistant/
|-- techeasy-chat-assistant.php
|-- README.md
|-- uninstall.php
|-- assets/
|   |-- admin.css
|   |-- admin.js
|   |-- widget.css
|   `-- widget.js
`-- includes/
    |-- admin.php
    |-- database.php
    |-- defaults.php
    |-- rest.php
    `-- shortcode.php
```

## Install

1. Copy the `techeasy-chat-assistant` folder into
   `wp-content/plugins/` (or zip that folder and upload it in **Plugins →
   Add New → Upload Plugin**).
2. Activate **Tech Easy Chat Assistant** in **Plugins**. Activation creates
   the lead table and installs editable default topics, answers and links.
3. Open **WP Admin → Chat Assistant → Settings**. Set the notification
   recipient(s) (defaults to `vtecheasy@gmail.com`), avatar/color/position,
   contact links and any custom answers.
4. For a separately hosted frontend, enter its exact origin under **Allowed
   React frontend origins**, for example `https://www.example.com` (no path or
   trailing slash). Add the local development origin too if needed, e.g.
   `http://localhost:5173`. The WordPress site's own origin works without a
   CORS allowlist entry.
5. Configure WordPress SMTP if needed, then test a lead before publishing.
6. To place the widget on a WordPress page, add the shortcode
   `[techeasy_chat]`. Do not add the shortcode to a page that already mounts the
   React widget, or visitors will see two widgets.

## React frontend

The plugin API uses the existing `VITE_WP_API_URL` WordPress site-root
configuration. Do not append `/wp-json`.

```env
VITE_WP_API_URL=https://your-wordpress-site.example/backend
VITE_WP_REST_MODE=query
```

`query` mode calls:

```text
GET  https://your-wordpress-site.example/backend/?rest_route=/techeasy-chat/v1/config
POST https://your-wordpress-site.example/backend/?rest_route=/techeasy-chat/v1/leads
```

The `path` mode uses `/wp-json/techeasy-chat/v1/...` and requires WordPress
pretty permalinks. The React widget is `Frontend/src/components/ChatWidget.jsx`
and is mounted by the existing site layout. Build and deploy the frontend after
changing it. For cross-origin production use, the frontend origin must match an
entry saved in the plugin settings.

The public config response does not include notification addresses, webhook
URLs, or allowed origins. Lead submissions accept JSON and use the same REST
endpoints as the shortcode. Public submissions are limited to five per IP per
hour and include a honeypot field.

## Lead administration and data retention

Open **WP Admin → Chat Assistant → Leads** to search leads, filter by service
and date, update status (New, Contacted, Closed), delete records, or export the
filtered results as CSV. Leads are stored in the custom
`wp_techeasy_chat_leads` table (using the active WordPress table prefix).

Uninstalling the plugin preserves its settings and lead table by default. To
drop the table and remove plugin settings during uninstall, enable **Delete
chatbot settings and leads when this plugin is uninstalled** before uninstalling.

## Flow test checklist

1. Open the widget: welcome message and all quick-question buttons appear.
2. Select Web Development: its guided intro and five options appear.
3. Select Business Website: its answer, related Q&A buttons, remaining options,
   Back to services, and helpful prompt appear.
4. Select a related question: the linked answer and its own related questions
   appear; repeat for another related question.
5. Select Yes: the free-quote question appears. Get a Free Quote starts the
   conversational form; No, thanks leaves the contact links available.
6. Select No: the apology appears and the enquiry form starts.
7. Select Other or Talk to Our Team: the form opens directly, with the selected
   service prefilled when available.
8. Type a keyword question: the highest keyword match answers; an unmatched
   query shows the fallback and starts the enquiry form.
9. Complete the form: test service selection, name, invalid/valid email,
   invalid/valid mobile (10 digits or `+91`), interest, optional message and
   successful send. Confirm a lead row, email and optional webhook request.
10. Submit six leads from the same IP in an hour: the sixth should receive HTTP
    429. Submit with the honeypot populated: it should be accepted without
    creating a lead.
11. Test the shortcode on a WordPress page and the React widget on an allowed
    origin. Confirm an unlisted cross-origin site cannot read or submit through
    the API.
12. On the Leads screen, search, service/date-filter, change statuses, delete
    a test record and export CSV.
