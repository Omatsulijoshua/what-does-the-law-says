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

api/chat.js provides the Vercel chat endpoint. Production requests use the current site origin by default. To use a separate backend, configure VITE_API_URL or VITE_PRODUCTION_API_URL with its origin, for example https://api.example.com rather than a URL ending in /api.

Express admin endpoints require ADMIN_EMAIL and ADMIN_PASSWORD in the backend environment. The dashboard submits the credentials entered at sign-in; there are no built-in admin credentials. Admins sign in again after refreshing. Do not put backend credentials into VITE_* variables.

Add your public domain to canonical and sharing metadata when deploying. SVG social preview support varies; the banner is supplied as a vector source asset.

## Checks

- npm run build
- npm run lint
- npm test

## Legal content

See [LEGAL_CONTENT_REVIEW.md](LEGAL_CONTENT_REVIEW.md) for reviewed corrections, references and remaining verification work. The library contains editorial summaries. It does not perform live statutory research, and generated answers require checking against applicable law and current amendments.

This service provides legal information and does not establish a lawyer-client relationship. Consult a Nigerian legal practitioner for advice on your circumstances.
