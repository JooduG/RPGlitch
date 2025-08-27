---
description: "RPGlitch single-file Perchance deliverable with storyboard + profiles functionality"
tags:
  - rpglitch
  - perchance
  - storyboard
  - profiles
globs:
  - "**/*.html"
  - "**/*.js"
  - "**/*.scss"
---

# RPGlitch

Single-file Perchance deliverable with storyboard + profiles functionality.

## For Developers (Human Documentation)

### Build Commands

```bash
# Development build
node build/scripts/build-rpglitch.js
```

### Entry / Output

- Entry HTML: `apps/rpglitch/html/index.html`
- Output HTML: `build/output/RPGlitch.html`

## Development Rules (AI Instructions)

### RPGlitch-Specific Requirements

- Storyboard functionality with dynamic title management
- Character and profile management with persistent storage
- Deterministic placeholder system for consistent UX
- Item management with full-featured forms and card interactions

## Current Tasks (RPGlitch-Specific)

### High Priority

- [ ] **Storyboard Flow Hardening**: Finalize toolbar interactions, cancel, and dynamic title
- [ ] **JavaScript Modularization**: Continue breaking down remaining business logic modules
- [ ] **Chin Visual Polish**: Fine‑tune margins/padding for wide viewports

### Medium Priority

- [ ] **UI Module Implementation**: Complete remaining RPGlitch-specific UI components
- [ ] **Item Form Development**: Build full-featured item forms with validation
- [ ] **Watch Script**: Add a `watch:rpglitch` npm script if watch mode is desired
- [ ] **Quiet Logs**: Gate info logs behind a secondary flag if needed

### Low Priority

- [ ] **Card Interaction System**: Implement interactive card system for items/characters
- [ ] **Performance Optimization**: Optimize for Perchance single-file constraints
- [ ] **Accessibility Audit**: Comprehensive accessibility review and improvements

## Recently Completed (Max 10)

- [x] **Folder Reorganization**: Restructured into html/, js/, scss/ technology-specific folders
- [x] **Build Script Update**: Updated build process for new folder structure
- [x] **README Migration**: Moved shared standards to parent apps/ folder
- [x] **Chin Width Alignment**: `.chin` aligned to app container padding
- [x] **Chin Close Behavior**: Outside‑click defers then closes safely; ESC to close
- [x] **UI Safety Guards**: Overlay dismissor, watchdog, recovery hooks, and attribute observer
- [x] **Router Hardening**: Close chins on Profile/Form; default unknown routes to Stories

## Chin UX & Safety

- Open/Close:
  - Top bar buttons toggle their corresponding chin.
  - Press ESC or click outside the chin to close. Outside‑click close is deferred one tick to let the target’s handler (e.g., navigation) run first.
- Layout:
  - `#chin-container` is constrained to app container max width; `.chin` uses `var(--app-container-pad)` for left/right insets.
  - Hidden chins use `hidden` and `display:none` to avoid intercepting input.
- Safety:
  - `App.dismissLoadingUI()` clears lingering overlays: closes loading dialog, removes `[aria-busy]`, clears `inert`, restores `pointer-events:auto`, and hides non‑open dialogs.
  - `App.startUIWatchdog()` auto‑heals if a blocker is detected; `App.installUIRecoveryHooks()` heals on focus/visibility/pageshow.
  - Attribute observer instantly removes new `inert`/pointer‑events flips on html/body/main.
  - Panic hotkey: Ctrl+Shift+D.
- Debugging:
  - `App.setDebug(true|false)` toggles logs and persists in `localStorage['rpglitch.debug']`.
  - Console logs: `[RPGlitch] chin.*`, `ui.watchdog:*`, `router.*`, `dismissLoadingUI:*`.
