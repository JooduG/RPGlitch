# Mission Plan: CSS Token Reconciliation & System Integrity

## 1. Audit & Analysis

- [ ] Run `scratch/token-audit.js` and save output to `tmp/token-audit-report.txt`.
- [ ] Categorize identified missing tokens:
  - **T1 (Foundations)**: Basic colors, spacing, radius, opacities.
  - **T2 (Semantics)**: Functional tokens (e.g., `--signature-color`, `--danger-hover-shadow`).
  - **T3 (Components)**: Component-specific overrides (e.g., `--tf-shield-active`, `--toggle-width`).
- [ ] Identify and fix legacy/hallucinated tokens (e.g., `var(--background-base)` -> `var(--background-base)`).

## 2. Engine Update (src/theme/engine.css)

- [ ] Define T1/T2 tokens identified in the audit.
- [ ] Centralize T3 component tokens where they are shared or high-leverage.
- [ ] Ensure all tokens follow the naming convention and architectural structure.

## 3. Component Refactoring

- [ ] Update Svelte components to use corrected tokens.
- [ ] Fix the `--color-text-pri` typo in `VectorArray.svelte`.
- [ ] Ensure `TextField`, `Slider`, `Toggle` etc. consume tokens from `engine.css` instead of local magic values where possible.

## 4. Utility Hardening

- [ ] Review `kinetic.js` and `auto-resize.js` for any remaining module-level token constants.
- [ ] Ensure dynamic `getComputedStyle` fetching is used for all design system values.

## 5. Verification

- [ ] Run `node scratch/token-audit.js` to ensure zero missing tokens.
- [ ] Run `npm run lint:css` to verify style integrity.
- [ ] Run `npm run verify` for final local CI gate.
