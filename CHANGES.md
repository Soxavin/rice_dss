# Rice DSS — PostgreSQL + Admin Dashboard: Change Documentation

> Covers every file that was added or modified,
> how the pieces connect, how they changed the existing architecture, and what
> still needs to be done manually before the system is fully live.

---

## 1. Why This Was Built

All public-facing content on the site — expert profiles, supplier listings,
educational articles — was hardcoded directly in the React frontend (inside
`frontend/src/data/searchData.js`). Adding or editing anything required a code
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
    │       ├─▶  ML models + DSS logic  (unchanged — 12 original endpoints)
    │       ├─▶  Auth bridge  POST /auth/me  (Firebase ID token → backend JWT)
    │       ├─▶  Public API   GET /resources, /profiles
    │       └─▶  Admin API    /admin/resources, /admin/profiles, /admin/users, /admin/analysis
    │                 │
    │                 └─▶ Neon PostgreSQL  (users, content, profiles, analysis history)
    │
    └─▶ Firebase Storage  (thumbnail / image uploads from admin dashboard)

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
- Farm profile (variety, region, field size) still lives in Firestore — it
  hasn't been migrated yet.

---

## 3. The Auth Bridge — How Firebase Connects to the Backend JWT

This is the most non-obvious part of the system. Here's the full flow:

```
1. User signs in via Firebase (Google or email/password) — same as before.

2. onAuthStateChanged fires in AuthContext.jsx.

3. AuthContext calls _exchangeForBackendJWT():
   - Gets a short-lived Firebase ID token via  firebaseUser.getIdToken()
   - POSTs it to  POST /auth/me  as  Authorization: Bearer <firebase_id_token>

4. Backend (api/routers/auth.py) receives the request:
   - Verifies the Firebase ID token using the Firebase Admin SDK
     (firebase_auth.verify_id_token())
   - Looks up the user in the PostgreSQL `users` table by firebase_uid
   - If first login: creates a new User row with role=USER
   - Returns a backend JWT (HS256, 24-hour expiry)

5. AuthContext caches the backend JWT in a React ref (backendTokenRef).

6. AuthContext also calls  GET /auth/me  with the backend JWT to read the user's
   role. If role=ADMIN, sets isAdmin=true in context.

7. All admin API calls use getBackendToken() from context, which returns the
   cached JWT or re-exchanges if the cache is empty.
```

**Why two tokens?**
Firebase ID tokens are short-lived (~1h) and are meant for Firebase services.
The backend JWT gives us full control: we can encode custom claims, check role,
and revoke by changing the JWT_SECRET if needed.

**Relevant files:**
- `api/routers/auth.py` — the exchange endpoint
- `api/dependencies/auth.py` — `get_current_user()`, `require_admin()` used by all protected routes
- `frontend/src/context/AuthContext.jsx` — `_exchangeForBackendJWT()`, `getBackendToken()`, `isAdmin`
- `frontend/src/api/adminClient.js` — `adminRequest()` helper that auto-attaches the JWT

---

## 4. Database Schema

All tables are in the Neon PostgreSQL database. The schema was created by Alembic
migration `c68ef0ab3962_initial_schema.py`.

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
environment, requires SSL, and exposes `AsyncSessionLocal` (session factory) and
`Base` (declarative base that all models inherit from).

### `api/models/`

- **`user.py`** — `User` ORM model. The `firebase_uid` field is the bridge between
  Firebase and PostgreSQL.
- **`resource.py`** — `Resource`, `ResourceTranslation`, `Category` models. The
  one-to-many translation pattern (`resource → translations[]`) allows a single
  resource to have both EN and KM versions without duplicating metadata.
- **`profile.py`** — `Profile`, `Specialization`, `ProfileSpecialization` models.
  Specializations are shared across profiles (many-to-many), so "Crop Disease
  Management" created for one expert is reused for others.
- **`analysis.py`** — `AnalysisHistory` model. Uses PostgreSQL's native `JSONB`
  column type for the `result` field, which lets queries filter on specific JSON
  keys in the future without schema changes.

### `api/schemas/`
Pydantic models for request validation and response serialisation. Each schema
file mirrors its model counterpart. Notable:
- `ResourceCreate` includes a `translations` list (write both languages in one
  request)
- `ProfileCreate` accepts `specialization_names: list[str]` — the router handles
  creating Specialization rows if they don't already exist

### `api/dependencies/auth.py`
Two reusable FastAPI dependencies:
- `get_current_user()` — decodes the backend JWT from the `Authorization: Bearer`
  header, looks up the user in PostgreSQL, raises 401 if invalid
- `require_admin()` — depends on `get_current_user`, additionally raises 403 if
  `role != ADMIN`

Any protected route simply adds `_: User = Depends(require_admin)` to its
signature.

### `api/dependencies/db.py`
`get_db()` — an async context manager that yields a SQLAlchemy `AsyncSession` and
automatically commits or rolls back on exit. Every router function that touches the
database uses `db: AsyncSession = Depends(get_db)`.

### `api/routers/auth.py`
Two endpoints:
- `POST /auth/me` — receives a Firebase ID token, verifies it, upserts the
  PostgreSQL user row, and returns a backend JWT
- `GET /auth/me` — decodes a backend JWT and returns the user's profile (used by
  the frontend to check role on startup)

Firebase Admin SDK is initialised once here (idempotent check via
`firebase_admin._apps`). It uses a service account JSON file pointed to by
`GOOGLE_APPLICATION_CREDENTIALS`.

### `api/routers/resources.py`
Public endpoints:
- `GET /resources` — returns only published/due-scheduled resources with their
  translations loaded
- `GET /resources/{id}` — same visibility check for a single resource

Admin endpoints (all require `role=ADMIN`):
- `GET /admin/resources` — all resources regardless of status
- `POST /admin/resources` — creates resource + translations in one transaction
- `PATCH /admin/resources/{id}` — updates resource; if translations are provided,
  replaces them entirely
- `DELETE /admin/resources/{id}` — cascades to translations

Scheduling logic: `_is_visible()` checks status == PUBLISHED, or status ==
SCHEDULED and `scheduled_at <= now()`. This runs at query time — no background job
needed.

### `api/routers/profiles.py`
Public endpoints:
- `GET /profiles` — active profiles only, with specializations loaded
- `GET /profiles/{id}` — single active profile

Admin endpoints:
- Full CRUD at `/admin/profiles/{id}`
- `_sync_specializations()` replaces a profile's tags on every update, creating
  new Specialization rows as needed

### `api/routers/admin_users.py`
Admin-only:
- `GET /admin/users` — all registered users
- `GET /admin/users/{id}` — single user
- `PATCH /admin/users/{id}` — update `role` and/or `is_active`

This is how you promote the first admin: sign in once to create the row, then
use the Neon console to set `role = 'ADMIN'`, then use `/admin/users` to manage
roles from the dashboard going forward.

### `api/routers/admin_analysis.py`
User-facing:
- `POST /analyses` — saves a DSS result for the authenticated user
- `GET /analyses?limit=15&offset=0` — returns the user's own history, paginated
- `DELETE /analyses/{id}` — delete a single entry (user can only delete their own)
- `DELETE /analyses` — clear all of the user's history

Admin-only:
- `GET /admin/analysis?mode=ML&limit=50` — all analyses across all users, filterable by mode and date range
- `GET /admin/analysis/{id}` — single record

---

## 6. Frontend: New Files

### `frontend/src/api/adminClient.js`
Two exports:
- `createAdminClient(token)` — returns an axios instance with `Authorization:
  Bearer <token>` pre-attached
- `adminRequest(getBackendToken, method, url, data?)` — convenience wrapper:
  gets the token via `getBackendToken()`, creates a client, fires the request.
  Used everywhere in admin pages and in Step3Results/ProfilePage.

### `frontend/src/components/AdminRoute.jsx`
A route guard component. If the user is not logged in, redirects to `/sign-in`.
If logged in but `isAdmin === false`, redirects to `/`. Wraps all `/admin/*`
routes in `App.jsx`.

### `frontend/src/pages/Admin/AdminLayout.jsx`
The shell that wraps all admin pages. Dark green sidebar with navigation links
to Dashboard, Resources, Profiles, Users, and Analysis. Displays the logged-in
email and a logout button. Uses React Router's `<Outlet />` to render the active
page.

### `frontend/src/pages/Admin/AdminDashboard.jsx`
Landing page showing four summary stat cards: total users, total resources, total
profiles, and total analyses. Fetches all four counts in parallel using
`Promise.allSettled`.

### `frontend/src/pages/Admin/AdminResources.jsx`
Table of all resources (all statuses). Each row has:
- Status badge (DRAFT / SCHEDULED / PUBLISHED)
- Publish/unpublish toggle (eye icon)
- Edit button (navigates to `/admin/resources/:id`)
- Delete button

### `frontend/src/pages/Admin/ResourceEditor.jsx`
The most complex admin component. Handles creating and editing resources:
- **Language tabs**: separate TipTap rich-text editor instances for EN and KM.
  Switching tabs preserves the content of the other language.
- **Thumbnail upload**: uses Firebase Storage (`uploadBytes` + `getDownloadURL`),
  stores the download URL as `thumbnail_url` in the database.
- **Scheduling**: date/time picker that sets `scheduled_at`; status changes to
  SCHEDULED automatically.
- Saves via `POST /admin/resources` (new) or `PATCH /admin/resources/:id` (edit).

### `frontend/src/pages/Admin/AdminProfiles.jsx`
Table of all expert/supplier profiles with type filter (ALL / EXPERT / SUPPLIER).
Create and edit via an inline modal form with all bilingual fields. Specialization
names are entered as a comma-separated string and split into an array on save.

### `frontend/src/pages/Admin/AdminUsers.jsx`
Table of all registered users with name/email search. Two action buttons per row:
- Role toggle (ShieldCheck / ShieldOff) — promotes to ADMIN or demotes to USER
- Active toggle (ToggleRight / ToggleLeft) — deactivates or reactivates account

### `frontend/src/pages/Admin/AdminAnalysis.jsx`
Log of all DSS runs across all users. Filterable by mode (ML / QUESTIONNAIRE /
HYBRID). Shows condition, mode badge, confidence %, and timestamp.

---

## 7. Frontend: Modified Files

### `frontend/src/context/AuthContext.jsx`
Three additions:
1. `isAdmin` state (boolean, default false) — set by checking `role === 'ADMIN'`
   from `GET /auth/me` on login
2. `backendTokenRef` (React ref) — caches the backend JWT in memory; cleared on
   logout or auth state change
3. `getBackendToken()` — public method exposed through context; returns cached JWT
   or re-exchanges if empty

The rest of the auth flow (Google login, Facebook login, email login, register,
logout) is unchanged.

### `frontend/src/api/client.js`
Added three new public API helpers:
- `getResources(lang?)` — calls `GET /resources`
- `getResource(id)` — calls `GET /resources/{id}`
- `getProfiles()` — calls `GET /profiles`
- `getCategories()` — calls `GET /categories`

These are used by AdminDashboard today and will be used by the public pages once
the migration is complete.

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

### `frontend/src/pages/Detection/Step3Results.jsx`
**Before:** Called `saveAnalysis(user.uid, {...})` from `../../lib/firestore`
after a DSS result was received.

**After:** Calls `adminRequest(getBackendToken, 'post', '/analyses', {...})`.
The `mode` value (stored in `sessionStorage` as lowercase) is mapped to the
backend's uppercase enum (`ML`, `QUESTIONNAIRE`, `HYBRID`). The full DSS result
object (`parsed`) is stored as-is in the JSONB `result` column. Fire-and-forget
— a failure to save never blocks the user from seeing their results.

### `frontend/src/pages/Profile/ProfilePage.jsx`
**Before:** Used `getAnalyses(user.uid, lastDoc)` with Firestore cursor-based
pagination, `deleteAnalysis(user.uid, id)`, and `clearAllAnalyses(user.uid)`.

**After:** Uses `adminRequest(getBackendToken, ...)` for all three operations:
- `GET /analyses?limit=15&offset=0` (and with offset for "load more")
- `DELETE /analyses/{id}` (still has the 5-second undo timer — only the actual
  delete call changed)
- `DELETE /analyses` (clear all)

A `normaliseAnalysis()` function maps the backend response shape (which has a
nested `result` JSONB) back to the flat object shape that `HistoryCard` expects
(`condition_key`, `recommendations`, `confidence_level`, etc.).

Farm profile (variety, region, field size) still reads/writes to Firestore via
`getFarmProfile` / `saveFarmProfile` — that part was not changed.

---

## 8. What Is Still Hardcoded (Not Yet Migrated)

These three frontend pages still import from `frontend/src/data/searchData.js`
instead of the new API:

| Page | Hardcoded source | What to replace it with |
|------|-----------------|------------------------|
| `pages/Learning/ResourcesList.jsx` | `SAMPLE_ARTICLES` | `getResources(lang)` from `api/client.js` |
| `pages/Learning/ArticleDetail.jsx` | Inline content object | `getResource(id)` + render `translations[lang].content` via `dangerouslySetInnerHTML` |
| `pages/Experts/ExpertsPage.jsx` | `EXPERTS_DATA`, `FEATURED_SUPPLIERS` | `getProfiles()` from `api/client.js` |

The functions `getResources()` and `getProfiles()` are already implemented in
`client.js`. These pages just need to be wired up. Until they are, the pages work
fine with hardcoded data — the admin dashboard stores content in PostgreSQL, but
nothing reads from it on the public side yet.

---

## 9. Manual Steps: What You Still Need to Do

### Step 1 — Get the Firebase service account key

The backend needs this to verify Firebase ID tokens at `POST /auth/me`.

1. Go to [Firebase Console](https://console.firebase.google.com) → your project
2. Click the gear icon → **Project Settings** → **Service Accounts** tab
3. Click **Generate new private key** → confirm → download the JSON file
4. Rename it `serviceAccountKey.json`
5. **Do not commit this file.** It is already in `.gitignore`.

### Step 2 — Set Cloud Run environment variables

In [Google Cloud Console](https://console.cloud.google.com) → Cloud Run → your
service → **Edit & Deploy New Revision** → **Variables & Secrets** tab:

| Variable | Value |
|----------|-------|
| `DATABASE_URL` | `postgresql+asyncpg://neondb_owner:<pw>@<host>.neon.tech/neondb?ssl=require` |
| `JWT_SECRET` | The value from your local `.env` |
| `JWT_ALGORITHM` | `HS256` |
| `JWT_EXPIRE_MINUTES` | `1440` |
| `GOOGLE_APPLICATION_CREDENTIALS` | `/app/serviceAccountKey.json` |

You also need the `serviceAccountKey.json` file to be available inside the
container at `/app/serviceAccountKey.json`. The recommended approach for Cloud
Run:

**Using Google Secret Manager (recommended):**
```bash
# Upload the JSON as a secret
gcloud secrets create firebase-service-account \
  --data-file=serviceAccountKey.json

# Grant Cloud Run access
gcloud secrets add-iam-policy-binding firebase-service-account \
  --member="serviceAccount:<YOUR_SERVICE_ACCOUNT>@developer.gserviceaccount.com" \
  --role="roles/secretmanager.secretAccessor"
```
Then in Cloud Run → Edit & Deploy → **Secrets** tab, mount
`firebase-service-account` as a file at `/app/serviceAccountKey.json`.

**Quick alternative for FYP (less secure):**
Instead of mounting the file, you can pass the entire JSON as a single env var
and modify `auth.py` line 25 to parse it:
```python
import json
raw = os.getenv("FIREBASE_SERVICE_ACCOUNT_JSON")
cred = credentials.Certificate(json.loads(raw)) if raw else credentials.ApplicationDefault()
```

### Step 3 — Deploy the updated backend

The container image needs to be rebuilt to include the new Python dependencies
(`sqlalchemy`, `asyncpg`, `firebase-admin`, `python-jose`, `passlib`, `alembic`).

```bash
# From the rice_dss/ directory:
gcloud run deploy <YOUR_SERVICE_NAME> \
  --source . \
  --region asia-southeast1 \
  --allow-unauthenticated
```

Or push to `main` if you have Cloud Build CI configured.

After deploy, verify the new endpoints are live:
```bash
curl https://<your-service>.run.app/profiles
# Should return [] (empty array, not a 404 or 500)
```

### Step 4 — Confirm the Neon migration is applied

The Alembic migration was already run against the Neon database during development.
Confirm by visiting the [Neon Console](https://console.neon.tech) → your project →
**Tables** tab. You should see all 8 tables:

```
users  categories  profiles  specializations  profile_specializations
resources  resource_translations  analysis_history
```

If any are missing, run the migration locally:
```bash
cd rice_dss
# Make sure your local .env has DATABASE_URL pointing to Neon
alembic upgrade head
```

### Step 5 — Promote the first admin user

After deploying, sign into the app once with your account. This creates a row in
the `users` table with `role = 'USER'`.

Then go to Neon Console → SQL Editor and run:
```sql
UPDATE users
SET role = 'ADMIN'
WHERE email = 'your-email@gmail.com';
```

Sign out and sign back in. The `isAdmin` flag will be `true`, and the `/admin`
link will appear. From that point, you can promote other users through the
**Admin → Users** page without touching SQL again.

### Step 6 — Wire up the public pages (remaining code work)

This is not a deployment step — it's the remaining code to write. When you're
ready for the public pages to serve live content from the database instead of
hardcoded data, update these three files:

**`ResourcesList.jsx`**
```jsx
// Replace hardcoded import with:
import { getResources } from '../../api/client'
// In the component, fetch on mount:
const [articles, setArticles] = useState([])
useEffect(() => {
  getResources(lang).then(r => setArticles(r.data))
}, [lang])
// Replace SAMPLE_ARTICLES references with articles
```

**`ArticleDetail.jsx`**
```jsx
import { getResource } from '../../api/client'
// Fetch by :id param, render the translation for the current language:
const translation = resource.translations.find(t => t.language === lang.toUpperCase())
// Render rich text:
<div dangerouslySetInnerHTML={{ __html: translation?.content || '' }} />
```

**`ExpertsPage.jsx`**
```jsx
import { getProfiles } from '../../api/client'
// Fetch on mount:
const [profiles, setProfiles] = useState([])
useEffect(() => { getProfiles().then(r => setProfiles(r.data)) }, [])
// Filter by type: profiles.filter(p => p.type === 'EXPERT')
// Suppliers: profiles.filter(p => p.type === 'SUPPLIER')
```

---

## 10. Key Environment Variables Reference

| Variable | Where used | Description |
|----------|-----------|-------------|
| `DATABASE_URL` | `api/database.py` | Neon async connection string |
| `JWT_SECRET` | `api/routers/auth.py` | Signs and verifies backend JWTs |
| `JWT_ALGORITHM` | `api/routers/auth.py` | Default: `HS256` |
| `JWT_EXPIRE_MINUTES` | `api/routers/auth.py` | Default: 1440 (24h) |
| `GOOGLE_APPLICATION_CREDENTIALS` | `api/routers/auth.py` | Path to Firebase service account JSON |
| `VITE_API_URL` | Frontend build | Backend base URL (`/api` in production via Vite proxy, or full URL) |
| `VITE_FIREBASE_*` | Frontend build | Firebase config (unchanged) |

---

## 11. Testing Checklist

Once the backend is deployed with env vars set:

- [ ] `POST /auth/me` with a valid Firebase ID token → returns `{ access_token: "..." }`
- [ ] `POST /auth/me` with an invalid token → 401
- [ ] `GET /auth/me` with the returned JWT → returns `{ id, email, role: "USER" }`
- [ ] Sign in to app → `isAdmin` is false for a regular user
- [ ] Promote user via SQL → sign in again → `/admin` is accessible
- [ ] Create a profile in admin dashboard → visible on `/admin/profiles`
- [ ] Create a resource with status PUBLISHED → `GET /resources` returns it
- [ ] Create a resource with status DRAFT → `GET /resources` does NOT return it
- [ ] Run a DSS analysis (questionnaire or hybrid mode) → check Neon `analysis_history` table has a new row
- [ ] Visit Profile page → analysis history loads from backend (not Firestore)
- [ ] Delete an analysis entry → 5-second undo works, backend DELETE fires after timeout
- [ ] `POST /admin/resources` without a JWT → 401
- [ ] `POST /admin/resources` with a USER-role JWT → 403
- [ ] Deactivate a user in admin dashboard → that user gets 403 on next token exchange
