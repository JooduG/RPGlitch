# 🎯 Spec: Codebase Health Analysis & Cleanup

> **Goal:** Ensure the repository remains pristine ("Hygiene Protocol") by resolving technical debt, verifying architectural constraints, and finalizing the Svelte 5 transition.

## 1. Context

The codebase is a **greenfield rewrite** in Svelte 5. While `tracks.md` marks the initial build as "Complete", a secondary sweep is required to catch:

- Residual `TODO`/`FIXME` comments from the initial build.
- Potential "Pure IO" violations in logic pillars (`Gamemaster`, `Scholar`).
- Accidental inclusion of Svelte 4 patterns (common in LLM outputs or older tutorials).

## 2. Scope

### In-Scope

- **Technical Debt**: Resolution of confirmed `TODO` items in `src/`.
- **Architectural Cleanup**: Verification of `runtime.svelte.js` and `app.svelte.js` against "Pure IO" rules.
- **Svelte 5 Compliance**: Check for accidental usage of legacy syntax (`export let`).

### Out-of-Scope

- Major feature implementation (unless specified by a TODO).
- Visual redesigns (unless correcting a "Chalk Regime" violation).

## 3. Implementation Strategy

1. **Scan**: Identify targets using grep/AST analysis.
2. **Refactor**: Apply fixes minimally and atomically.
3. **Verify**: Ensure no regressions in the build or runtime.

## 4. Success Criteria

- [ ] No `TODO`s remaining in critical paths (`src/state`, `src/data`).
- [ ] `npm run build` passes without warnings.
- [ ] All 3 identified TODOs from initial scan are resolved or converted to formal Issues.
