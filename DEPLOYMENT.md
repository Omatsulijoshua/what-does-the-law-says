# Deployment status

The production frontend is https://what-does-nigeria-law-says.thispage.xyz/ and its admin page is https://what-does-nigeria-law-says.thispage.xyz/admin/. The Vercel alias https://what-does-nigerian-law-say.vercel.app/ remains available.

The backend is https://what-does-nigeria-law-says-api.onrender.com (Render service `srv-dbais6k9v7es738mhs5g`). Vercel Production uses that URL for `VITE_API_URL`. Render builds from the private repository https://github.com/Omatsulijoshua/what-does-nigerian-law-say using `npm ci --prefix server --omit=dev` and starts `node server/index.js` from the repository root, so shared `src/` and `admin/` modules are available.

The Vercel project is `what-does-nigerian-law-say` in the `joshua-omatsuli-projects` team. The local `.vercel/` link and `.env.local` are ignored. Redeploy with `vercel deploy --prod --yes` after configuration changes.

## Google sign-in

The application now uses real Firebase Google authentication. There is no simulated user fallback.

Configured on 18 October 2026:

- Firebase project: `what-does-nigerian-law-say` (Spark plan).
- Web app: `Nigerian Law Web`.
- Google provider: enabled, using the app's public name and project owner's support email.
- Production hosts: the Vercel alias and `what-does-nigeria-law-says.thispage.xyz` are authorized in Firebase Authentication. Localhost and 127.0.0.1 are also authorized for development.
- Firebase Web app configuration: saved in local ignored settings and the Vercel Production environment, then rebuilt and deployed.
- Firebase's authentication endpoint returned HTTP 200 and a Google authorization URI for the production site. A real Google account sign-in still needs a user to complete the account chooser in their browser.

The steps below describe how to reproduce or change the setup:

1. Create a Firebase project and register a Web app.
2. Enable **Authentication → Sign-in method → Google**, select a project support email and save.
3. Under Authentication settings, add `what-does-nigerian-law-say.vercel.app` to **Authorized domains**. Add any custom domain separately, and `localhost` / `127.0.0.1` when testing locally.
4. Add the Web app config to Vercel's **Production** environment: `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, and `VITE_FIREBASE_APP_ID`. Optional config fields are listed in `.env.example`.
5. Redeploy. Vite embeds the public Web app config at build time.
6. Verify the Google account chooser, successful session, refresh persistence and sign-out using a real account. The user must complete their own Google login.

Firebase Web config is browser-visible by design. Never add a service-account private key or AI-provider secret to a `VITE_*` variable. Conversations currently stay in browser storage; sign-in does not provide cross-device chat synchronization.

Official guide: https://firebase.google.com/docs/auth/web/google-signin

## AI chat

Set at least one nonempty server-side key (`GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENAI_API_KEY`) in the Render service's Environment settings. Set the corresponding model variable to an available model. Redeploy/restart the Render service and test `/api/chat` using a general question. No working AI credentials were available during initial setup.

## Admin backend

The admin page and Express management APIs are deployed. The backend loads administrator credentials from the Render secret file `/etc/secrets/backend.env`; local credentials are in the ignored `.vercel/admin-credentials.txt` file. Admin login and the CORS preflight from the custom frontend domain were checked successfully.

Render is using the free plan. Its filesystem is ephemeral: analytics and published articles currently do not survive all restarts/redeploys. The server supports `DATA_DIR` for a persistent disk when one is provisioned; a durable database is another option. No paid disk was provisioned.
