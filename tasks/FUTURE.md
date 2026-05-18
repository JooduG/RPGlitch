# 🚀 FUTURE: Semantic Spacing Migration

## 🎯 Goal

Eliminate "heretical" raw spacing unit usages (`var(--spacing-*)`) in CSS `gap`, `padding`, and `margin` declarations project-wide. Enforce the use of semantic tokens defined in `DESIGN.md`.

## ✅ Verification (TDD)

- [x] Profile.svelte: 0 raw spacing in gap/padding/margin.
- [x] StorymodeFeed.svelte: 0 raw spacing in gap/padding/margin.
- [x] Message.svelte: 0 raw spacing in gap/padding/margin.
- [x] Project-wide Audit: `grep -r "var(--spacing-[0-9])" src/ui` returns 0 hits for gap/padding/margin.
- [x] Chalk Regime compliance verified (0 Heresy).

## 🛠️ Tasks

- [x] **Phase 1: Profile & Core UI Cleanup** <!-- { id: 1 } -->
  - [x] Refactor `Profile.svelte` and `VisualWing.svelte`. <!-- { id: 2 } -->
- [x] **Phase 2: Storymode & Feed Cleanup** <!-- { id: 3 } -->
  - [x] Refactor `StorymodeFeed.svelte` and `Message.svelte`. <!-- { id: 4 } -->
- [x] **Phase 3: Atoms & Utilities Cleanup** <!-- { id: 5 } -->
  - [x] Refactor `TextField.svelte`, `Button.svelte`, etc. <!-- { id: 6 } -->
- [x] **Phase 4: Final Verification Audit** <!-- { id: 7 } -->
  - [x] Run `npm run verify` and manual grep. <!-- { id: 8 } -->

---

> 🎨 Tactics | `css` | /01-plan
