# 0011: Structured logging via a ContextVar-based request ID

- **Date:** 2026-09-15
- **Commit:** `db93155`
- **Status:** Accepted

## Context

No `logging` module was used anywhere in `api/` — just FastAPI/uvicorn's own
access log. Two prior incidents ([[0001]], [[0002]]) both had to be
diagnosed via raw `gcloud logging read` grepping, with no way to correlate
"this specific failed request" across log lines, and no record of *who* did
a given admin action (create/update/delete) after the fact. The user's
follow-up ask was explicit: every code/architecture decision and action
should be "noted down and traceable so it can easily be referenced."

## Decision

Add `api/logging_config.py`: a stdlib `logging` setup with one formatter,
and a `ContextVar[str]` holding the current request's ID, injected into
every log line automatically via a `logging.Filter` (so call sites never
need to pass it manually). A middleware in `api/main.py` generates a
`uuid4()` per request, sets it in the ContextVar, returns it as an
`X-Request-ID` response header, and logs one summary line per request.
Write endpoints across `products.py`, `profiles.py`, `admin_users.py`
(especially role changes), and `auth.py`'s token exchange now log an audit
line (who did what, to which record) — not just errors.

## Alternatives considered

- **Pass a `request_id` parameter explicitly through every function that
  logs.** Rejected — every logging call site across five+ router files
  would need the parameter threaded through its whole call chain; a
  ContextVar gives the same per-request scoping without touching every
  function signature.
- **A third-party structured-logging library (e.g. `structlog`,
  `python-json-logger`).** Rejected per this project's stated convention
  (see `CLAUDE.md`/decisions README: "library choices stay boring and
  standard") — stdlib `logging` is sufficient for this project's scale and
  Cloud Run's log ingestion doesn't require JSON-structured lines to be
  useful; adding a new dependency for this would be complexity without a
  corresponding need.
- **Only log errors (`logger.exception`), not successful writes.**
  Rejected — this was the specific gap the user called out: traceability
  means being able to reconstruct what *happened*, not just what *failed*.
  A role change that succeeds but shouldn't have (e.g. a bug in the
  guard logic) would be invisible under error-only logging.

## Consequences

- Any future report of "something went wrong" can be traced via
  `gcloud logging read` filtered on the `X-Request-ID` response header, or
  on a user/record ID from an audit line — this is now the standard
  incident-diagnosis path for this project, superseding pure guesswork.
- Log volume increases (one line per request plus audit lines on every
  write) — acceptable at current traffic; would need log-level tuning
  (`LOG_LEVEL` env var, already wired) if this becomes a cost concern on
  Cloud Run's log ingestion pricing.
- This entry itself — and the whole `docs/decisions/` folder — exists
  because "traceable" was explicitly requested to mean *decisions*, not
  just *requests*; this log is the complement to the request-ID logging
  described above, covering the "why," not the "what happened at runtime."
