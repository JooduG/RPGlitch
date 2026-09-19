---
name: track-prompt-architecture-purification-and-physics-decoupling
description: Decouple prompt XML compilers from physics.js into modules/protocols.js and modules/task.js, wire shared math utils, and clean domain boundaries
status: queued
last_synchronized: 2026-09-19
---

# 🎯 Track: Prompt Architecture Purification & Physics Decoupling

## 1.0 Vision & High-Level Architecture

Cleanly deconstruct prompt compilation artifacts from `src/intelligence/physics.js` and relocate them into `src/intelligence/modules/`:

1. **Relocate Dynamics XML Compilers to `modules/protocols.js`**:
   - `render_dynamics_xml()`
   - `render_dynamics_axes_xml()`
2. **Relocate Subtext & Available Keywords XML Compilers to `modules/task.js`**:
   - `render_subtext_xml()`
   - `render_available_keywords_xml()`
   - `resolve_context_directives()`
   - `resolve_physics_protocols()`
3. **Purify `src/intelligence/physics.js`**:
   - Import `clamp` and numeric normalization from `@utils` (e.g. `src/utils/math.js`).
   - Pure focus on math baselines, delta computation, gravity settlement, and rule evaluation.
   - Zero XML compilation strings in `physics.js`.
4. **Update Callers & Tests**:
   - Re-route `builder.js` and `physics.test.js` / `task.test.js` / `protocols.test.js`.
   - Update `src/intelligence/index.js` sovereign barrel.

---

## 2.0 Playbook & Verification Checklist

- [ ] [RED] Audit existing test assertions in `physics.test.js`, `task.test.js`, and `protocols.test.js`.
- [ ] [GREEN] Move `render_dynamics_xml` and `render_dynamics_axes_xml` to `modules/protocols.js`.
- [ ] [GREEN] Move `render_subtext_xml`, `render_available_keywords_xml`, `resolve_context_directives`, and `resolve_physics_protocols` to `modules/task.js`.
- [ ] [GREEN] In `physics.js`, import and use `clamp` from `@utils` for baseline gravity clamping.
- [ ] [GREEN] Re-export XML compilers from `src/intelligence/index.js` or directly from `modules/`.
- [ ] [GREEN] Update call sites in `builder.js` to import XML compilers from `modules/protocols.js` and `modules/task.js`.
- [ ] [REFACTOR] Update tests and verify 100% pass across all 70 test suites (`npm run verify`).
