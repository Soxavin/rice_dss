# Decision Log

This folder records *why* — not just what — for every non-obvious architecture,
library, or design decision made on this project. `CHANGES.md` and git history
already say what changed; this folder is for the reasoning that doesn't survive
in a diff: the alternatives considered, the constraint that ruled them out, the
tradeoff accepted.

## When to add one

Add an entry when a decision:
- Wasn't the only reasonable option (someone could plausibly ask "why not X?")
- Fixes a real bug/incident and the fix's *reasoning* matters for the next similar bug
- Sets a convention future code should follow (and future code should know why)

Skip it for routine bug fixes, copy edits, or anything where the code itself is
the full explanation.

## Format

One file per decision, numbered sequentially, named `NNNN-short-slug.md`:

```markdown
# NNNN: Title

- **Date:** YYYY-MM-DD
- **Commit:** `<short-hash>` (or "no commit — infra/config only", with the exact command)
- **Status:** Accepted | Superseded by NNNN

## Context
What problem or question forced this decision. Include the constraint that
matters — a prior incident, a hard requirement, a real bug reproduction.

## Decision
What was actually chosen, stated plainly.

## Alternatives considered
Each one with the specific reason it was rejected — not "worse," but *why*.

## Consequences
What this makes easier, what it makes harder, what to watch for later.
```

Keep entries short enough to read in under a minute. Link related entries with
`[[NNNN]]`-style references in prose where useful.

## Index

| # | Decision | Date | Commit |
|---|----------|------|--------|
| [0001](0001-gcp-billing-outage-fix-not-migration.md) | Fix GCP billing outage in place, don't migrate off Cloud Run | 2026 (pre-session-log) | infra only |
| [0002](0002-cloud-run-oom-increase-memory.md) | Cloud Run OOM crash: raise memory limit, don't cap image count further | 2026 (pre-session-log) | infra only |
| [0003](0003-recommended-products-db-tagged-condition-keys.md) | Recommended Products matched via DB-tagged `condition_keys`, not hardcoded copy | 2026-09-13 | `a1ca6a7` |
| [0004](0004-product-detail-centered-modal-not-bottom-sheet.md) | Product detail popup: new centered modal, not the existing bottom-sheet pattern | 2026-09-14 | `bb1f7d2` |
| [0005](0005-khmer-full-sync-to-source-document.md) | Khmer/English product text: full sync to source document, not a minimal patch | 2026-09-14 | `7f73387` |
| [0006](0006-products-own-tab-suppliers-stay-with-experts.md) | Products gets its own nav tab; Suppliers stays on Experts & Support | 2026-09-14 | `05d3f2c` |
| [0007](0007-shared-portal-modal-component.md) | Fix popup mispositioning at the root cause: one portal-based `Modal` component | 2026-09-14 | `3544c32` |
| [0008](0008-rate-limit-not-auth-on-ml-endpoints.md) | Harden ML/auth endpoints with rate limiting, not a login requirement | 2026-09-15 | `9e5a370` |
| [0009](0009-safe-commit-db-error-helper.md) | One `safe_commit()` helper for DB write-error handling, not per-endpoint try/except | 2026-09-15 | `9e5a370` |
| [0010](0010-in-memory-sqlite-test-fixtures.md) | Router tests run on in-memory SQLite with a JSONB compatibility shim, not a real Postgres | 2026-09-15 | `d4cbf6b` |
| [0011](0011-contextvar-request-id-logging.md) | Structured logging via a ContextVar-based request ID, not per-call plumbing | 2026-09-15 | `db93155` |
| [0012](0012-lazy-load-firestore-at-point-of-use.md) | Shrink the main bundle by moving Firestore init to its sole consumer, not a dynamic-import wrapper | 2026-09-15 | `99dc2f5` |
| [0013](0013-jwt-secret-was-unset-in-production.md) | Production `JWT_SECRET` was never set (full auth bypass) — rotated live, not batched into a later deploy | 2026-09-17 | infra only |
