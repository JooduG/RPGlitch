# Mission Plan

## Mission [059]: Responsive Grid Hardening

### Goal

Fix the "squashed panel" issue where the fixed-width left column overwhelms the right panel on mid-sized viewports.

### Proposed Changes

### [059.1] Flexible Portrait Grid [DONE]

- [x] [MODIFY] [Profile.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/Profile.svelte)
  - Change `grid-template-columns` from `280px 1fr` to `minmax(200px, 30%) 1fr`. This allows the portrait to shrink gracefully on narrower screens before the vertical stack triggers.

### [059.2] Header Typography Refinement [DONE]

- [x] [MODIFY] [EntityHeader.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/EntityHeader.svelte)
  - Reduce `maxSize` of the name from `96` to `64`. While `96` looks great on huge screens, it's too aggressive for the "De-layered" architecture and causes overlap on mid-sized screens.
  - Adjust `lineHeight` to `1.0` for tighter name blocks.

### [059.3] Breakpoint Optimization [DONE]

- [x] [MODIFY] [Profile.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/Profile.svelte)
  - Increase the mobile breakpoint from `768px` to `850px`. Given the presence of the side-wings, the modal needs more room to breathe in its horizontal state.

### [059.4] Flexible Fragment Labels [DONE]

- [x] [MODIFY] [EntityFragments.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/EntityFragments.svelte)
  - Change `grid-template-columns` for `.row` from `80px 1fr` to `minmax(60px, 80px) 1fr`. This saves precious horizontal pixels on mid-sized viewports.

### Verification Plan

- [ ] Test the modal at various widths (1200px, 900px, 800px, 600px).
- [ ] Ensure the portrait panel stays proportional and the right panel remains readable.

## Mission [064]: Profile Corner Hygiene

### Goal
Fix corner bleeding in the profile modal where scrolling content overlaps the rounded corners of the container.

### Proposed Changes
### [064.1] Right Panel Radius Clipping
- [ ] [MODIFY] [Profile.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/Profile.svelte)
  - Add matching `border-top-right-radius` and `border-bottom-right-radius` to `.right-panel`.
  - Ensure radii are reset at the mobile breakpoint.

### Verification Plan
- [x] Open profile modal on desktop.
- [x] Scroll right panel and verify no rectangular bleed in top-right/bottom-right corners.
- [x] Check mobile view (850px) to ensure layout remains stable.

## Mission [065]: Eliminating Profile Modal Gaps

### Goal
Finalize the "flat" aesthetic by removing the visual seam between the left and right panels of the profile modal.

### Proposed Changes

### [065.1] Unified Surface Architecture
- [ ] [MODIFY] [Profile.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/Profile.svelte)
  - Move `background: var(--glass-xl)` and `backdrop-filter: var(--blur-l)` from `.left-panel` to `.profile-presentation`.
  - Set `background: transparent` and `backdrop-filter: none` on `.left-panel`.
  - Ensure `grid-gap: 0` is explicit on `.profile-presentation`.

### [065.2] Section Background Removal
- [ ] [MODIFY] [EntityHeader.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/EntityHeader.svelte)
  - Remove `background` and `backdrop-filter` to allow the unified modal background to show through.
- [ ] [MODIFY] [EntityFragments.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/EntityFragments.svelte)
  - Remove `background` and `backdrop-filter` from `.wrapper`.
- [ ] [MODIFY] [EntityFooter.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/EntityFooter.svelte)
  - Remove `background` and `backdrop-filter` from `footer`.

### Verification Plan
- [ ] Inspect the profile modal at the vertical split between the portrait and the content.
- [ ] Verify there is no visible line, gap, or background shift between the two halves.
- [ ] Ensure the "flat" aesthetic is maintained across all sections (Header, Fragments, Footer).
