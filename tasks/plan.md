# Mission Plan: UI Stabilization & Alignment [045]

> **Status**: `[IN_PROGRESS]`
> **Mission**: Resolve regressions in UI layout, accessibility, and architectural standards identified during the AudioWing refactor.

## Proposed Changes

### [UI/UX]

- [x] Match Audio selection dropdown width to parent row.
- [x] Implement portal-based positioning for voice selection to prevent clipping.
- [x] Enhance accessibility with WAI-ARIA listbox patterns in `AudioWing.svelte`.
- [x] Fix line-clamping and scrolling stability in `StoryboardCard` and `Wing` components.
- [x] Correct event safety and robustness in `Profile.svelte`.

### [Architectural Stabilization]

- [x] Restore security safeguards (payload limits, JSON parsing, prompt escaping).
- [x] Align UI containers with semantic design tokens (`--panel-width-*`).
- [x] Refine `auto-resize` utility with `MutationObserver` and performance optimizations.
- [x] Reinstate `get_contrast_color` unit tests and standard verification suites.

## Verification

- [x] All unit tests passing (`npm run test:unit`).
- [x] Linting and structural audits clean.
- [x] Visual verification of dropdown alignment and smooth transitions.
