# 0001: Fix the GCP billing outage in place, don't migrate off Cloud Run

- **Date:** 2026 (documented retroactively — predates this log)
- **Commit:** no commit — GCP Console + `gcloud billing` config only
- **Status:** Accepted

## Context

The production API (`rice-dss` on Cloud Run) was returning 503s. Diagnosis via
`gcloud billing accounts describe` found the linked billing account had
`open: false` — GCP had disabled billing on the project, which disables all
paid services including Cloud Run. This was the second time GCP billing had
caused a real incident on this project (a prior surprise-cost scare was part
of why the user was already wary of GCP). The user asked directly whether to
keep fighting GCP or move to a different host.

## Decision

Fix the immediate outage by creating a new billing account and re-linking it
(`gcloud billing projects link rice-dss-fyp --billing-account=...`), plus set
up a $5 budget alert so a billing problem surfaces as a notification instead
of a silent outage next time. Do not migrate off Cloud Run.

## Alternatives considered

- **Migrate to Render/Railway/Fly.io or a VPS.** Rejected for this specific
  moment: the outage was caused by an *account-level billing toggle*, not
  anything intrinsic to Cloud Run — a different host doesn't remove the "a
  billing account can be silently disabled" risk category, and a full
  platform migration mid-outage trades a known, fixable problem for a new,
  larger, unscoped one right when the user needed the service back up.
- **Do nothing / let it stay down until a planned migration.** Rejected —
  this is a live FYP demo project; uptime matters now, architecture
  decisions can happen later without time pressure.

## Consequences

- The underlying risk (a GCP account-level action can take the whole service
  down with no application-level warning) still exists — it's mitigated by
  the budget alert, not eliminated.
- A full re-evaluation of hosting (GCP vs alternatives) remains a legitimate
  future conversation if it recurs — this decision only says "not during an
  active outage."
