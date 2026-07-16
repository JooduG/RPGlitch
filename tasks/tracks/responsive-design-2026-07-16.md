---
id: responsive-design-2026-07-16
type: refactor
status: completed
created_at: 2026-07-16
updated_at: 2026-07-16
description: Refactor layout structures, typography tokens, and target sizes to achieve dynamic responsive and touch-accessible interface states.
---

<!-- markdownlint-disable MD025 -->

# ETERNAL

## Objective

RPGlitch requires high-fidelity responsiveness across diverse screen formats. This track implements a hybrid responsive strategy: JS-state driven layout swapping for major layout configurations (e.g. Lobby vs Stage structures) and native CSS features (clamp, media queries, pointer sniffs, dvh units) for fluid rendering, accessibility zoom, and touch-pointer optimizations.

## Success Criteria

1. **Zero Layout Clipping**: Main chassis wraps to dynamic viewport height (`100dvh`), eliminating dynamic mobile address bar jumps.
2. **Touch Sizing Standards**: Pointer coarse detection expands interactive elements (console controls, profiles, tabs) to a minimum of 44x44px.
3. **A11y Text Zoom**: Fluid typography clamp settings use relative `rem` bounds, respecting browser font zoom options (WCAG 1.4.4).
4. **Zero Sticky Hovers**: Hover scale and brightness animations are restricted to pointers supporting hover states (`@media (hover: hover)`), preventing sticky states on touch.
5. **CI Cleanliness**: Passes `npm run verify` cleanly with 100% test coverage preserved.

## Boundaries

- **ALWAYS**: Use `DESIGN.md` as the single source of truth for tokens. Run `npm run sync:design` to compile.
- **NEVER**: Hardcode layout pixel definitions inside `.svelte` templates. Use responsive tokens or CSS classes.
- **ASK**: If altering Svelte 5 runtime stasis structures or introducing new viewport breakpoints.

## Logic Path

1. `DESIGN.md` -> Compile dynamic viewport variables (`dvh`), pointer coarse overrides, hover guards.
2. `Layout.svelte` & `App.svelte` -> Mount viewport chassis with dynamic viewport height.
3. `UnifiedConsole.svelte` & `Profile.svelte` -> Apply coarse padding overrides, target size adjustments.

---

# FUTURE

## Phase 1: Foundation (Design Tokens)

- [x] Update `DESIGN.md` layout height parameters to use `100dvh` and `dvh` units
- [x] Refine typography clamp definitions inside `DESIGN.md` to ensure `rem` bounds
- [x] Add coarse pointer query variables and `@media` hover overrides in `DESIGN.md`
- [x] Run `npm run sync` to compile design tokens and CSS variables
- [x] Verify `npm run verify` and design tests pass

## Phase 2: Chassis & Viewport (App Shell)

- [x] Update `src/App.svelte` body structure to use `h-[100dvh]`
- [x] Optimize `src/ui/organisms/Layout.svelte` grid columns/rows to avoid overflows on small screens
- [x] Run design tests and local dev verify check

## Phase 3: Molecules & Controls (Touch Targets)

- [x] Optimize `src/ui/molecules/UnifiedConsole.svelte` target sizes and spacing under `@media (pointer: coarse)`
- [x] Refine `src/ui/organisms/Profile.svelte` and `src/ui/organisms/CardHand.svelte` touch grids
- [x] Suppress hover effects on coarse pointer devices using `@media (hover: hover)`
- [x] Run full project verification check

---

# PRESENT

## Navigation & Pulse

- Active Task: Track Completed
- Current status: `completed`
- Pulse history:
  - 2026-07-16: Active specification draft finalized.
  - 2026-07-16: Implementation of all phases completed and verified via npm run verify.
