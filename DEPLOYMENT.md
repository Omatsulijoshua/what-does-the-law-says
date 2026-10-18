# Deployment status

The production site is https://what-does-nigerian-law-say.vercel.app/ and its separate admin page is https://what-does-nigerian-law-say.vercel.app/admin/.

The Vercel project is `what-does-nigerian-law-say` in the `joshua-omatsuli-projects` team. The local `.vercel/` link and `.env.local` are ignored. Redeploy with `vercel deploy --prod --yes` after configuration changes.

## Google sign-in

The application now uses real Firebase Google authentication. There is no simulated user fallback.

Configured on 18 October 2026:

- Firebase project: `what-does-nigerian-law-say` (Spark plan).
- Web app: `Nigerian Law Web`.
- Google provider: enabled, using the app's public name and project owner's support email.
- Production host: authorized in Firebase Authentication.
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

Set at least one nonempty server-side key (`GEMINI_API_KEY`, `GROQ_API_KEY`, or `OPENAI_API_KEY`) in the Vercel project. Set the corresponding model variable to an available model. Redeploy and test `/api/chat` using a general question. No working AI credentials were available during the initial deployment.

## Admin backend

The admin **page** is deployed. Its analytics, publishing and AI-settings APIs still require the Express server described in `admin/README.md`; they are not supplied by the Vercel chat function. To enable them, deploy that server and set `VITE_API_URL` to its origin before rebuilding. Set `ADMIN_EMAIL` and `ADMIN_PASSWORD` only in that server's environment.
