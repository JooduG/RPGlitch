# Mission Command (TODO)

## 🎯 Current Objectives

- [x] Refactor `src/ui/atoms/Tooltip.svelte` to use `resolve_px` <!-- id: 0 -->
- [x] Refactor `src/ui/utils/auto-resize.js` border resolution <!-- id: 1 -->
- [x] Refactor `src/ui/utils/fit-text.js` fontSize resolution <!-- id: 2 -->
- [x] System-wide audit for `parseFloat` on CSS properties <!-- id: 3 -->
- [x] Optimized `kinetic.js` and enhanced `dom.js` helpers <!-- id: 4 -->

## 🧠 Skill Log

| Timestamp (ISO 8601) | Task                           | Skill Invoked        | Outcome     |
| -------------------- | ------------------------------ | -------------------- | ----------- |
| 2026-05-11T22:12:00Z | Token Resolution Audit         | `using-agent-skills` | ✅ Resolved |
| 2026-05-11T22:19:00Z | Standardize Kinetic & DOM      | `javascript`         | ✅ Resolved |
| 2026-05-11T22:22:00Z | Context-Aware Resolution       | `javascript`         | ✅ Resolved |
| 2026-05-11T22:38:00Z | Session Boot & Auditor Cleanup | `using-agent-skills` | ✅ Resolved |

## 🛠️ Task Breakdown

- [x] **Task 0: Tooltip Resolution**
  - [x] Import `resolve_px` in `Tooltip.svelte`
  - [x] Replace `cached_spacing` manual logic with `resolve_px`
- [x] **Task 1: Auto-Resize Refinement**
  - [x] Verify if `border-width` needs `resolve_px` or if `parseFloat` on computed style is sufficient.
- [x] **Task 2: Fit-Text Consistency**
  - [x] Replace `parseFloat(getComputedStyle(...).fontSize)` with `resolve_px` in `fit-text.js`.
- [x] **Task 3: Final Standardization**
  - [x] Add `resolve_string` to `dom.js`
  - [x] Pass `node` context to all `resolve_` calls in utilities.

## Phase 4: Hardening & Compliance

- [ ] Investigate dynamic tokens (e.g., `--fill-start`) for auditor coverage <!-- id: 5 -->
- [ ] Create `src/ui/utils/dom.test.js` for resolution coverage <!-- id: 6 -->
- [ ] Expand `Slider.test.js` for dynamic token verification <!-- id: 7 -->
- [ ] Final system-wide audit (`npm run verify`) <!-- id: 8 -->
