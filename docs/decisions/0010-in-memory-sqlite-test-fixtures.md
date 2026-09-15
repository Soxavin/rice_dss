# 0010: Router tests run on in-memory SQLite with a JSONB compatibility shim

- **Date:** 2026-09-15
- **Commit:** `d4cbf6b`
- **Status:** Accepted

## Context

`auth.py`, `admin_users.py`, `admin_analysis.py`, `products.py`, and
`profiles.py` had zero test coverage — only the DSS endpoints in
`api/main.py` were tested, against no real database. `api/database.py`
already had a documented SQLite fallback (`sqlite+aiosqlite://` when
`DATABASE_URL` is unset) but its comment explicitly says "The DSS endpoints
never touch the DB, so tests pass without a real Neon connection" — meaning
that fallback had never actually been exercised against real DB writes.
Attempting to `Base.metadata.create_all()` against it immediately failed:
`analysis_history.result` uses Postgres-specific `JSONB`
(`sqlalchemy.dialects.postgresql.JSONB`), which SQLite's dialect can't
compile at all.

## Decision

Build `tests/conftest.py` with an in-memory SQLite engine using
`poolclass=StaticPool` (so every session in a test shares one DB — plain
`sqlite+aiosqlite://` otherwise hands out a fresh empty DB per connection),
overriding `get_db` for the whole test session. Register a
`sqlalchemy.ext.compiler.compiles(JSONB, "sqlite")` rule that compiles
`JSONB` as `JSON` — scoped to the `"sqlite"` dialect only, so it has zero
effect on the real Postgres schema/migrations.

## Alternatives considered

- **Change the `AnalysisHistory.result` column from `JSONB` to generic
  `JSON` in the model.** Rejected — `JSONB` is a deliberate Postgres choice
  (binary storage, indexable) for production; changing the model just to
  satisfy a test environment would be a real behavior change to
  work around a test-only limitation, backwards.
- **Spin up a real Postgres container for tests (e.g. via `testcontainers`
  or a docker-compose service).** Rejected as disproportionate — adds a
  new tooling dependency and CI complexity for a project whose existing
  167 tests already run happily against SQLite; the compiler-shim approach
  fixes the one specific incompatibility without new infrastructure.
- **Skip DB-touching tests in CI entirely, test only via manual/local
  runs.** Rejected — this is exactly the "zero test coverage" gap being
  closed; skipping in CI defeats the purpose.

## Consequences

- The compiler shim lives in `tests/conftest.py`, not anywhere near
  production code — safe to extend if another Postgres-specific type
  (e.g. `ARRAY`) is added to a model later and needs the same treatment.
- SQLite's SQL semantics aren't identical to Postgres in every respect
  (e.g. some constraint behaviors); these tests validate router
  logic/permissions/status codes correctly but aren't a substitute for
  occasionally verifying against real Postgres if a Postgres-specific
  behavior is ever in question.
