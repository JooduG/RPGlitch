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

- [ ] **Phase 1: Profile & Core UI Cleanup**
  - Refactor `Profile.svelte` and `VisualWing.svelte`.
- [ ] **Phase 2: Storymode & Feed Cleanup**
  - Refactor `StorymodeFeed.svelte` and `Message.svelte`.
- [ ] **Phase 3: Atoms & Utilities Cleanup**
  - Refactor `TextField.svelte`, `Button.svelte`, etc.
- [ ] **Phase 4: Final Verification Audit**
  - Run `npm run verify` and manual grep.

---

> ⚒️ Operations | `css` | /02-implement
