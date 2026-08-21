# 🚀 Implementation Blueprint — `track-relational-constellation-ui-2026-08-21`

> **Track Goal**: Build an interactive radial constellation visualization for entity relationships at the bottom of the Profile view with signature-colored directional SVG arrows, interactive tooltips, and profile navigation, while marking Hank and Glitch as trans-fractal wanderers.
>
> 1. **Premade Wanderers**: Update `src/data/definitions/premades.js` setting `is_wanderer: true` on `rust` and `glitch`.
> 2. **Radial Relational Constellation Component**: Create `src/ui/profile/RelationalGraph.svelte` supporting incoming & outgoing edges, radial trigonometry, signature color arrows, curved offset paths for bidirectional links, interactive tooltips, and click-to-open entity switching.
> 3. **Profile Integration**: Mount the constellation at the bottom of `src/ui/profile/Profile.svelte`.
> 4. **TDD & Verification**: Create unit tests in `src/ui/profile/RelationalGraph.test.js`, run `npm run verify` and `npm run deploy:prepare`.

---

## 1. Tactical Tasks

- [x] `task-1`: **RED Test Suite — Wanderers & Relational Graph**: Write failing tests in `premades.test.js` (or `normalizer.test.js`) and `RelationalGraph.test.js` validating wanderer premade flags, edge harvesting, and SVG geometric properties.
- [x] `task-2`: **GREEN Implementation — Premade Wanderers**: Update `premades.js` setting `is_wanderer: true` on `rust` and `glitch`.
- [x] `task-3`: **GREEN Implementation — RelationalGraph.svelte**: Create `RelationalGraph.svelte` with radial layout, dual-directional arrow calculations, signature color markers, glassmorphism tooltips, and entity navigation callbacks.
- [x] `task-4`: **GREEN Implementation — Profile Integration**: Embed `RelationalGraph` into `Profile.svelte` with reactive entity binding and edit-mode edge editing.
- [x] `task-5`: **REFACTOR & Verification Baseline**: Run full verification suite `npm run verify` and production build `npm run deploy:prepare`.

---

## 2. Verification Gate

- Unit Tests: `npx vitest run src/ui/profile/RelationalGraph.test.js src/data/normalizer.test.js`
- Full Verify: `npm run verify`
- Production Build: `npm run deploy:prepare`
