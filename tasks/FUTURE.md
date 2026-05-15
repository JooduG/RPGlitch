# 🚀 FUTURE: Storyboard Identity Refinement & UX Polish

## 🎯 Goal

Refine the Storyboard UI to ensure 100% Satisfy font coverage in the title, improve legibility via text-shadows, elevate profile interaction z-indexes, and restore global typography utility classes.

## 🔍 Research & Audit

- [x] Audit `design.css` resets for font-family inheritance issues.
- [x] Verify z-index collisions between `StoryboardDynamicTitle` and `StoryboardCard` profile buttons.
- [x] Identify missing typography utility classes in `DESIGN.md`.

## ✅ Verification (TDD)

- [x] `Satisfy` font is applied to ALL parts of the dynamic title (Prefix & Entities).
- [x] Profile buttons on Storyboard cards are clickable even when the title field overlaps.
- [x] Title text remains legible on cards of the same color via shadow/outline.
- [x] `.font-cursive`, `.font-heading`, `.font-mono` utility classes exist and work.

## 🛠️ Tasks

- [x] **Phase 1: Typography & Utilities**
  - [x] Restore global typography utility classes in `DESIGN.md` (T4).
  - [x] Fix `span` inheritance for cursive fonts in `design.css` / resets.
- [x] **Phase 2: Legibility & Z-Index**
  - [x] Add dark text-shadow to `StoryboardDynamicTitle` for contrast.
  - [x] Elevate `StoryboardCard` profile action z-index and ensure pointer-events pass through.
- [ ] **Phase 3: Quality Gate Refinement**
  - [x] Update Stylelint to allow `0`, `0%`, `100%`, `50%`.
  - [ ] Update Warden documentation.
  - [ ] Resolve complex `text-shadow` linting issues.
- [ ] **Phase 4: Interaction Pass-through**
  - [x] Profile Modal backdrop pass-through.
  - [ ] Storyboard Card hover propagation.

---

> 🎨 Tactics | `design` | /01-plan
