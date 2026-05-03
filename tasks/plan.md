# Mission [059]: Responsive Grid Hardening

## Goal

Fix the "squashed panel" issue where the fixed-width left column overwhelms the right panel on mid-sized viewports.

## Proposed Changes

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

## Verification Plan

- [ ] Test the modal at various widths (1200px, 900px, 800px, 600px).
- [ ] Ensure the portrait panel stays proportional and the right panel remains readable.
- [ ] Verify that the vertical stack triggers at `850px`.
