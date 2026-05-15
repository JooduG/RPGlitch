# 🛰️ Track: signature-color-hardening

Status: 🔄 Active
Objective: Eliminate "white background" anomalies by hardening the ThemeStore color resolution logic

## 🎯 Goal

Ensure that entity signature colors always resolve to vibrant, Nordic-compliant tokens, even when entity data is missing or corrupted.

## 🔍 Research & Audit

- [x] Identified that `get_deterministic_color` hashes into the entire `PALETTE`.
- [x] Verified "white seed" anomaly with `scratch/find_white.js`.
- [x] Confirmed that `ProfilePicture.svelte` and `Profile.svelte` are affected.

## 🛠️ Implementation Plan

### Phase 1: Registry Refinement

- [ ] Define `SIGNATURE_COLORS` whitelist in `src/theme/tokens.js` (or filter `PALETTE` in `palette.svelte.js`).
- [ ] Ensure the whitelist excludes backgrounds, neutrals, and non-vibrant utility colors.

### Phase 2: Logic Hardening

- [ ] Refactor `ThemeStore.get_deterministic_color` to only return colors from the safe whitelist.
- [ ] Update `ThemeStore.get_signature_color` to enforce a hard default (e.g., `electric-cyan`) for null/undefined inputs.

### Phase 3: Verification (TDD)

- [ ] Update `src/theme/palette.test.js` with tests for:
  - [ ] Deterministic consistency (same seed -> same color).
  - [ ] Whitelist compliance (no "Pure White" or "Abyssal Black" returned).
  - [ ] Null/Undefined fallback safety.
- [ ] Run `npm run test` to verify logic.

### Phase 4: UI Integration & Audit

- [ ] Verify `ProfilePicture.svelte` renders correctly with null entities.
- [ ] Run `npm run audit:css` to ensure no token regressions.

## ✅ Definition of Done

- [ ] `ThemeStore` never returns a non-signature color for entity resolution.
- [ ] `test9` (and other previously "white" seeds) resolves to a vibrant color.
- [ ] 0 unit test failures in `palette.test.js`.
