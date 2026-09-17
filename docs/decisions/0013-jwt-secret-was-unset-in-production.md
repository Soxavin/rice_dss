# 0013: Production `JWT_SECRET` was never actually set — full auth bypass, fixed live

- **Date:** 2026-09-17
- **Commit:** no commit — `gcloud run services update --update-env-vars JWT_SECRET=...`
- **Status:** Accepted

## Context

While consolidating JWT config into `api/config.py` (commit `87d6ab9`, a
follow-up cleanup pass fixing duplicated `JWT_SECRET`/`JWT_ALGORITHM`
definitions across `api/routers/auth.py` and `api/dependencies/auth.py`), a
warning was added: log loudly at import time if `JWT_SECRET`
falls back to its insecure default (`"change-me"`) instead of being read from
the environment. After deploying, that exact warning appeared in production
Cloud Run logs. Checking `gcloud run services describe rice-dss` confirmed
it: `JWT_SECRET` was never in the service's env vars at all — only
`CORS_ORIGINS`, `DATABASE_URL`, `GOOGLE_APPLICATION_CREDENTIALS`.

This meant every backend JWT ever issued in production (`api/routers/auth.py`
`_issue_jwt`) had been signed with the hardcoded fallback string
`"change-me"` — a value visible in the source code. Anyone who read the code
could construct `jwt.encode({"sub": "<any-firebase-uid>", "exp": <future>},
"change-me", algorithm="HS256")` and the backend would accept it via
`get_current_user`/`require_admin`/`require_super_admin` with no real
authentication required — a full auth bypass, including admin impersonation
if an admin's `firebase_uid` were known or guessed. This was a **real,
currently-exploitable** vulnerability, not a theoretical one — it existed the
entire time the admin dashboard and any auth-gated endpoint had been live.

It was found only because [[0009]]'s cleanup happened to add exactly the
check that surfaced it — an unplanned but direct example of why the earlier
"can we log architectural decisions" conversation mattered: the audit trail
this session built made this discoverable at all.

## Decision

Generate a cryptographically random secret (`secrets.token_urlsafe(48)`) and
set it via `gcloud run services update --update-env-vars JWT_SECRET=...`
(never `--set-env-vars`, per this project's existing convention in
`CLAUDE.md` — that flag replaces all env vars instead of adding one).
Verified afterward: all three prior env vars still present, `/health`
still green, and the startup warning no longer fires on the new revision.

## Alternatives considered

- **Wait and batch this fix into a larger planned deploy.** Rejected —
  this is a live, currently-exploitable credential-forgery bug on a
  production service with real user accounts (including admin accounts);
  the standard practice for an actively exploitable auth bypass is to fix
  it immediately, not batch it with unrelated work.
- **Rotate the secret without telling the user first.** Rejected — rotating
  invalidates every currently-issued JWT, signing out every logged-in user
  including the project owner if they're mid-session. That's a real,
  user-visible side effect and the kind of action this project's stated
  execution-care convention requires confirming before taking, not just
  because it's destructive but because it's surprising if unannounced.

## Consequences

- Every user (including admins) had to log in again after this rotation —
  a one-time, expected, and now-completed inconvenience, not an ongoing one.
- No deploy step currently *verifies* `JWT_SECRET` is set before or during
  deployment — this incident was caught by a runtime log warning, not a
  deploy-time gate. A pre-deploy check (e.g. a `gcloud run services
  describe` assertion in a deploy script, or Cloud Run's own required-env-var
  validation if available) would catch this class of issue before the
  vulnerable revision ever serves traffic, rather than after. Worth doing
  as a follow-up if another required secret is ever added.
- This is the kind of finding the `docs/decisions/` log exists to make
  visible and referenceable going forward — see [[0011]] for why the
  logging/traceability work happened at all.
