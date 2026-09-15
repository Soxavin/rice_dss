# 0006: Products gets its own nav tab; Suppliers stays on Experts & Support

- **Date:** 2026-09-14
- **Commit:** `05d3f2c`
- **Status:** Accepted

## Context

Products was a section buried inside the Experts & Support page, gated by a
dead tab condition (`tab === 'Products'` was never a reachable tab value, so
it always rendered under "All"). The user asked whether Products deserved
its own top-level nav tab, and whether Suppliers should move with it or stay
put — an open architectural question, not a bug fix.

## Decision

Give Products its own route/page (`/products`) and nav tab. Keep Suppliers
on Experts & Support alongside Experts. Show the supplier's name (plain
text, not a clickable link) on every product card.

## Alternatives considered

- **Move Suppliers to the Products tab too** ("Products & Suppliers").
  Rejected via AskUserQuestion — Experts and Suppliers are both
  *people/organizations to contact*, conceptually different from Products
  (a browsable catalog); splitting by content type (people vs. catalog)
  reads more coherently than splitting by "everything product-adjacent."
- **Give Suppliers its own third top-level tab.** Rejected — adds a nav
  item and duplicates supplier-lookup logic across two pages for a
  distinction (experts vs. suppliers) that's already handled by an in-page
  tab switcher on Experts & Support.
- **Make the supplier name on product cards a clickable link to their
  profile.** Rejected via AskUserQuestion in favor of a plain label — no
  cross-page deep-linking behavior needed for this pass; simpler to ship,
  can be added later if users actually want to jump to a supplier from a
  product card.

## Consequences

- `ExpertsPage.jsx` lost `allProducts` state and its `getProducts()` fetch
  entirely (Products page now owns its own fetch) — anything added to
  Experts & Support later should not assume product data is available
  there.
- The supplier-lookup-by-`profile_id` pattern (already used for the
  Telegram CTA) is now duplicated in `ProductsPage.jsx` and
  `ProductDetailModal.jsx` — both read from the same `profiles` prop/state,
  so consolidating that lookup into a shared helper is a reasonable future
  cleanup if a third call site appears.
