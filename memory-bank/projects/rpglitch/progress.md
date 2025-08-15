# Progress

- 2025-08-12 Resolved lint warnings in RPGlitch JavaScript and SCSS; updated stylelint configuration for BEM and attribute quotes.
- 2025-08-12 Aligned Stylelint config and VS Code settings; verified BEM selectors, palette utilities, and editor alignment.
- 2025-08-13 Replaced direct window references with global alias in RPGlitch.js for consistency.
- 2025-08-13 Applied global alias pattern in picture.js to remove remaining window references.
- 2025-08-12 Hardened picture helper and refined card hover interactions.
- 2025-08-12 Fixed chin-card title overlay and ensured storyboard cards have rounded corners.
- 2025-08-13 Added routing, entities API, and basic profile/form views for characters and worlds.
- 2025-08-13 Wired chin lists and new buttons to profile/form pages; premade items now marked in entity store.
- 2025-08-13 Added hash routing for character/world profiles and forms, event-delegated card clicks, top-bar action mapping, and entity cache backed by localStorage.
- 2025-08-13 Finalised card click routing, map-based top-bar actions, create-button form navigation, picture helper DOM guard, and entity cache write-through.
- 2025-08-14 Refactored profile/form routes to dedicated #profile and #form paths, delegated chin card clicks via container, added storyboard reset hook, and ensured entity list caching populates App._allItemsCache.
- 2025-08-14 Hardened build script, introduced hash router, unified profile/form page layout with sticky hero and tag chips, and added entity storage caching.
- 2025-08-15 Finalised profile/form view toggling, storyboard card navigation, deferred copy flow until save, normalized entity storage, and documented build script regex.

- 2025-08-16 Fixed storyboard dropdown navigation, unified image field, reliable back/cancel, deferred copy save, and cleaned build regex.
- 2025-08-13 Kept storyboard on dropdown change, routed via card dataset, added history back fallbacks, and clarified build regex.
- 2025-08-16 Finalized storyboard→profile→form loop with image helper reuse, centralized back/cancel logic, deferred copy, and router cleanup.

- 2025-08-17 Streamlined storyboard empty state and button styles, synced images across views, ensured Copy & Customise copies all sections, and unified back navigation.

- 2025-08-17 Added deterministic placeholders with entity icons and "Empty" titles across storyboard, chin lists, and profiles.

- 2025-08-15 Simplified docs: condensed root README, per-app READMEs, and generated-file banner in combine-views.
- 2025-08-15 Consolidated READMEs, added generated banner, optionalized missing docs, added Jest setup, lint/test now green.
- 2025-08-15 Implemented return-aware entity forms, restored empty storyboard card HTML, polished selection borders, defaulted combine-views warnings off, and merged todo notes.
- 2025-08-17 Tightened storyboard/profile flows with in-place card updates, return-aware forms, unified placeholders, and chin/search UI polish.
