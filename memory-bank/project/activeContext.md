# Active Context

- Implemented core App namespace and initialization logic in `apps/rpglitch/RPGlitch.js`.
- Added DOM-safe helpers and event listener guards.
- Built chin panel framework with accessible tabs, search handlers, and option actions.
- Added DOMContentLoaded bootstrap calling `App.initializeWhenReady()`.
- Replaced chin list `innerHTML` rendering with safe `createElement` logic.
- Introduced roving `tabindex` for chin tabs and prevented navigation on outside-click close.
- Added chin-button styles and relocated chin container outside header, exposing `App.ui.showChin` helpers.
- Removed redundant data attributes from top bar buttons, relying solely on `data-chin`.

- Corrected chin visibility check to respect `hidden` attribute.
