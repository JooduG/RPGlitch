# [Refactor] Final UI Component Migration

Normalize the remaining UI components to ensure 100% compliance with the 3-tier design token architecture defined in `engine.css`.

## User Review Required

> [!IMPORTANT]
> This is the final stage of the design token normalization. All components will now rely on semantic Tier 2 tokens for spacing, layout, and kinetic behavior.

## Proposed Changes

### [UI Components]

#### [MODIFY] [Drawer.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/drawer/Drawer.svelte)

- Replace all legacy spacing tokens (`--spacing-X`) with semantic T2 tokens (`--space-X`).
- Remove raw pixel values (e.g., `2px` bars) and replace with relative units or `var(--spacing-px)`.
- Align header typography and layout with semantic grid units.
- Standardize interaction transitions using `var(--motion-standard)`.

#### [MODIFY] [LibraryCard.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/drawer/LibraryCard.svelte)

- Replace `var(--opacity-m)` with `var(--opacity-muted)`.
- Normalize padding and bar height using semantic tokens.
- Replace raw `line-height: 1.2` with `var(--line-height-tight)`.

#### [MODIFY] [Backdrop.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/atoms/Backdrop.svelte)

- Update `z-index` to use semantic `var(--z-overlay)`.

#### [MODIFY] [Dialog.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/atoms/Dialog.svelte)

- Fix typo `var(--font-weight-xl)` to `var(--font-weight-heavy)`.

### [Audit & Stability]

#### [MODIFY] [app.svelte.js](file:///c:/Users/johng/source/repos/RPGlitch/src/state/app.svelte.js)

- Fix TypeScript index signature errors in `init_viewport` using correct type casting.
- Refactor touch detection to use direct property check for `ontouchstart` to resolve `in-operator-narrowing` diagnostic.

#### [MODIFY] [types.d.ts](file:///c:/Users/johng/source/repos/RPGlitch/types.d.ts)

- Augment `Window` interface with `ontouchstart` for improved type safety and diagnostic resolution.

#### [MODIFY] [Layout.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/Layout.svelte)

- Resolve "unused CSS selector" warnings by fixing redundant nested `.universal-stage` selectors.
- Implement `is-mini` binding for ultra-small viewports.

#### [MODIFY] [EntityFragments.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/EntityFragments.svelte), [EntityFooter.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/profile/EntityFooter.svelte), [Drawer.svelte](file:///c:/Users/johng/source/repos/RPGlitch/src/ui/drawer/Drawer.svelte)

- Add missing `is-mini` class bindings for consistent responsive state propagation.

---

### [Phase 6: RCS Migration]

#### [MODIFY] [engine.css](file:///c:/Users/johng/source/repos/RPGlitch/src/theme/engine.css)

- [DELETE] `--color-black-rgb`, `--color-white-rgb`, `--color-chalk-rgb`.
- Update all internal variable dependencies (borders, elevations) to use Relative Color Syntax.

#### [MODIFY] [UI Components]

- Migrate all inline `rgb(var(--color-X-rgb) / alpha)` patterns to `rgb(from var(--color-X) r g b / alpha)`.
- Impacted files: `Message.svelte`, `VisualWing.svelte`, `VectorArray.svelte`, `EntityFragments.svelte`, `DataBox.svelte`, `DevTelemetryBlock.svelte`, `StoryboardDynamicTitle.svelte`, `ImagePreview.svelte`.

## Verification Plan

### Automated Tests

- `npm run verify` (including `svelte-check`) to ensure zero errors and zero warnings.

### Manual Verification

- Resize browser window to 768px (mobile) and 480px (mini) to verify vertical stacking and state-driven class application.
