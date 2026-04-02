# SroVMeas — React Frontend

> The production web frontend for the Rice Paddy Disease Decision Support System.

**Live URL:** https://rice-dss.vercel.app

---

## Stack

| Tool | Version | Purpose |
|------|---------|---------|
| React | 18 | UI framework |
| React Router | v6 | Client-side routing + navigation guards |
| Vite | 8.0.3 | Build tool + dev server |
| Tailwind CSS | v4.2.2 | Utility CSS via `@tailwindcss/vite` plugin |
| Firebase | v11 | Authentication (Google + Email/Password) |
| Axios | — | API client (`src/api/client.js`) |
| Lucide React | — | Icons |

**Fonts:** Playfair Display (headings, italic), Inter (body) via Google Fonts.

---

## Local Development

```bash
cd frontend
npm install
npm run dev       # → http://localhost:3000
```

The dev server proxies `/api` → `http://localhost:8000` (configured in `vite.config.js`). Start the backend first:

```bash
# From rice_dss/
uvicorn api.main:app --reload --port 8000
```

---

## Environment Variables

Create `frontend/.env.local` (gitignored):

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_STORAGE_BUCKET=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
VITE_API_URL=https://rice-dss-137747818788.asia-southeast1.run.app
```

In production (Vercel), set all `VITE_*` keys in the Vercel dashboard under Settings → Environment Variables. `VITE_API_URL` must point to the live Cloud Run backend.

---

## Deployment (Vercel)

The frontend is deployed to Vercel and linked to the `main` branch. Every `git push` to `main` triggers an automatic rebuild and deploy — no manual step needed.

**After deploying, add the Vercel domain to Firebase:**
- Firebase Console → Authentication → Settings → Authorized domains → Add `rice-dss.vercel.app`
  (required for Google sign-in to work on the live site)

---

## Project Structure

```
frontend/src/
├── api/
│   └── client.js              Axios instance — baseURL from VITE_API_URL or /api proxy
├── context/
│   ├── AuthContext.jsx         Firebase auth state (user, isAuthenticated, login/logout)
│   └── LanguageContext.jsx     EN/KM i18n — lang, switchLang, isTransitioning, t()
├── components/layout/
│   ├── Navbar.jsx              Sticky nav, Google avatar, Services dropdown, mobile menu
│   ├── Footer.jsx              Links + language toggle
│   └── Layout.jsx              Page wrapper — Navbar + <Outlet> with fade transition + Footer
├── pages/
│   ├── Landing.jsx             Hero (full-viewport), services, how-it-works, resources, CTA
│   ├── SignIn.jsx              Firebase sign-in (Google + email/password)
│   ├── SignUp.jsx              Firebase registration
│   ├── SearchResults.jsx
│   ├── CropIntegration.jsx
│   ├── NotFound.jsx            404 page — shown for any unmatched route
│   ├── Detection/
│   │   ├── Step1Upload.jsx     Mode selector + image upload + rice-leaf warning
│   │   ├── Step2Questions.jsx  Mode-aware questionnaire + nav guard
│   │   └── Step3Results.jsx    Diagnosis card, Grad-CAM tabs, recommendations, skeleton loading
│   ├── Learning/
│   │   ├── ResourcesList.jsx
│   │   ├── ArticleDetail.jsx
│   │   └── VideoDetail.jsx
│   └── Experts/
│       └── ExpertsPage.jsx     Experts, suppliers, treatments — dark header banner layout
├── data/
│   └── translations.js         ~500+ keys, full EN + KM for all pages
├── firebase.js                 Firebase app init — exports auth, googleProvider, facebookProvider
├── App.jsx                     Routes + ScrollToTop
├── main.jsx                    React entry point
└── index.css                   Tailwind v4 @theme tokens + custom utilities
```

---

## Key Patterns

### Language System

- `LanguageContext.jsx` exposes `{ lang, setLang, switchLang, isTransitioning, t }`
- **Always use `switchLang(newLang)`** from UI components — it triggers a 130ms fade before swapping the language
- `setLang` exists but bypasses the fade — only use it internally
- `Layout.jsx` applies `opacity: isTransitioning ? 0 : 1` on `<main>` to create the fade effect
- All UI strings must come from `t('key')` — no hardcoded English in JSX

### Page Transitions

- Every route change triggers a `page-enter` CSS animation (fade + 8px slide-up, 0.22s)
- Implemented via `key={location.key}` on `<main>` in `Layout.jsx`
- `ScrollToTop` component in `App.jsx` scrolls to top on every navigation

### Detection Flow (Data Passing)

| Step | Data | Storage |
|------|------|---------|
| Step 1 → Step 2 | Mode, image previews | `sessionStorage['detect_mode']`, `sessionStorage['detect_images']` |
| Step 1 → Step 2 | Actual File objects | `window.__detectFiles` |
| Step 2 → Step 3 | Full DSS response JSON | `sessionStorage['detect_result']` |

Step 2 has a **navigation guard** — if `detect_mode` is not in sessionStorage, it redirects to `/detect` immediately.

**Mode-aware API routing in Step 2:**
| Mode | Images | Endpoint |
|------|--------|----------|
| hybrid | 1 | `POST /hybrid-image` |
| hybrid | 2+ | `POST /hybrid-images` |
| ml | 1 | `POST /predict-image` |
| ml | 2+ | `POST /predict-images` |
| questionnaire | 0 | `POST /questionnaire` |

### Firebase Auth

- `AuthContext.jsx` uses `onAuthStateChanged` — handles session persistence automatically
- Google sign-in: uses `user.photoURL` for avatar in Navbar (`referrerPolicy="no-referrer"` required)
- Email users: letter-initial fallback avatar
- Loading state: green spinner shown while Firebase checks session (prevents flash of unauthenticated state)

### OOD Warning (Step 1)

When hybrid or ML-only mode is selected, an amber warning banner reminds users to upload actual rice leaf photos. The backend rejects images with low ML confidence (< 0.80 on top class) with a 422 error.

---

## Design Tokens

Defined in `src/index.css` under `@theme`:

| Token | Value | Use |
|-------|-------|-----|
| `primary-600` | `#558b2f` | Filled buttons, active states |
| `primary-700` | `#33691e` | Outline button text |
| `primary-900` | `#1a2e1a` | Footer dark background |
| `accent` | `#c5a028` | Gold accent — underlines, icon highlights |

**Important:** Use inline styles for borders and shadows — Tailwind v4 utility classes produce barely visible defaults for these properties.

---

## Design Conventions

- **Headings:** `font-heading` class (Playfair Display), italic, bold
- **Cards:** `border-radius: 16px`, `border: 1px solid #bdbdbd`, `box-shadow` inline
- **Buttons:** `border-radius: 8px`, inline styles always
- **Hover lift:** `.hover-lift` class (defined in `index.css`) — `translateY(-3px)` on hover
- **Section dividers:** `h-1` gradient bar (green → gold)
- **Step cards (How It Works):** Gold gradient background (`#b8910c → #c5a028 → #d4b438`)
