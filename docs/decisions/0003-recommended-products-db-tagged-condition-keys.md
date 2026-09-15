# 0003: Recommended Products matched via DB-tagged `condition_keys`, not hardcoded copy

- **Date:** 2026-09-13
- **Commit:** `a1ca6a7`
- **Status:** Accepted

## Context

The post-analysis results page showed a "Recommended Products" section with
generic, hardcoded placeholder text — not real Vigor products, and no actual
link between a detected disease and which product treats it. The user and a
teammate wanted real Vigor products shown here instead, matched to whatever
condition the DSS just detected.

## Decision

Add a `condition_keys` JSON column to the `products` table (e.g.
`["blast", "brown_spot", "bacterial_blight"]` for BioControl/BioGuard,
`["iron_toxicity", "n_deficiency", "salt_toxicity"]` for BioBooster), seeded
via an Alembic migration and editable going forward through the existing
admin products UI. The frontend fetches all products, filters by
`p.condition_keys?.includes(detectedConditionKey)`, and renders the real
match with a Telegram CTA resolved through the linked supplier profile.

## Alternatives considered

- **Hardcode a condition → product mapping in the frontend.** Rejected —
  this was explicitly the problem being fixed (content requiring a code
  change + redeploy to update); it would just move the same rigidity from
  fake text to a fake mapping.
- **Free-text matching against `product.category`/`desc_en`.** Rejected —
  fragile (breaks silently if wording changes), and not admin-editable in
  any structured way; a typo in a description would silently break the
  recommendation with no error.

## Consequences

- Products can be retagged to new/different conditions by an admin with no
  deploy, matching how the rest of the content system (resources, profiles)
  already works.
- `condition_keys` values must stay in sync with the DSS's actual condition
  key vocabulary (`dss/` is frozen — see `CLAUDE.md`) — a typo'd key here
  fails silently (no match found) rather than erroring, which is worth
  revisiting if this becomes a recurring admin mistake.
