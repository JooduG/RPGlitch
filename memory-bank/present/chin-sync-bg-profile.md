# Chin button sync, fixed background, profile alignment

## Strategy

Keep chin toggle buttons and body classes in sync while stabilizing layout and background visuals.

## Tactics

- Observe chin panels for `hidden` changes to update top bar button `.selected` state and body `chin-open` class.
- Fix background gradient scroll by adding `background-attachment: fixed`.
- Align profile screen right edge with top bar via shared container width variables.

## Operations

- edit `apps/rpglitch/js/profile-router.js`
- edit `apps/rpglitch/scss/index.scss`

## Summary
- Synced top bar chin buttons with panel visibility via MutationObserver.
- Fixed background gradient scroll and aligned profile screen with top bar width.
