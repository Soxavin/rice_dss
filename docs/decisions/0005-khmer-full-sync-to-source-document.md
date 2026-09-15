# 0005: Khmer/English product text — full sync to source document, not a minimal patch

- **Date:** 2026-09-14
- **Commit:** `7f73387`
- **Status:** Accepted

## Context

The user noticed Khmer product text looked "glitchy" and asked whether it
matched the original source material. Investigation found the *real* source
was `FYP.docx`/`FYP.pdf` (a 12-page Vigor product catalog) — not the two
unrelated PDFs initially checked. The DOCX had clean, uncorrupted Khmer
(extractable from `word/document.xml`); the PDF export had lost Khmer font
embedding, which is the likely root cause of the original corruption
(someone probably copied text out of the broken PDF render instead of the
DOCX). Confirmed corruption: `desc_km` for BioGuard/BioCombat/BioGo was
fragmented into single syllables with stray spaces; `name_km` had a milder
missing-vowel-sign issue across four other products.

## Decision

Do a **full sync** of all 7 products' `name_km`/`desc_km` (and `desc_en`
where the source had fuller wording) to the document's verbatim text via a
new Alembic migration — not a minimal patch touching only the 3 visibly
corrupted products. Also added a `category_km` column, seeded with the
document's own Khmer branding taglines (e.g. "អធិរាជកៅស៊ូ" for BioLatex)
where the document provided them, and two authored taglines in the same
style for the two products it didn't cover.

## Alternatives considered

- **Patch only the 3 visibly-corrupted products (BioGuard/BioCombat/BioGo).**
  Rejected — offered to the user explicitly; they chose full sync, reasoning
  that the milder corruption in the other 4 products' `name_km` was still
  wrong even if less visually obvious, and a single migration doing
  everything at once is cheaper than two separate correction passes.
- **Machine-translate category labels instead of using the document's
  taglines.** Rejected — the document's own branding taglines are the
  authentic voice already used by the product's real marketing; a generic
  translation of "Disease Control" would be technically correct but
  inconsistent with the other 5 categories that do use the document's
  taglines.

## Consequences

- Never edit the already-applied seed migration (`3f8a1c9b2d45`) directly —
  data corrections always go in a new migration with `UPDATE` statements,
  per the project's existing Alembic convention (see `CLAUDE.md`).
- The two authored taglines (BioYield+, BioControl) are not from the source
  document — if the real Vigor marketing team ever publishes official
  taglines for those two, this migration's values should be revisited.
