---
description: "RPGlitch UI safety: overlay guard, watchdog, recovery hooks, attribute observer"
tags:
  - rpglitch
  - ui-safety
  - overlays
  - inert
  - aria-busy
---

# RPGlitch UI Safety

> This document summarizes how the app stays interactive inside Perchance, even if the host or extensions inject overlays.

## Components

- Overlay guard: `App.dismissLoadingUI()`
  - Closes `#loading-modal`, removes `[aria-busy]`, hides non‑open dialogs.
  - Clears `inert`, restores `pointer-events:auto` on `html/body/#main/#chin-container`.

- Watchdog: `App.startUIWatchdog()`
  - Polls every 500ms for `dialog[open]`, `[aria-busy]`, `inert`, `pointer-events:none` on roots.
  - Auto‑heals by calling the overlay guard.

- Recovery hooks: `App.installUIRecoveryHooks()`
  - Heals on `focus`, `visibilitychange`, and `pageshow`.
  - Panic hotkey: Ctrl+Shift+D → invokes the overlay guard.

- Attribute observer: `App.installUIBlockerAttributeObserver()`
  - Instantly strips new `inert` / `pointer-events:none` flips on html/body/main/chin container.

## Chin Interaction Safety

- `#chin-container` is constrained to the app container and uses `pointer-events:none` by default.
- When a chin is open, JS sets container `pointer-events:auto`; closed → `pointer-events:none` + `hidden` + `aria-hidden`.
- Outside‑click close is deferred one tick to let navigation/click handlers run first; then chins close and overlay guard runs.

## Router Hardening

- Profile/Form navigation:
  - After rendering, chins close and the overlay guard runs to ensure no overlay remains.
- Unknown route fallback:
  - Defaults to storyboard and opens Stories chin for a sane default.

## Debugging

- `App.setDebug(true|false)` persists in `localStorage['rpglitch.debug']`.
- Console logs include: `[RPGlitch] chin.*`, `router.*`, `ui.watchdog:*`, `dismissLoadingUI:*`.

