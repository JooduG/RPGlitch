# Mission Plan

## Mission [070]: ControlPanel Type Tightening [DONE]

### Goal

Strictly define prop interfaces for `ControlPanel` inputs to eliminate runtime type coercion and enforce the "Ultra-Lean" data contract.

### Proposed Changes

#### [070.1] ControlPanel Prop Interfaces [DONE]

- [x] [MODIFY] `src/ui/devmode/ControlPanel.svelte`
  - [x] Implement TypeScript interfaces for `control` props.
- [x] [MODIFY] `src/state/control.svelte.js`
  - [x] Tighten type definitions for exported reactive objects.

---

## Mission [069]: TextField Class Normalization [DONE]

### Goal

Standardize the `TextField` component usage in `ControlPanel.svelte` by replacing the legacy `prologue-field` class with the "Ultra-Lean" Chalk Regime semantic standard (`text-area custom-field`).

### Completed Changes

#### [069.1] ControlPanel Normalization [DONE]

- [x] [MODIFY] `src/ui/devmode/ControlPanel.svelte`
  - Replace legacy `class="prologue-field"` with `class="text-area custom-field"`.

### Verification Results

- [x] **Lint**: Passed `npm run lint`.
- [x] **Tests**: Passed `npm run test`.
- [x] **Aesthetic Parity**: Standardized classes inherit global styles without drift.

---

## Mission [067]: UI Architecture Simplification [DONE]

### Goal

Simplify and standardize the UI architecture by aggressively merging dispersed state and component logic for Tooltips, Lightboxes, and Backgrounds based on the "Aggressive Merge" strategy.

### Completed Changes

#### [067.1] Tooltip Consolidation [DONE]

- [x] [MODIFY] `src/ui/atoms/Tooltip.svelte`
- [x] [DELETE] `src/ui/shell/TooltipRenderer.svelte`
- [x] [DELETE] `src/ui/atoms/tooltip.svelte.js`
- [x] [MODIFY] `src/ui/App.svelte`
- [x] [MODIFY] System-wide imports

#### [067.2] Lightbox Consolidation [DONE]

- [x] [MODIFY] `src/ui/atoms/Lightbox.svelte`
- [x] [DELETE] `src/state/lightbox.svelte.js`
- [x] [MODIFY] `src/state/app.svelte.js`
- [x] [MODIFY] `src/ui/App.svelte`

#### [067.3] Background Consolidation [DONE]

- [x] [MODIFY] `src/ui/App.svelte`
- [x] [DELETE] `src/ui/shell/Background.svelte`

### Verification Results

- [x] **Lint**: Passed `npm run lint`.
- [x] **Structural Integrity**: All redundant files removed. Global singletons remain functional via module context exports.
- [x] **Aesthetic Parity**: UI logic remains identical; only the architectural location changed.
