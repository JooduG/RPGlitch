# Track: Storyboard Typography Heresy Remediation

## 🎯 Objective

Resolve CSS token violations ("Heresy") identified by the Warden audit in `StoryboardDynamicTitle.svelte` by correctly registering the `--font-family-cursive` token in the `DESIGN.md` sovereign source and ensuring strict consumption of architectural tokens.

## 🔍 Research & Audit

- [ ] Verify `DESIGN.md` foundation for cursive font registry.
- [ ] Confirm `Warden` audit failure state for hallucinated tokens.
- [ ] Audit `StoryboardDynamicTitle.svelte` for raw unit leaks.

## 🛠️ Tasks

- [ ] **Phase 1: Foundation Registry**
  - [ ] Add `font-family-cursive: '"Satisfy", cursive'` to `DESIGN.md` foundations.
- [ ] **Phase 2: Synchronization & Alignment**
  - [ ] Run `npm run sync:design` to update `design.css`.
  - [ ] Update `StoryboardDynamicTitle.svelte` to ensure it consumes the official token.
- [ ] **Phase 3: Quality Assurance**
  - [ ] Run `npm run audit:css` (The Warden) to verify remediation.
  - [ ] Execute `npm run deploy:prepare` to confirm full build pipeline stability.

## ✅ Definition of Done

- [ ] `DESIGN.md` contains the authoritative cursive font token.
- [ ] `design.css` is synchronized and reflects the new token.
- [ ] `StoryboardDynamicTitle.svelte` passes the Warden audit (0 hallucinated tokens).
- [ ] `npm run verify` passes with 0 violations.

---

> 🎨 Tactics | `design` | /01-plan
