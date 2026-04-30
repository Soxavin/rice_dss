# Rice DSS — Change Documentation

> Covers every significant change made after the initial ML/DSS system was built:
> why each change was made, what files were touched, and how everything connects.
> This document is the authoritative reference for the PostgreSQL extension,
> admin dashboard, content migration, deployment, and recent frontend features.

---

## Table of Contents

1. [Why This Was Built](#1-why-this-was-built)
2. [Architecture: Before vs After](#2-architecture-before-vs-after)
3. [The Auth Bridge — Firebase to Backend JWT](#3-the-auth-bridge)
4. [Database Schema](#4-database-schema)
5. [Backend: New Files](#5-backend-new-files)
6. [Frontend: New Files](#6-frontend-new-files)
7. [Frontend: Modified Files](#7-frontend-modified-files)
8. [Deployment & Infrastructure Fixes](#8-deployment--infrastructure-fixes)
9. [CI / Test Pipeline Fix](#9-ci--test-pipeline-fix)
10. [Manual Steps: Production Checklist](#10-manual-steps-production-checklist)
11. [Environment Variables Reference](#11-environment-variables-reference)
12. [Testing Checklist](#12-testing-checklist)

---

## 1. Why This Was Built

All public-facing content on the site — expert profiles, supplier listings,
educational articles — was hardcoded directly in the React frontend inside
`frontend/src/data/searchData.js`. Adding or editing anything required a code
change, a commit, and a Vercel redeploy.

Additionally, every analysis a user ran through the DSS was saved to Firestore
under `users/{uid}/analyses`, making it invisible to the admin — there was no
way to view aggregate usage data.

This extension adds:
1. A **PostgreSQL database** (hosted on Neon) with a proper schema for users,
   content, profiles, and analysis history
2. A **backend API** layer on top of it (new FastAPI routers)
3. A **React admin dashboard** at `/admin` for managing all content
4. A **migration of analysis history** from Firestore to PostgreSQL
5. **Public pages wired to the API** — ResourcesList, ArticleDetail, and
   ExpertsPage now all fetch live content from the backend

---

## 2. Architecture: Before vs After

### Before

```
User browser
    │
    ├─▶ Firebase Auth  (login / session)
    ├─▶ Firestore      (analysis history read/write, farm profile)
    ├─▶ FastAPI (Cloud Run)  ─▶  ML models + DSS logic
    └─▶ Hardcoded data in frontend  (experts, articles, suppliers)
```

### After

```
User browser
    │
    ├─▶ Firebase Auth  (login / session — unchanged)
    ├─▶ Firestore      (farm profile only — partial migration)
    ├─▶ FastAPI (Cloud Run)
    │       ├─▶  ML models + DSS logic  (unchanged — original endpoints untouched)
    │       ├─▶  Auth bridge  POST /auth/me  (Firebase ID token → backend JWT)
    │       ├─▶  Public API   GET /resources, /resources/:id, /profiles
    │       └─▶  Admin API    /admin/resources, /admin/profiles, /admin/users, /admin/analysis
    │                 │
    │                 └─▶ Neon PostgreSQL  (users, content, profiles, analysis history)
    │
    └─▶ Firebase Storage  (thumbnail / photo uploads from admin dashboard)

Admin browser
    │
    └─▶ /admin/*  (React admin dashboard — requires role=ADMIN in PostgreSQL)
```

**Key architectural shifts:**
- The FastAPI backend grew from a pure ML inference service to also being a
  content and user management API. The original 12 endpoints were not touched.
- Identity now lives in two places simultaneously: Firebase (for session) and
  PostgreSQL (for role/content ownership). They are linked by `firebase_uid`.
- Analysis history moved from Firestore → PostgreSQL, giving the admin visibility
  into usage patterns.
- Farm profile (variety, region, field size) still lives in Firestore — it is
  the one piece not migrated.

---

## 3. The Auth Bridge

This is the most non-obvious part of the system. Here is the full flow:

```
1. User signs in via Firebase (Google or email/password) — same as before.

2. onAuthStateChanged fires in AuthContext.jsx.

3. AuthContext calls _exchangeForBackendJWT():
   - Gets a short-lived Firebase ID token via firebaseUser.getIdToken()
   - POSTs it to POST /auth/me  as  Authorization: Bearer <firebase_id_token>

4. Backend (api/routers/auth.py) receives the request:
   - Verifies the Firebase ID token using Firebase Admin SDK
     (firebase_auth.verify_id_token())
   - Looks up the user in the PostgreSQL `users` table by firebase_uid
   - If first login: creates a new User row with role=USER
   - Returns a backend JWT (HS256, 24-hour expiry)

5. AuthContext caches the backend JWT in a React ref (backendTokenRef).

6. AuthContext also calls GET /auth/me with the backend JWT to read the
   user's role. If role=ADMIN, sets isAdmin=true in context.

7. All admin API calls use getBackendToken() from context, which returns
   the cached JWT or re-exchanges if the cache is empty.
```

**Why two tokens?**  
Firebase ID tokens are short-lived (~1h) and are meant for Firebase services.
The backend JWT gives full control: custom claims, role checks, and revocability
by rotating `JWT_SECRET`.

**Relevant files:**
- `api/routers/auth.py` — the exchange endpoint
- `api/dependencies/auth.py` — `get_current_user()`, `require_admin()` used by all protected routes
- `frontend/src/context/AuthContext.jsx` — `_exchangeForBackendJWT()`, `getBackendToken()`, `isAdmin`
- `frontend/src/api/adminClient.js` — `adminRequest()` helper that auto-attaches the JWT
- `frontend/src/components/layout/Navbar.jsx` — shows "Admin Dashboard" link when `isAdmin === true`

---

## 4. Database Schema

All tables are in the Neon PostgreSQL database. The schema was created by Alembic
migration `alembic/versions/c68ef0ab3962_initial_schema.py`.

### `users`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | auto-generated |
| firebase_uid | VARCHAR(128) | unique, indexed — the bridge key |
| name | VARCHAR(255) | from Firebase displayName |
| email | VARCHAR(255) | unique, indexed |
| role | ENUM(USER, ADMIN) | default USER |
| is_active | BOOLEAN | admin can deactivate accounts |
| created_at / updated_at | TIMESTAMPTZ | auto-managed |

### `categories`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR(100) | unique |

### `resources`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| type | ENUM(ARTICLE, VIDEO) | |
| category_id | UUID FK → categories | nullable, SET NULL on delete |
| status | ENUM(DRAFT, SCHEDULED, PUBLISHED) | default DRAFT |
| thumbnail_url | TEXT | Firebase Storage download URL |
| source | TEXT | URL for videos, nullable for articles |
| scheduled_at | TIMESTAMPTZ | nullable — when to auto-publish |
| published_at | TIMESTAMPTZ | set once when first published |
| created_at / updated_at | TIMESTAMPTZ | auto-managed |

### `resource_translations`
Stores bilingual content separately so the same resource has both EN and KM versions.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| resource_id | UUID FK → resources | CASCADE on delete |
| language | ENUM(EN, KM) | |
| title | VARCHAR(500) | |
| description | TEXT | |
| content | TEXT | rich-text HTML from TipTap editor |

### `profiles`
Unifies experts and suppliers in one table, distinguished by `type`.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| type | ENUM(EXPERT, SUPPLIER) | |
| name_en / name_km | VARCHAR(255) | bilingual |
| bio_en / bio_km | TEXT | bilingual |
| job_title_en / job_title_km | VARCHAR(255) | bilingual |
| education_en / education_km | TEXT | bilingual |
| location_en / location_km | VARCHAR(255) | bilingual |
| availability_en / availability_km | VARCHAR(255) | bilingual |
| experience_years | INTEGER | nullable |
| rating | FLOAT | nullable, 0–5 |
| telegram | VARCHAR(100) | handle only, no @ |
| contact_email | VARCHAR(255) | nullable |
| photo_url | TEXT | Firebase Storage URL |
| languages | VARCHAR(255) | comma-separated list |
| online | BOOLEAN | currently available indicator |
| is_active | BOOLEAN | controls visibility on /experts |
| created_at / updated_at | TIMESTAMPTZ | auto-managed |

### `specializations`
| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| name | VARCHAR(100) | unique tag name |

### `profile_specializations`
Many-to-many join table linking profiles to specialization tags.

| Column | Type |
|--------|------|
| profile_id | UUID FK → profiles |
| specialization_id | UUID FK → specializations |

### `analysis_history`
Stores every DSS diagnosis result. The `result` column holds the complete
DSSResponse object as JSONB — no over-normalisation.

| Column | Type | Notes |
|--------|------|-------|
| id | UUID PK | |
| user_id | UUID FK → users | nullable (SET NULL if user deleted) |
| mode | ENUM(ML, QUESTIONNAIRE, HYBRID) | |
| result | JSONB | full DSSResponse: condition_key, confidence_level, recommendations, secondary_conditions, score, etc. |
| confidence | FLOAT | top-level score, duplicated for fast queries |
| image_url | TEXT | nullable — not currently used |
| created_at | TIMESTAMPTZ | indexed |

---

## 5. Backend: New Files

All new files live under `api/`. The original `api/main.py` was only modified at
the very bottom to register the new routers — no existing logic was changed.

### `api/database.py`
Sets up the async SQLAlchemy engine connecting to Neon. Reads `DATABASE_URL` from
environment. Falls back to in-memory SQLite (`sqlite+aiosqlite://`) when
`DATABASE_URL` is not set — this keeps CI imports clean even without a real
database. SSL is required for PostgreSQL connections only.

### `api/models/`

- **`user.py`** — `User` ORM model. The `firebase_uid` field is the bridge between
  Firebase and PostgreSQL.
- **`resource.py`** — `Resource`, `ResourceTranslation`, `Category` models. The
  one-to-many translation pattern (`resource → translations[]`) allows a single
  resource to have both EN and KM versions without duplicating metadata.
- **`profile.py`** — `Profile`, `Specialization`, `ProfileSpecialization` models.
  Specializations are shared across profiles (many-to-many).
- **`analysis.py`** — `AnalysisHistory` model. Uses PostgreSQL's native `JSONB`
  column type for the `result` field.

### `api/schemas/`
Pydantic models for request validation and response serialisation.

**Important naming note:** The original DSS used `api/schemas.py` (a single file).
When the new `api/schemas/` directory was created, Python resolved the package
directory first, silently shadowing the old file. This caused an
`ImportError: cannot import name 'QuestionnaireRequest' from 'api.schemas'`.

**Fix:** The original file was renamed to `api/schemas_legacy.py`, and
`api/schemas/__init__.py` re-exports all original classes from it:

```python
from api.schemas_legacy import (
    QuestionnaireRequest, DSSResponse, ImagePredictionResponse,
    MultiImagePredictionResponse, ExplainResponse, RecommendationResponse,
    SignalEntry, ConditionExplanation,
)
```

This preserves all existing import paths across `api/main.py` and the test suite.

### `api/dependencies/auth.py`
Two reusable FastAPI dependencies:
- `get_current_user()` — decodes the backend JWT from the `Authorization: Bearer`
  header, looks up the user in PostgreSQL, raises 401 if invalid
- `require_admin()` — depends on `get_current_user`, additionally raises 403 if
  `role != ADMIN`

### `api/dependencies/db.py`
`get_db()` — async context manager that yields a SQLAlchemy `AsyncSession` and
automatically commits or rolls back on exit.

### `api/routers/auth.py`
Two endpoints:
- `POST /auth/me` — receives a Firebase ID token, verifies it, upserts the
  PostgreSQL user row, returns a backend JWT
- `GET /auth/me` — decodes a backend JWT and returns the user's profile

Firebase Admin SDK initialisation is wrapped in `try/except` so that missing
credentials in CI do not crash the module at import time. The flag `_firebase_ready`
is set to `True` only if initialisation succeeds.

### `api/routers/resources.py`
Public endpoints:
- `GET /resources` — returns only published/due-scheduled resources with translations
- `GET /resources/{id}` — same visibility check for a single resource

Admin endpoints (all require `role=ADMIN`):
- `GET /admin/resources` — all resources regardless of status
- `POST /admin/resources` — creates resource + translations in one transaction
- `PATCH /admin/resources/{id}` — updates resource; translations are replaced entirely
- `DELETE /admin/resources/{id}` — cascades to translations

Scheduling logic: `_is_visible()` checks `status == PUBLISHED`, or
`status == SCHEDULED and scheduled_at <= now()`. This runs at query time — no
background job needed.

### `api/routers/profiles.py`
Public endpoints:
- `GET /profiles` — active profiles only, with specializations loaded
- `GET /profiles/{id}` — single active profile

Admin endpoints — full CRUD at `/admin/profiles/{id}`.
`_sync_specializations()` replaces a profile's tags on every update, creating new
Specialization rows as needed.

### `api/routers/admin_users.py`
Admin-only:
- `GET /admin/users` — all registered users
- `PATCH /admin/users/{id}` — update `role` and/or `is_active`

This is the mechanism for promoting users to admin after the initial SQL bootstrap.

### `api/routers/admin_analysis.py`
User-facing:
- `POST /analyses` — saves a DSS result for the authenticated user
- `GET /analyses?limit=15&offset=0` — returns the user's own history, paginated by offset
- `DELETE /analyses/{id}` — delete a single entry (user can only delete their own)
- `DELETE /analyses` — clear all of the user's history

Admin-only:
- `GET /admin/analysis?mode=ML&limit=50` — all analyses across all users, filterable
- `GET /admin/analysis/{id}` — single record

---

## 6. Frontend: New Files

### `frontend/src/api/adminClient.js`
- `createAdminClient(token)` — axios instance with `Authorization: Bearer` pre-attached
- `adminRequest(getBackendToken, method, url, data?)` — convenience wrapper used
  everywhere in admin pages, Step3Results, and ProfilePage

### `frontend/src/components/AdminRoute.jsx`
Route guard: redirects unauthenticated users to `/sign-in`, and non-admin users
to `/`. Wraps all `/admin/*` routes in `App.jsx`.

### `frontend/src/pages/Admin/AdminLayout.jsx`
Dark green sidebar shell for all admin pages. Has navigation links to Dashboard,
Resources, Profiles, Users, Analysis, and a "Back to website" link so admins can
return to the public site without logging out.

### `frontend/src/pages/Admin/AdminDashboard.jsx`
Four summary stat cards (users, resources, profiles, analyses), fetched in parallel
with `Promise.allSettled`.

### `frontend/src/pages/Admin/AdminResources.jsx`
Table of all resources (all statuses) with publish/unpublish toggle, edit, and
delete per row. Edit navigates to `ResourceEditor`.

### `frontend/src/pages/Admin/ResourceEditor.jsx`
Most complex admin component:
- **Language tabs** — separate TipTap rich-text editor instances for EN and KM;
  switching tabs preserves the other language's content
- **Thumbnail upload** — uses Firebase Storage (`uploadBytes` + `getDownloadURL`),
  stores download URL as `thumbnail_url`
- **Scheduling** — date/time picker sets `scheduled_at`; status auto-changes to SCHEDULED

### `frontend/src/pages/Admin/AdminProfiles.jsx`
Table of all expert/supplier profiles. Inline modal form with all bilingual fields.
Specialization names are entered as comma-separated and split into an array on save.

### `frontend/src/pages/Admin/AdminUsers.jsx`
Table of all registered users with search. Role toggle and active toggle per row.

### `frontend/src/pages/Admin/AdminAnalysis.jsx`
Log of all DSS runs across all users, filterable by mode.

### `frontend/vercel.json`
```json
{ "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }] }
```
Added because Vercel treated `/admin` as a server-side path and returned 404 on
direct navigation. This catch-all rewrite makes Vercel serve `index.html` for every
path, letting React Router handle client-side routing.

---

## 7. Frontend: Modified Files

### `frontend/src/context/AuthContext.jsx`
Three additions:
1. `isAdmin` state (boolean, default false) — set by checking `role === 'ADMIN'`
   from `GET /auth/me` on login
2. `backendTokenRef` (React ref) — caches the backend JWT in memory; cleared on logout
3. `getBackendToken()` — returns cached JWT or re-exchanges if empty

### `frontend/src/api/client.js`
Added four new public API helpers:
- `getResources()` — `GET /resources`
- `getResource(id)` — `GET /resources/{id}`
- `getProfiles()` — `GET /profiles`
- `getCategories()` — `GET /categories`

### `frontend/src/App.jsx`
Added lazy-loaded imports for all 7 admin pages and a nested route block:

```jsx
<Route path="/admin" element={<AdminRoute><AdminLayout /></AdminRoute>}>
  <Route index element={<AdminDashboard />} />
  <Route path="users" element={<AdminUsers />} />
  <Route path="resources" element={<AdminResources />} />
  <Route path="resources/new" element={<ResourceEditor />} />
  <Route path="resources/:id" element={<ResourceEditor />} />
  <Route path="profiles" element={<AdminProfiles />} />
  <Route path="analysis" element={<AdminAnalysis />} />
</Route>
```

### `frontend/src/firebase.js`
Changed `const app = initializeApp(...)` to `export const app = ...` so
`ResourceEditor.jsx` can import it to initialise Firebase Storage.

### `frontend/src/components/layout/Navbar.jsx`
Added "Admin Dashboard" link in the profile picture dropdown (desktop and mobile),
visible only when `isAdmin === true`. This gives admins a one-click path to the
admin area without memorising the URL.

### `frontend/src/pages/Detection/Step3Results.jsx`
**Before:** Called `saveAnalysis(user.uid, {...})` from Firestore after a DSS result.

**After:** Calls `adminRequest(getBackendToken, 'post', '/analyses', {...})`.
The `mode` value is mapped to the backend's uppercase enum. The full DSS result
object is stored as-is in the JSONB `result` column. Fire-and-forget — a failure
to save never blocks the user from seeing their results. Results with `is_demo: true`
are not saved.

### `frontend/src/pages/Profile/ProfilePage.jsx`
**Before:** Used `getAnalyses`, `deleteAnalysis`, `clearAllAnalyses` from Firestore
with cursor-based pagination (`lastDoc`).

**After:** Uses `adminRequest` for all three operations:
- `GET /analyses?limit=15&offset=0` (offset-based pagination)
- `DELETE /analyses/{id}` (still has the 5-second undo timer)
- `DELETE /analyses` (clear all)

A `normaliseAnalysis()` function maps the backend response shape (nested `result`
JSONB) back to the flat object shape that `HistoryCard` expects.

Farm profile (variety, region, field size) still reads/writes to Firestore — not migrated.

### `frontend/src/pages/Learning/ResourcesList.jsx`
**Before:** Imported `SAMPLE_ARTICLES` from `searchData.js`.

**After:** Fetches from `GET /resources` on mount. A `normalize(r, lang)` function
maps `ResourceOut` (with `translations[]` array) to the flat display shape used by
the card grid. Dynamic tabs are derived from the categories returned by the API.
Loading skeletons and empty states are included.

### `frontend/src/pages/Learning/ArticleDetail.jsx`
**Before:** Used a hardcoded content object.

**After:** Fetches `GET /resources/{id}` on mount. Renders `translation.content`
via `dangerouslySetInnerHTML` (content is TipTap-generated HTML, stored in the DB).
Language-aware: finds the translation matching `lang.toUpperCase()`, falls back to EN.
Loading state and 404 state are both handled.

### `frontend/src/pages/Experts/ExpertsPage.jsx`
**Before:** Imported `EXPERTS_DATA` and `FEATURED_SUPPLIERS` from `searchData.js`.

**After:** Fetches from `GET /profiles` on mount. A `normalizeProfile(p, lang)`
function maps `ProfileOut` (with bilingual `name_en`/`name_km` fields etc.) to
the display shape. Profiles are split by `type`: `EXPERT` and `SUPPLIER`.
Loading skeletons are shown in both the experts grid and suppliers grid.
The `PRODUCTS` section remains hardcoded — it is product listing data with prices,
not profile data, and has no equivalent in the backend schema.

### `frontend/src/components/search/SearchModal.jsx`
**Before:** Searched only `SEARCH_INDEX` (a static array from `searchData.js`).

**After:** On modal open, fetches live resources from `GET /resources` and converts
them to the search format. Static service-type items from `SEARCH_INDEX` are kept
(navigation shortcuts to /detect, /learn, /experts). Dynamic article/video items
from the API replace the hardcoded article entries, so newly published resources
are immediately discoverable via search.

### `frontend/src/pages/Landing.jsx`
Added a "Try a Demo" button in the hero section. When clicked, it writes a
pre-baked blast diagnosis result (with `is_demo: true`) to `sessionStorage` and
navigates to `/detect/results`. Step3Results already skips saving when `is_demo`
is true and shows an amber "demo mode" banner. This lets users see a realistic
results page without uploading any image or signing in.

---

## 8. Deployment & Infrastructure Fixes

### Firebase Service Account (Secret Manager)
The backend needs the Firebase service account JSON to verify ID tokens at
`POST /auth/me`. The file was uploaded to Google Secret Manager and mounted as a
file volume into the Cloud Run container at `/app/serviceAccountKey.json`.

```bash
gcloud secrets create firebase-service-account \
  --data-file=serviceAccountKey.json --project=rice-dss-fyp

gcloud run services update <SERVICE_NAME> \
  --update-secrets=/app/serviceAccountKey.json=firebase-service-account:latest \
  --region=asia-southeast1
```

The env var `GOOGLE_APPLICATION_CREDENTIALS=/app/serviceAccountKey.json` tells
Firebase Admin SDK where to find it.

### Cloud Run Environment Variables
The following variables are set on the Cloud Run service revision:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql+asyncpg://<neon connection string>` |
| `JWT_SECRET` | (secret value) |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_EXPIRE_MINUTES` | `1440` |
| `GOOGLE_APPLICATION_CREDENTIALS` | `/app/serviceAccountKey.json` |

### Admin Promotion
After deploying and signing in once (which creates the `users` row), the first
admin was promoted directly via Neon SQL Editor:

```sql
UPDATE users SET role = 'ADMIN' WHERE email = 'soxavinloeung@gmail.com';
```

Going forward, role changes are made through **Admin → Users** in the dashboard.

### Neon Migration
The Alembic migration was applied once against the live Neon database:
```bash
DATABASE_URL=<neon_url> alembic upgrade head
```
All 8 tables are confirmed present in the Neon Console Tables tab.

---

## 9. CI / Test Pipeline Fix

The CI workflow (`.github/workflows/ci.yml`) runs `pytest tests/ -v --tb=short`
against the FastAPI app. After the new routers were added, CI started failing
because `from api.main import app` triggered two import-time errors:

**Problem 1 — `database.py` with empty `DATABASE_URL`:**
`create_async_engine("")` raises an `ArgumentError` immediately, crashing the
import. Fix: fall back to `sqlite+aiosqlite://` (in-memory SQLite) when
`DATABASE_URL` is not set. `aiosqlite` was added to `requirements.txt`.

**Problem 2 — `auth.py` Firebase initialisation:**
`credentials.ApplicationDefault()` raises `google.auth.exceptions.DefaultCredentialsError`
in CI where no GCP credentials are configured. Fix: wrapped in `try/except`; the
`_firebase_ready` flag is only set to `True` if initialisation succeeds. Auth
endpoints return gracefully in the unlikely case Firebase is not ready.

**Result:** All 51 tests pass in CI. The DSS tests do not touch the database or
Firebase, so the fallbacks are transparent.

---

## 10. Manual Steps: Production Checklist

All steps below have been completed for the live deployment. This section is
retained as a reference for re-deploying to a new environment.

- [x] **Firebase service account** — downloaded from Firebase Console → Project
  Settings → Service Accounts → Generate new private key. Stored in Secret Manager.
- [x] **Cloud Run env vars** — `DATABASE_URL`, `JWT_SECRET`, `JWT_ALGORITHM`,
  `JWT_EXPIRE_MINUTES`, `GOOGLE_APPLICATION_CREDENTIALS` all set.
- [x] **Secret Manager** — `firebase-service-account` secret created, IAM binding
  granted to Cloud Run service account, volume mounted at `/app/serviceAccountKey.json`.
- [x] **Cloud Run deploy** — updated backend deployed with `gcloud run deploy`.
- [x] **Neon migration** — `alembic upgrade head` run; all 8 tables confirmed present.
- [x] **Admin promotion** — `soxavinloeung@gmail.com` promoted via SQL, confirmed
  working via `/admin` page.
- [x] **Vercel SPA routing** — `frontend/vercel.json` added; direct navigation to
  `/admin` and all other SPA routes works.

---

## 11. Environment Variables Reference

| Variable | Where used | Description |
|----------|-----------|-------------|
| `DATABASE_URL` | `api/database.py` | Neon async connection string |
| `JWT_SECRET` | `api/routers/auth.py` | Signs and verifies backend JWTs |
| `JWT_ALGORITHM` | `api/routers/auth.py` | Default: `HS256` |
| `JWT_EXPIRE_MINUTES` | `api/routers/auth.py` | Default: 1440 (24h) |
| `GOOGLE_APPLICATION_CREDENTIALS` | `api/routers/auth.py` | Path to Firebase service account JSON inside container |
| `VITE_API_URL` | Frontend build | Backend base URL |
| `VITE_FIREBASE_*` | Frontend build | Firebase config (unchanged from original) |

---

## 12. Testing Checklist

### Auth & Admin Access
- [ ] `POST /auth/me` with a valid Firebase ID token → returns `{ access_token: "..." }`
- [ ] `POST /auth/me` with an invalid token → 401
- [ ] `GET /auth/me` with the returned JWT → returns `{ id, email, role: "USER" }`
- [ ] Sign in → `isAdmin` is false for a regular user, `/admin` is not accessible
- [ ] Sign in with the promoted admin account → "Admin Dashboard" appears in profile dropdown, `/admin` loads
- [ ] Sign out → "Admin Dashboard" link disappears

### Content Management (Admin Dashboard)
- [ ] Create a profile (type=EXPERT) → visible in **Admin → Profiles** table
- [ ] Set profile `is_active=true` → visible on `/experts` page
- [ ] Create a resource with status=DRAFT → `GET /resources` does NOT return it; **Admin → Resources** does
- [ ] Publish the resource → `GET /resources` returns it; visible on `/learn`
- [ ] Create a resource with status=SCHEDULED and a past `scheduled_at` → visible on `/learn`
- [ ] Edit resource → changes appear immediately on `/learn/article/:id`
- [ ] Delete resource → gone from admin table and public pages

### Analysis History (User)
- [ ] Run a DSS analysis (questionnaire or hybrid) → check Neon `analysis_history` table has a new row
- [ ] Visit Profile page → analysis history loads from backend (not Firestore)
- [ ] Delete one analysis entry → 5-second undo works; backend DELETE fires after timeout
- [ ] Click "Undo" within 5 seconds → analysis stays (DELETE is cancelled)
- [ ] "Clear all" → modal shows count; all entries removed
- [ ] Export CSV → downloads with correct condition/mode/date data
- [ ] "Try a Demo" on Landing page → goes to results page with amber demo banner; nothing saved to DB

### Search
- [ ] Open search (Cmd+K) → type a resource title → result appears from live API
- [ ] Service shortcuts (detect, experts, learn) → still appear in Quick Access

### Security
- [ ] `POST /admin/resources` without a JWT → 401
- [ ] `POST /admin/resources` with a USER-role JWT → 403
- [ ] Deactivate a user in admin dashboard → that user gets 403 on next token exchange
- [ ] `DELETE /analyses/{id}` for another user's analysis → 404 (not found / not owner)
