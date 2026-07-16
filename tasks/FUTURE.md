# Implementation Plan: Responsive Design Refactor

## Goal

Implement a hybrid responsive design layout and touch-accessible optimizations across RPGlitch.

## Research & Audit

- **Files affected**:
  - `DESIGN.md`
  - `src/App.svelte`
  - `src/ui/organisms/Layout.svelte`
  - `src/ui/molecules/UnifiedConsole.svelte`
  - `src/ui/organisms/Profile.svelte`

## Steps

### Phase 1: Foundation (Design Tokens)

- [ ] Update layout heights in `DESIGN.md` to use `dvh` units
- [ ] Add coarse pointer query variables and hover guards in `DESIGN.md`
- [ ] Compile design tokens using `npm run sync`
- [ ] Verify `npm run verify` and design tests pass

### Phase 2: Chassis & Viewport (App Shell)

- [ ] Update `src/App.svelte` container to use `h-[100dvh]`
- [ ] Adjust `src/ui/organisms/Layout.svelte` grid columns/rows for mobile scroll safety

### Phase 3: Molecules & Controls (Touch Targets)

- [ ] Expand interactive targets to 44x44px under `@media (pointer: coarse)` in `UnifiedConsole.svelte`
- [ ] Refine mobile tabs and layout details in `Profile.svelte`
- [ ] Limit hover effects to pointers with hover support (`@media (hover: hover)`)
- [ ] Run full project verification `npm run verify`
