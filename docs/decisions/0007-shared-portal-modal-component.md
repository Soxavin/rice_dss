# 0007: Fix popup mispositioning at the root cause — one portal-based `Modal` component

- **Date:** 2026-09-14
- **Commit:** `3544c32`
- **Status:** Accepted

## Context

The user reported that clicking a product (or "View Profile"/"View
Products") while scrolled down/up on a long page opened the popup somewhere
off-screen, requiring a scroll to find it. Root-cause investigation (an
Explore agent, on request) found: `Layout.jsx` wraps every route's content in
`<main className="page-enter">`, and `.page-enter`'s `animation: ... forwards`
leaves `<main>` with a permanent computed `transform: translateY(0)` after
the entrance animation ends. Any non-`none` transform on an ancestor creates
a new containing block for `position: fixed` descendants — so the product
modal and the profile bottom sheet, both rendered inline inside `<main>`
(not portaled), were actually positioned relative to `<main>`'s scrollable
box, not the viewport. No React Portal or body-scroll-lock utility existed
anywhere in the codebase before this.

Separately, the user had also asked (same conversation) for both popups'
visual design to be improved and unified into one consistent pattern.

## Decision

Build one shared `Modal` component (`frontend/src/components/ui/Modal.jsx`)
using `createPortal(..., document.body)` — this escapes `<main>`'s transform
entirely, permanently, regardless of any future transform added anywhere in
the tree. It also owns body scroll lock, Escape/backdrop-click to close,
and a focus trap (generalized from logic that used to live directly in
`ExpertsPage.jsx`). Both `ProductDetailModal` and the expert/supplier
profile popup (previously a bottom sheet) were rebuilt on top of it,
replacing the bottom-sheet's slide-up-from-bottom treatment with the same
centered-card style everywhere.

## Alternatives considered

- **Patch `.page-enter` to not leave a lingering transform** (e.g. remove
  `forwards`, or explicitly reset `transform: none` after the animation).
  Rejected as the *primary* fix — it only fixes this one specific ancestor;
  any other future transform/filter/`will-change` added anywhere between
  `<body>` and a modal would silently reintroduce the exact same bug. A
  portal is the standard, durable fix for exactly this class of problem.
- **Keep the bottom sheet for profiles and only fix positioning, leaving
  the two visual patterns different.** Rejected — the user explicitly
  confirmed (via AskUserQuestion) they wanted one consistent pattern across
  both, not two patched-but-still-divergent ones.

## Consequences

- Every future popup on this site should use this shared `Modal` component
  rather than hand-rolling `position: fixed` — that's now the convention.
- The `.page-enter` transform-leak bug itself remains technically present
  in `Layout.jsx`/`index.css` — it's rendered harmless for modals via the
  portal, but a future non-portaled `position: fixed` element anywhere else
  in the app would still hit the same issue. Worth a dedicated cleanup if
  another instance turns up.
