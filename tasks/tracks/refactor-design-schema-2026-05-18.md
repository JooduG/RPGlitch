---
id: refactor-design-schema-2026-05-18
title: Refactor DESIGN.md Schema
status: Done
---

## ETERNAL

### Objective

Refactor `DESIGN.md` to comply with the new `@google/design.md` schema, flattening the structure, simplifying tokens (ultra-lean naming), and maintaining the "Chalk Regime" aesthetic. Replace legacy tokens across the codebase and update the `sync:design` script to parse the new structure.

### Boundaries

- **Must** maintain 1:1 visual parity.
- **Must** pass `npx @google/design.md lint DESIGN.md`.
- **Must** retain custom groups (e.g. kinetic, elevation) in some format rather than discarding them.
- **Must** write a JS migration script to bulk replace old CSS variables with new ones.

## FUTURE

- [x] Analyze and map old tokens to new tokens.
- [x] Write JS bulk replacement script.
- [x] Migrate `DESIGN.md`.
- [x] Run JS bulk replacement script.
- [x] Update Weaver (`npm run sync:design`).
- [x] Lint and verify.
