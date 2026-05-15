# 🚀 FUTURE: Storyboard Identity UI Refinement

## 🎯 Goal

Enhance the Storyboard interface to meet the "Chalk Regime" standards of clinical precision. This involves replacing the legacy "eye" icon with a premium "ID Card" symbol and sharpening entity glow effects to eliminate visual "messiness" (kladdigt).

## 🔍 Research & Audit

- [x] Identify legacy icon in `StoryboardCard.svelte`.
- [x] Audit `StoryboardDynamicTitle.svelte` glow intensity.
- [x] Verify `StoryboardCard` hover background regression.

## ✅ Verification (TDD)

- [ ] New ID Card icon is visible and correctly colored.
- [ ] Hover states on StoryboardCards do not cause background transparency.
- [ ] Dynamic Title glow is sharp (radius < 8px) and restricted to signature text.

## 🛠️ Tasks

- [ ] **Phase 1: StoryboardCard Overhaul**
  - [ ] Replace eye icon SVG with ID Card SVG.
  - [ ] Fix hover background transparency logic.
- [ ] **Phase 2: Dynamic Title Precision**
  - [ ] Refine `text-shadow` in `StoryboardDynamicTitle.svelte`.
  - [ ] Invert glow: Signature colors glow, white text stays sharp.
- [ ] **Phase 3: Final Polish**
  - [ ] Verify aesthetic alignment with DESIGN.md Nordic tokens.

---

> 🎭 Strategy | `design` | /01-plan
