# ⚖️ What Does Nigerian Law Say?

[![Live Site](https://img.shields.io/badge/Live_Site-what--does--nigeria--law--says.thispage.xyz-103b2b?style=for-the-badge&logo=google-chrome&logoColor=white)](https://what-does-nigeria-law-says.thispage.xyz/)
[![React](https://img.shields.io/badge/React_19-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite_8-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org/)
[![Express](https://img.shields.io/badge/Express_4-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com/)
[![Firebase](https://img.shields.io/badge/Firebase_Auth-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Tests](https://img.shields.io/badge/Tests-Passing-brightgreen?style=for-the-badge&logo=node.js)](https://nodejs.org/api/test.html)

> **Understand Nigerian law in plain English.** Explore citizen rights, statutory summaries, authoritative source citations, and practical next steps without confusing legal jargon.

---

## 🌐 Live Deployments

- **Public Application:** [what-does-nigeria-law-says.thispage.xyz](https://what-does-nigeria-law-says.thispage.xyz/) *(Alternative mirror: [what-does-nigerian-law-say.vercel.app](https://what-does-nigerian-law-say.vercel.app/))*
- **Admin Dashboard:** [admin.what-does-nigeria-law-says.thispage.xyz](https://admin.what-does-nigeria-law-says.thispage.xyz/) *(or directly at `/admin/`)*
- **Backend API:** [what-does-nigeria-law-says-api.onrender.com](https://what-does-nigeria-law-says-api.onrender.com)

---

## 🌟 Key Features

- **🤖 AI-Powered Legal Assistant:** Multi-model AI support (Google Gemini, Groq, OpenAI) tailored with Nigerian statutory context, case law citations, and plain-English translation of legal terminology.
- **📖 Searchable Law Library & Explorer:** Curated access to foundational Nigerian laws, including:
  - 1999 Constitution of the Federal Republic of Nigeria (as amended)
  - Administration of Criminal Justice Act (ACJA 2015)
  - Police Act 2020 & Citizen Arrest Protections
  - Cybercrimes (Prohibition, Prevention, etc.) Act
  - Labour Act & Tenancy Laws (e.g., Lagos State Tenancy Law)
  - Companies and Allied Matters Act (CAMA 2020)
- **🎙️ Voice Chat & Speech-to-Text (Deepgram Nova-2):** Hands-free voice query input powered by Deepgram Nova-2 model with intelligent punctuation, live recording feedback, and built-in Text-to-Speech (TTS) audio playback for legal responses.
- **🔒 Google Authentication:** Secure user authentication powered by Firebase Auth for seamless login and personalized experience.
- **💬 Conversation History & Management:** Save, manage, export, and revisit consultation history with local persistence and migration support.
- **🛡️ Secure Admin Portal:** Dedicated administrative dashboard at `/admin/` for content management, viewing analytics, managing articles, and monitoring AI provider metrics.
- **🎨 Bespoke Nigerian Visual Identity:** Designed with a refined palette featuring forest green, warm gold, Nigerian coat of arms watermark, and custom vector scales-of-justice emblems.

---

## 🛠️ Architecture & Tech Stack

```text
┌─────────────────────────────────┐         ┌─────────────────────────────────┐
│     Client (Vercel)             │         │     Backend (Render)            │
│  • React 19 + Vite 8            │ ◄─────► │  • Node.js + Express            │
│  • Firebase Google Auth         │ HTTP/   │  • Gemini / Groq / OpenAI AI    │
│  • Local Storage & Search Cache │ REST    │  • Admin Routes & Analytics     │
│  • Separate /admin/ Portal      │         │  • Rate Limiting & CORS         │
└─────────────────────────────────┘         └─────────────────────────────────┘
```

### Frontend
- **Framework:** [React 19](https://react.dev/) + [Vite 8](https://vitejs.dev/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Authentication:** [Firebase Web SDK v10](https://firebase.google.com/docs/web/setup)
- **Typography:** Playfair Display (editorial headings) & Inter (clean UI typography)

### Backend
- **Runtime:** [Node.js](https://nodejs.org/) (native Node test runner & ES Modules)
- **Framework:** [Express 4](https://expressjs.com/)
- **AI Integration:** `@google/generative-ai` (Gemini 2.5/3.5/3.8 Flash), Groq API, OpenAI API
- **Speech-to-Text:** [Deepgram API](https://deepgram.com/) (Nova-2 model with smart formatting)
- **Deployment & Hosting:** Vercel (Frontend SPA & Admin) + Render (Express Web Service)

---

## 📁 Repository Structure

```text
what-does-the-law-says/
├── admin/                  # Admin portal (Vite entry, React views, Express admin routes)
│   ├── AdminDashboard.jsx  # Admin analytics, publishing & AI configuration
│   ├── index.html          # Admin entry page
│   └── routes.js           # Express admin endpoints
├── api/                    # Vercel Serverless Functions (/api/chat, /api/transcribe)
│   ├── chat.js             # Serverless multi-provider AI chat handler
│   └── transcribe.js       # Serverless Deepgram voice transcription endpoint
├── public/                 # Static assets & brand emblems
│   ├── brand/              # Vector logos, icons, and social share cards
│   └── favicon.ico
├── server/                 # Express backend API
│   ├── index.js            # Express server, AI chat handlers, CORS & fallback logic
│   ├── package.json        # Server dependencies
│   └── .env.example        # Server environment variables template
├── src/                    # Frontend React source code
│   ├── components/         # ChatAssistant, DocumentExplorer, AuthManager, etc.
│   ├── config/             # Firebase and client configuration
│   ├── data/               # Curated legal datasets & statutory references
│   ├── utils/              # API clients, voiceService, search indexes, policy checkers
│   ├── App.jsx             # Main application orchestrator
│   └── main.jsx            # React root mount point
├── tests/                  # Integration and unit tests (Node test runner)
├── .env.example            # Client environment variables template
├── DEPLOYMENT.md           # Production deployment and infrastructure guide
├── LEGAL_CONTENT_REVIEW.md # Statutory verification & legal editorial notes
├── package.json            # Client dependencies and npm scripts
└── vite.config.js          # Multi-page Vite configuration (main app + admin)
```

---

## 🚀 Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (version 18.0.0 or higher recommended)
- `npm` (bundled with Node.js)
- A Google AI Studio key ([Gemini API Key](https://aistudio.google.com/)) or OpenAI/Groq API key
- A Firebase project with Google Sign-In enabled ([Firebase Console](https://console.firebase.google.com/))

### 1. Clone the Repository

```bash
git clone https://github.com/Omatsulijoshua/what-does-the-law-says.git
cd what-does-the-law-says
```

### 2. Configure Environment Variables

#### Client Configuration (Root)
Create `.env.local` in the project root by copying `.env.example`:

```bash
cp .env.example .env.local
```

Fill in your Firebase credentials and set the API URL:
```env
VITE_FIREBASE_API_KEY=your_firebase_api_key
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
VITE_FIREBASE_APP_ID=your_app_id
VITE_API_URL=http://localhost:5000
```

#### Backend Configuration (`server/`)
Create `server/.env` by copying `server/.env.example`:

```bash
cp server/.env.example server/.env
```

Configure your AI provider keys and admin credentials:
```env
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash
DEEPGRAM_API_KEY=your_deepgram_api_key_here
PORT=5000
NODE_ENV=development
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=your_secure_password
FRONTEND_ORIGINS=http://localhost:5173
```

---

### 3. Install Dependencies & Run

#### Start Backend
```bash
cd server
npm install
npm run dev
```
The backend will run on `http://localhost:5000`.

#### Start Frontend
In a new terminal window at the project root:
```bash
npm install
npm run dev
```
The client will be served at `http://localhost:5173`.

---

## 🧪 Testing & Code Quality

Run tests using the native Node test runner:
```bash
npm test
```

Check code standards using ESLint:
```bash
npm run lint
```

Build for production:
```bash
npm run build
```

---

## 🔐 Admin Workspace

The administrator dashboard allows authorized managers to:
- Review real-time visitor and prompt analytics.
- Publish and manage legal explainers and articles.
- Inspect and test active AI models and provider fallback routes.

Access the admin dashboard locally at `http://localhost:5173/admin/` or in production at `https://admin.what-does-nigeria-law-says.thispage.xyz/`. Authentication requires backend `ADMIN_EMAIL` and `ADMIN_PASSWORD` credentials.

---

## ⚖️ Legal Disclaimer

> [!IMPORTANT]
> **This platform is for informational and educational purposes only.**  
> Content generated by the AI assistant and summarized in the law library does **not** constitute formal legal advice, nor does using this service establish a lawyer-client relationship. Nigerian law is subject to ongoing statutory amendments and judicial interpretations. For actionable counsel regarding specific legal disputes or matters, always consult a qualified Nigerian legal practitioner registered with the Nigerian Bar Association (NBA).

---

## 📄 License

This project is licensed under the [MIT License](LICENSE) (or proprietary terms specified by the author).

## 👨‍💻 Author

Created and maintained by **[Joshua Omatsuli](https://github.com/Omatsulijoshua)**.
- GitHub: [@Omatsulijoshua](https://github.com/Omatsulijoshua)
- Live Project: [what-does-nigeria-law-says.thispage.xyz](https://what-does-nigeria-law-says.thispage.xyz/)
