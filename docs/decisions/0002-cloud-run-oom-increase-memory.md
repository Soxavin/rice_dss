# 0002: Cloud Run OOM crash — raise memory limit, don't reduce multi-image limits further

- **Date:** 2026 (documented retroactively — predates this log)
- **Commit:** no commit — `gcloud run services update --memory=2Gi` only
- **Status:** Accepted

## Context

Multi-image analysis (`/predict-images`, up to 5 images) crashed in
production with "Memory limit of 1024 MiB exceeded," found via
`gcloud logging read ... severity>=WARNING`. This surfaced the day before an
MVP demo, so the fix needed to be immediately safe, not just eventually
optimal.

## Decision

Raise the Cloud Run container memory limit from 1Gi to 2Gi
(`gcloud run services update rice-dss --region=asia-southeast1 --memory=2Gi`).
Verified with a real 2-image `/predict-images` request returning 200 with
`images_used: 2` before considering it fixed.

## Alternatives considered

- **Reduce `MAX_MULTI_IMAGES` below 5, or cap image resolution before
  inference.** Rejected as the primary fix: it changes product behavior
  (fewer angles = less robust diagnosis) to work around an infrastructure
  limit, right before a demo where that feature needed to actually work.
  Memory is cheap on Cloud Run; product behavior is not the right lever here.
- **Process images sequentially and discard bytes after each inference
  instead of holding all 5 in memory.** A real long-term optimization, but
  a code change under time pressure carries more risk than a one-line infra
  bump — deferred rather than rejected outright.

## Consequences

- Cloud Run cost scales with the higher memory allocation even when idle
  cold-starts don't need it — acceptable tradeoff, monitored via the budget
  alert from [[0001]].
- The sequential-processing optimization from the rejected alternative is
  still worth doing if memory pressure returns at higher `MAX_MULTI_IMAGES`
  values or larger image sizes — this decision doesn't preclude it, just
  didn't require it yet.
