# 🚀 FUTURE: Semantic Spacing Migration

## 🎯 Goal

Eliminate "heretical" raw spacing unit usages (`var(--spacing-*)`) in CSS `gap`, `padding`, and `margin` declarations project-wide. Enforce the use of semantic tokens defined in `DESIGN.md`.

## ✅ Verification (TDD)

- [ ] Profile.svelte: 0 raw spacing in gap/padding/margin.
- [ ] StorymodeFeed.svelte: 0 raw spacing in gap/padding/margin.
- [ ] Message.svelte: 0 raw spacing in gap/padding/margin.
- [ ] Project-wide Audit: `grep -r "var(--spacing-[0-9])" src/ui` returns 0 hits for gap/padding/margin.
- [ ] Chalk Regime compliance verified (0 Heresy).

## 🛠️ Tasks

- [ ] **Phase 1: Profile & Core UI Cleanup** <!-- { id: 1 } -->
  - [ ] Refactor `Profile.svelte` and `VisualWing.svelte`. <!-- { id: 2 } -->
- [ ] **Phase 2: Storymode & Feed Cleanup** <!-- { id: 3 } -->
  - [ ] Refactor `StorymodeFeed.svelte` and `Message.svelte`. <!-- { id: 4 } -->
- [ ] **Phase 3: Atoms & Utilities Cleanup** <!-- { id: 5 } -->
  - [ ] Refactor `TextField.svelte`, `Button.svelte`, etc. <!-- { id: 6 } -->
- [ ] **Phase 4: Final Verification Audit** <!-- { id: 7 } -->
  - [ ] Run `npm run verify` and manual grep. <!-- { id: 8 } -->

---

> 🎨 Tactics | `css` | /01-plan
