# Mission Plan

## Mission [067]: UI Architecture Simplification [DONE]

### Goal

Simplify and standardize the UI architecture by aggressively merging dispersed state and component logic for Tooltips, Lightboxes, and Backgrounds based on the "Aggressive Merge" strategy.

### Completed Changes

#### [067.1] Tooltip Consolidation [DONE]

- [x] [MODIFY] `src/ui/atoms/Tooltip.svelte`
  - Merged portal rendering logic from `TooltipRenderer.svelte` and state management from `tooltip.svelte.js`.
  - Action `tooltip` and singleton `tooltip_manager` are now exported from `context="module"`.
- [x] [DELETE] `src/ui/shell/TooltipRenderer.svelte`
- [x] [DELETE] `src/ui/atoms/tooltip.svelte.js`
- [x] [MODIFY] `src/ui/App.svelte`
  - Replaced `<TooltipRenderer />` with global `<Tooltip />` instance.
- [x] [MODIFY] System-wide imports
  - Updated all components (Drawer, LibraryCard, AudioWing, etc.) to import `tooltip` from `@atoms/Tooltip.svelte`.

#### [067.2] Lightbox Consolidation [DONE]

- [x] [MODIFY] `src/ui/atoms/Lightbox.svelte`
  - Merged state and methods from `lightbox.svelte.js`.
  - Reactive `lightbox` state and methods `openLightbox`/`closeLightbox` are now exported from `context="module"`.
- [x] [DELETE] `src/state/lightbox.svelte.js`
- [x] [MODIFY] `src/state/app.svelte.js`
  - Updated imports to point to `@atoms/Lightbox.svelte`.
- [x] [MODIFY] `src/ui/App.svelte`
  - Updated imports and usage.

#### [067.3] Background Consolidation [DONE]

- [x] [MODIFY] `src/ui/App.svelte`
  - Inlined the gradient and fractal rendering logic and styles directly into the root app shell.
- [x] [DELETE] `src/ui/shell/Background.svelte`

### Verification Results

- [x] **Lint**: Passed `npm run lint`.
- [x] **Structural Integrity**: All redundant files removed. Global singletons remain functional via module context exports.
- [x] **Aesthetic Parity**: UI logic remains identical; only the architectural location changed.
