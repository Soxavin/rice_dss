# 0009: One `safe_commit()` helper for DB write-error handling

- **Date:** 2026-09-15
- **Commit:** `9e5a370`
- **Status:** Accepted

## Context

`products.py`, `profiles.py`, `admin_users.py`, and `admin_analysis.py` all
called `await db.commit()` directly with no error handling anywhere. A
constraint violation (bad FK, duplicate unique `Specialization.name`) would
propagate as an unhandled 500 with a raw stack trace instead of a clean 4xx
— both a poor admin-panel UX and a minor information leak.

## Decision

Add one small helper, `api/utils/db_errors.py::safe_commit(db, conflict_detail)`,
that wraps `db.commit()`, catches `IntegrityError` → 409 and any other
`SQLAlchemyError` → 500 (rolling back either way), and replace every bare
`await db.commit()` in the four affected routers with `await safe_commit(db)`.

## Alternatives considered

- **Add try/except individually at each of the ~11 call sites.** Rejected —
  the exact same three lines (try/commit/except-rollback-raise) repeated
  eleven times is worse to maintain than one helper, and any future
  behavior change (e.g. logging on conflict) would need to be made in
  eleven places instead of one.
- **A FastAPI exception handler that catches `IntegrityError` globally at
  the app level instead of at the call site.** Considered but rejected —
  a global handler can't produce a *specific*, field-aware conflict message
  (`conflict_detail`) the way a per-call-site helper can, and it would also
  silently apply to the DSS endpoints in `api/main.py`, which don't use the
  DB at all and don't need this behavior.

## Consequences

- Every new admin write endpoint should call `safe_commit(db)` instead of
  `db.commit()` directly — this is now the established convention for this
  codebase (see `CLAUDE.md`'s note on matching existing patterns).
- `safe_commit`'s generic 500 message ("Database error.") doesn't
  distinguish *which* underlying `SQLAlchemyError` occurred — that detail
  still needs `gcloud logging read` (see [[0011]]) if a genuine bug (not
  just a bad request) triggers it.
