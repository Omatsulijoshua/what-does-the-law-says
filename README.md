# What Does Nigerian Law Say?

A Nigerian legal information assistant with plain-English explanations, a searchable law library, source links and saved conversations.

## Brand assets

- public/brand/law-symbol.svg: application icon, favicon and welcome-screen mark.
- public/brand/law-wordmark.svg: horizontal logo on a dark background.
- public/brand/social-card.svg: 1200 x 630 vector banner. Export to PNG/JPEG for social platforms that require raster previews.

The identity uses forest green, warm gold and a scales-of-justice symbol. These are original vector assets and can be resized without losing detail.

## Run locally

Run npm install followed by npm run dev. Vite serves the frontend at http://localhost:5173.

For the Express backend, run npm install and npm start from the server directory. Configure server/.env using server/.env.example. Frontend configuration belongs in .env.local; see .env.example for settings. Set a server-side AI provider key for generated answers. Firebase configuration enables Google sign-in.

## Deployment

The admin interface is a separate page at `/admin/`, with its code, styles and Express admin routes in the root `admin/` folder. See [admin/README.md](admin/README.md). It is not linked from the public interface.

The frontend runs on Vercel at https://what-does-nigeria-law-says.thispage.xyz/ and calls the Express backend on Render at https://what-does-nigeria-law-says-api.onrender.com. VITE_API_URL is set to that backend origin in Vercel Production. The legacy api/ serverless entry is excluded from Vercel uploads; chat, analytics, articles and admin API requests use Render.

Express admin endpoints require ADMIN_EMAIL and ADMIN_PASSWORD in the backend environment. The dashboard submits the credentials entered at sign-in; there are no built-in admin credentials. Admins sign in again after refreshing. Do not put backend credentials into VITE_* variables.

The custom public domain is configured in canonical/sharing metadata and Firebase's authorized-domain list. SVG social preview support varies; the banner is supplied as a vector source asset. Render uses the free plan with an ephemeral filesystem; use a persistent disk or database before relying on analytics or articles to survive restarts and redeploys.

## Checks

- npm run build
- npm run lint
- npm test

## Legal content

See [LEGAL_CONTENT_REVIEW.md](LEGAL_CONTENT_REVIEW.md) for reviewed corrections, references and remaining verification work. The library contains editorial summaries. It does not perform live statutory research, and generated answers require checking against applicable law and current amendments.

This service provides legal information and does not establish a lawyer-client relationship. Consult a Nigerian legal practitioner for advice on your circumstances.
