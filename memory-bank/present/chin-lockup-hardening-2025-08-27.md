---
title: Chin Lockup Hardening
date: 2025-08-27
summary: "Fixes for overlay lockups, chin width/alignment, close behavior, and robust navigation guards."
---

## What

- Added overlay dismissor, watchdog, recovery hooks, and attribute observer to keep UI interactive.
- Chin alignment: `.chin` left/right set to `var(--app-container-pad)`; container constrained to app width.
- Close behavior: outside‑click defers, then closes chins and runs the dismissor; ESC closes as well.
- Router hardening: closes chins and clears overlays after rendering Profile/Form; unknown routes default to storyboard + Stories chin.
- Pointer‑events discipline: `#chin-container` default none; toggled to auto only when a chin is open.

## Why

Host/editor overlays and attribute flips (`inert`, `pointer-events:none`, lingering dialogs) made the app unclickable. The deterministic guard + heal patterns ensure safe recovery without relying on host fixes.

## Validate

1. Build: `npm run build:copy`; paste into Perchance.
2. Verify on load: Stories chin opens; UI interactive.
3. Click outside chin → it closes; app remains interactive.
4. Navigate to Profile/Form → chin closes; UI remains interactive.
5. If locked: use Ctrl+Shift+D and review console logs for `ui.watchdog: blocked { reason }`.

## Follow‑ups

- Optionally gate logs by a secondary flag and reduce verbosity in normal operation.
- Passive listeners for host touchstart warnings (low priority).

