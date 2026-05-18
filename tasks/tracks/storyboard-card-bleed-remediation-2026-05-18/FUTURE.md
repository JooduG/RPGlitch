# FUTURE: Storyboard Card Contrast & Bleed Remediation Plan

## 🎯 Goal
Remediate the signature color bleed and text legibility issues in `StoryboardCard.svelte` using robust gradient scrims and high-contrast typography tokens from `DESIGN.md`.

## ✅ Verification
- [ ] Card header backdrop uses vertical gradient `to top`.
- [ ] Card header `.primary` title text uses `var(--frisk)` (or high contrast fallback) instead of `var(--signature-color)`.
- [ ] Scrim opacity is increased to prevent bright background colors from bleeding through the bottom text.
- [ ] Code passes all Stylelint and ESLint checks.
- [ ] Build and unit tests pass successfully.

## 🛠️ Tasks

- [ ] **Phase 1: Design Review & Target Identification** <!-- { id: 1 } -->
  - [ ] Analyze exact lines of CSS in `StoryboardCard.svelte`. <!-- { id: 2 } -->
  - [ ] Identify optimal gradient scrim values using Nordic tokens in `DESIGN.md`. <!-- { id: 3 } -->

- [ ] **Phase 2: Code Refactoring & Implementation** <!-- { id: 4 } -->
  - [ ] Refactor `.header` gradient scrim in `StoryboardCard.svelte`. <!-- { id: 5 } -->
  - [ ] Refactor `.header .primary` typography styling for superb readability. <!-- { id: 6 } -->

- [ ] **Phase 3: Quality Gates & Verification** <!-- { id: 7 } -->
  - [ ] Run `npm run verify` to ensure CSS stylelint compliance and test success. <!-- { id: 8 } -->
  - [ ] Perform browser verification using the DevTools/browser subagent to audit the result. <!-- { id: 9 } -->
