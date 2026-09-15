# 0012: Shrink the main bundle by moving Firestore init to its sole consumer

- **Date:** 2026-09-15
- **Commit:** `99dc2f5`
- **Status:** Accepted

## Context

A frontend audit found `frontend/src/firebase.js` called
`export const db = getFirestore(app)` at module scope. `firebase.js` is
imported by `AuthContext.jsx` (for `auth`/`googleProvider`/
`facebookProvider` — not `db`), and `AuthContext` wraps the entire app
eagerly in `App.jsx`. Because Vite bundles based on the *module import
graph*, that one unconditional import dragged all of `firebase/firestore`
into the main entry chunk for every visitor — including anonymous users who
never touch the one feature (farm profile / analysis history) that actually
uses Firestore. Confirmed via `grep` that the *only* consumer of `db` is
`frontend/src/lib/firestore.js`, and the only importer of that file is
`ProfilePage.jsx`, which was already a lazy route.

## Decision

Remove the `getFirestore` import/call from `firebase.js` entirely; move
`import { getFirestore } from 'firebase/firestore'` and
`const db = getFirestore(app)` into `lib/firestore.js` itself, the sole
consumer. No other call site changes needed.

## Alternatives considered

- **Wrap `db` in a dynamic-`import()`-based lazy getter
  (`async function getDb() { ... }`).** Considered first, but rejected as
  unnecessary complexity once it was confirmed that the sole consumer
  (`lib/firestore.js`) is *already* only reachable through a lazy route.
  Moving the static import to that already-lazy file achieves the same
  bundle-splitting outcome without making every Firestore call site `await`
  an extra indirection.
- **Leave it as-is; the main bundle size wasn't blocking anything
  functionally.** Rejected — this was one of the audit-surfaced polish
  items the user explicitly chose to act on, and the fix was low-risk
  (confirmed via `npm run build` before/after) with a measurable result.

## Consequences

- Main `index-*.js` chunk dropped from ~610KB to ~385KB gzipped-source size
  (verified via build output); the Vite chunk-size warning no longer fires
  at all.
- If a *second* consumer of Firestore is ever added outside the
  `ProfilePage` lazy route (e.g. a Firestore read from an eagerly-loaded
  component), it would silently pull `firebase/firestore` back into
  whichever chunk contains that new call site — worth checking bundle size
  again if Firestore usage expands.
