# Mission Plan - UI Component Architecture Refinement

Standardize and harden the UI component architecture by resolving CSS variable resolution issues, fixing layout inconsistencies, and ensuring reactive design token adherence.

## 🎯 Objectives

1. **Fix CSS Variable Resolution**: Update `src/ui/utils/dom.js` to correctly resolve contextual CSS variables (especially complex expressions like `calc` and `var()`) by ensuring the measurement element inherits the correct context.
2. **Harden Kinetic Actions**: Ensure kinetic actions in `src/ui/utils/kinetic.js` and `src/ui/utils/auto-resize.js` use the improved resolution logic.
3. **Reactive Tooltip Spacing**: Ensure `src/ui/atoms/Tooltip.svelte` handles spacing reactively to root font-size changes.
4. **Verification**: Verify all changes with existing tests and new test cases for CSS variable resolution.
5. **Core Utility Coverage**: Create `src/ui/utils/dom.test.js` to verify `resolve_` helpers against complex CSS.
6. **Component Verification**: Expand `Slider.test.js` to verify dynamic tokens.
7. **System Hygiene**: Run `npm run verify` and address any remaining lint/audit debt.

## 🛠️ Proposed Changes

### `src/ui/utils/dom.js`

- Improve `resolve_px`, `resolve_ms`, `resolve_number`, and `resolve_string` to handle `context` more robustly.
- Implement a strategy where the shared measure element is temporarily moved into the context for accurate resolution of local variables.

### `src/ui/utils/auto-resize.js`

- Ensure it uses the improved `resolve_px`.
- Audit for any direct `parseFloat` calls on raw CSS variable strings.

### `src/ui/utils/kinetic.js`

- Ensure all kinetic actions use `resolve_ms` and other resolution helpers instead of potentially fragile direct parsing.

### `src/ui/atoms/Tooltip.svelte`

- If `cached_spacing` exists (or its equivalent), ensure it's not a module-level constant if it depends on `rem`/`em`.
- Ensure padding resolution is reactive to environment changes.

## ✅ Acceptance Criteria

- `resolve_px` correctly returns pixel values even when passed a CSS variable or `calc()` expression that depends on contextual variables.
- `auto-resize` works correctly with `--auto-resize-buffer` defined as a variable.
- Kinetic actions (shimmy, pulse, etc.) correctly resolve durations from CSS variables.
- No regression in existing UI tests.
