# 0004: Product detail popup — new centered modal, not the existing bottom-sheet pattern

- **Date:** 2026-09-14
- **Commit:** `bb1f7d2`
- **Status:** Superseded by [[0007]] (the modal was later rebuilt as a shared portal-based component, but the "centered card, not a bottom sheet" call stands)

## Context

Clicking a product card on the Experts & Support page needed to show full
product detail (untruncated description, usage instructions, nutrients) —
at the time it only showed a truncated card. `ExpertsPage.jsx` already had a
bottom-sheet pattern for expert/supplier "View Profile" popups. The obvious
reuse would be the same bottom sheet for products.

## Decision

Build a new, separate centered modal for product detail instead of reusing
the bottom sheet.

## Alternatives considered

- **Reuse the existing bottom-sheet component for products too.** Rejected
  on explicit user instruction: "don't reuse the existing expert/supplier
  bottom-sheet pattern" — the user had already flagged that pattern (and
  its supplier mini-grid) as looking bad on the frontend, specifically
  citing the supplier "View Products" panel as an example of what not to
  repeat.

## Consequences

- Two different popup patterns existed side by side for a while (bottom
  sheet for profiles, centered modal for products) — this inconsistency was
  the direct motivation for [[0007]], which unified both onto one shared
  component once the user asked for a UI pass on both.
