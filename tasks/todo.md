# Mission Command (TODO)

## 🎯 Current Objectives

- [x] Refactor `src/ui/atoms/Tooltip.svelte` (performance & resolution) <!-- id: 0 -->
- [x] Refactor `src/ui/utils/auto-resize.js` border resolution <!-- id: 1 -->
- [x] Refactor `src/ui/utils/fit-text.js` fontSize resolution <!-- id: 2 -->
- [x] System-wide audit for `parseFloat` on CSS properties <!-- id: 3 -->
- [x] Optimized `kinetic.js` and enhanced `dom.js` helpers <!-- id: 4 -->
- [x] Harden `dom.js`: fallback preservation & DOM hygiene <!-- id: 9 -->
- [x] Enforce strict units for durations in `dom.js` <!-- id: 10 -->
- [x] Remove manual CSS variable resolution in `dom.js` <!-- id: 11 -->

## 🧠 Skill Log

| Timestamp (ISO 8601) | Task                           | Skill Invoked             | Outcome     |
| -------------------- | ------------------------------ | ------------------------- | ----------- |
| 2026-05-11T22:12:00Z | Token Resolution Audit         | `using-agent-skills`      | ✅ Resolved |
| 2026-05-11T22:19:00Z | Standardize Kinetic & DOM      | `javascript`              | ✅ Resolved |
| 2026-05-11T22:22:00Z | Context-Aware Resolution       | `javascript`              | ✅ Resolved |
| 2026-05-11T22:38:00Z | Session Boot & Auditor Cleanup | `using-agent-skills`      | ✅ Resolved |
| 2026-05-12T00:43:00Z | Harden DOM Fallbacks           | `javascript`              | ✅ Resolved |
| 2026-05-12T01:50:00Z | Fix DOM Test Mocks & Verify    | `test-driven-development` | ✅ Resolved |
| 2026-05-12T02:05:00Z | Harden DOM Proxy Resolution    | `javascript`              | ✅ Resolved |
| 2026-05-12T02:25:00Z | Enforce Strict Duration Units  | `javascript`              | ✅ Resolved |
| 2026-05-12T02:35:00Z | Remove Redundant CSS Lookup    | `javascript`              | ✅ Resolved |
| 2026-05-12T02:40:00Z | Optimize Tooltip Positioning   | `svelte`                  | ✅ Resolved |
| 2026-05-12T05:22:00Z | Harden parseFloat Comparisons  | `javascript`              | ✅ Resolved |
| 2026-05-12T07:48:00Z | Harden Modal Transition Offset | `svelte`                  | ✅ Resolved |
| 2026-05-12T07:49:00Z | Harden ProfilePicture minSize  | `svelte`                  | ✅ Resolved |
| 2026-05-12T08:05:00Z | Fix Kinetic Race Conditions    | `javascript`              | ✅ Resolved |

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
- [x] Create `src/ui/utils/dom.test.js` for resolution coverage <!-- id: 6 -->
- [ ] Expand `Slider.test.js` for dynamic token verification <!-- id: 7 -->
- [x] Fix race conditions in `kinetic.js` `pulse` action <!-- id: 12 -->
- [ ] Expand `dom.js` resolution tests for fallback robustness <!-- id: 13 -->
- [x] Final system-wide audit (`npm run deploy:prepare`) <!-- id: 8 -->
