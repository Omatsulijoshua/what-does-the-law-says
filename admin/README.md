# Admin workspace

Open `/admin/` directly. The public page does not include an admin link or import the dashboard bundle.

- `index.html` and `main.jsx`: separate Vite page and React entry point.
- `AdminDashboard.jsx`: administrator login, analytics, publishing and AI settings.
- `styles.css`: administration-specific styles.
- `routes.js`: Express admin API registration, imported only by `server/index.js`.
- `redirect.js`: local development and preview redirect from `/admin` to `/admin/`.

The `/api/admin/*` APIs run on the Render backend at `https://what-does-nigeria-law-says-api.onrender.com`. The public admin page is `https://what-does-nigeria-law-says.thispage.xyz/admin/`. Vercel Production points `VITE_API_URL` to Render. `ADMIN_EMAIL` and `ADMIN_PASSWORD` are provided to the backend through its Render secret file. The generated login details are kept in the ignored local `.vercel/admin-credentials.txt` file.

Run the normal root build command to produce both `dist/index.html` and `dist/admin/index.html`. Hosts should serve `/admin/` from the latter; static hosts without directory-index support can use `/admin/index.html`.
