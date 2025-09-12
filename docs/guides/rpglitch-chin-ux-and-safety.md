# RPGlitch Chin UX & Safety

This document provides detailed information about the user experience (UX) and safety features of the "Chin" UI component in the RPGlitch application.

## Chin UX

### Open/Close

- Top bar buttons toggle their corresponding chin.
- Press ESC or click outside the chin to close. Outside‑click close is deferred one tick to let the target’s handler (e.g., navigation) run first.

### Layout

- `#chin-container` is constrained to app container max width; `.chin` uses `var(--app-container-pad)` for left/right insets.
- Hidden chins use `hidden` and `display:none` to avoid intercepting input.

## Chin Safety

### Safety Features

- `App.dismissLoadingUI()` clears lingering overlays: closes loading dialog, removes `[aria-busy]`, clears `inert`, restores `pointer-events:auto`, and hides non‑open dialogs.
- `App.startUIWatchdog()` auto‑heals if a blocker is detected; `App.installUIRecoveryHooks()` heals on focus/visibility/pageshow.
- Attribute observer instantly removes new `inert`/pointer‑events flips on html/body/main.
- Panic hotkey: Ctrl+Shift+D.

### Debugging

- `App.setDebug(true|false)` toggles logs and persists in `localStorage['rpglitch.debug']`.
- Console logs: `[RPGlitch] chin.*`, `ui.watchdog:*`, `router.*`, `dismissLoadingUI:*`.
