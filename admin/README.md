# Admin workspace

Open `/admin/` directly. The public page does not include an admin link or import the dashboard bundle.

- `index.html` and `main.jsx`: separate Vite page and React entry point.
- `AdminDashboard.jsx`: administrator login, analytics, publishing and AI settings.
- `styles.css`: administration-specific styles.
- `routes.js`: Express admin API registration, imported only by `server/index.js`.
- `redirect.js`: local development and preview redirect from `/admin` to `/admin/`.

The existing `/api/admin/*` URLs and backend credential requirements are unchanged. Configure `ADMIN_EMAIL` and `ADMIN_PASSWORD` in the Express server environment and point `VITE_API_URL` to that server if it runs on a different origin. Vercel's chat function alone does not provide the Express admin endpoints.

Run the normal root build command to produce both `dist/index.html` and `dist/admin/index.html`. Hosts should serve `/admin/` from the latter; static hosts without directory-index support can use `/admin/index.html`.
