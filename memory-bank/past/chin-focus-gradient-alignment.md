# Chin focus & layout hardening (2025-08-25)

## Strategy

Restore chin toggles and layout alignment while preventing background scroll.

## Tactics

- Fix malformed spread/rest operators blocking JS execution.
- Ensure chin MutationObserver syncs button `.selected` and `body.chin-open`.
- Only one chin open at a time via button click logic.
- Pin background gradient with `background-attachment: fixed` and shared
  container vars for profile.

## Operations

- edit `apps/rpglitch/html/index.html`

## Summary

- Updated debounce helper with rest parameters.
- Added fixed background gradient and shared container sizing.
