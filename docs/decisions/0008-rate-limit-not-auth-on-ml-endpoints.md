# 0008: Harden ML/auth endpoints with rate limiting, not a login requirement

- **Date:** 2026-09-15
- **Commit:** `9e5a370`
- **Status:** Accepted

## Context

A polish-round audit found `/predict-image(s)`, `/hybrid(-image(s))`,
`/questionnaire`, `/hybrid`, and `/explain` in `api/main.py` had no
authentication and no rate limiting — these run real ML inference on Cloud
Run. Given this project's history (a GCP billing outage, [[0001]], and a
Cloud Run OOM crash, [[0002]]), an unrate-limited, anonymously-reachable
inference endpoint is a real, not hypothetical, cost/availability risk.

Before deciding on a fix, confirmed via code reading that the frontend's
`axios` client (`frontend/src/api/client.js`) calls these endpoints with no
Authorization header at all, and `Step1Upload.jsx` never checks
`isAuthenticated` — disease detection is intentionally anonymous-friendly
by design (no login wall for farmers to use the core feature).

## Decision

Add per-IP rate limiting via `slowapi` (30/min on the cheap questionnaire-
only endpoints, 10/min on single-image, 5/min on multi-image, 20/min on
Firebase token exchange in `auth.py`). Do not add an authentication
requirement to these endpoints.

## Alternatives considered

- **Require login (`Depends(get_current_user)`) on the ML endpoints.**
  Rejected — this would break the core anonymous-use product flow, which
  is a product decision already made elsewhere and out of scope for a
  "polish" pass. Rate limiting addresses the actual risk (unbounded request
  volume) without changing who can use the feature.
- **Add a CAPTCHA or similar bot-gate.** Rejected as disproportionate for
  the current risk level and adds real UX friction to every legitimate
  user; per-IP rate limiting is the standard, lower-friction first line of
  defense and can be revisited if abuse is actually observed.

## Consequences

- A legitimate user behind a shared/NAT'd IP (e.g. a school or office
  network) could theoretically hit the limit faster than an individual
  would — acceptable tradeoff at current traffic levels; would need a
  smarter key function (e.g. combining IP with a session identifier) if
  this becomes a real complaint.
- The rate limits are static per-endpoint constants in `api/main.py` and
  `api/routers/auth.py` — if traffic patterns change, tune the numbers
  there rather than adding new infrastructure.
