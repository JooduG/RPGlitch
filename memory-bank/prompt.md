# Refined Tactical Plan

## HTML Infrastructure Audit

Confirm that every chin button, panel, search input, action button, and list container is present with the correct IDs and data-* attributes.

* Open `index.html` (or main layout file).
* Verify `<div id="top-bar-left">` contains four `<button>` elements with `data-chin="stories"`, `"characters"`, `"worlds"`, and `"options"`.
* Ensure matching `<div class="chin-panel" data-chin="...">` elements exist inside `#chin-container`.
* In each stories/characters/worlds panel:
  * Confirm presence of `.chin-search` inputs (`search-stories-input`, `search-characters-input`, `search-worlds-input`).
  * Ensure upload/new buttons and list containers (`chin-story-grid`, `chin-character-grid`, `chin-world-grid`).
* In the options panel:
  * Check for buttons `data-trigger="upload-backup"`, `id="download-backup"`, `id="delete-all-data"`, hidden file input `#upload-backup`, and text areas.

## Creation & Upload Workflows

Provide forms or modals for adding new stories, characters, and worlds, plus JSON upload handlers to merge imported data.

* Build modal/inline forms for story/character/world creation (name, summary, image).
* Connect “New …” buttons to open forms and save submissions to `localStorage` then re-render lists.
* Wire upload buttons to parse JSON files, merge contents into `localStorage`, and re-render.
* Update relevant JS modules (e.g., `RPGlitch.js` or `chin.js`) with handlers.

## Premade Item Integration

Merge any built‑in libraries with user data and visually differentiate them.

* Implement helper functions like `App.getPremadeStoryItems`.
* Combine premade arrays with `localStorage` items when rendering lists.
* Optionally add “Custom” vs. “Premade” labels or sections in the UI.

## Enhanced Card UI & Interactions

Expand chin cards to include thumbnails, summaries, and click-through to detail views.

* Render images and short descriptions inside `.chin-card` elements.
* Attach click listeners to open profile/edit views for each item.
* Adjust CSS so added elements do not break layout.

## Profile/Edit Flow & Top-Bar-Right Buttons

Build detail/edit screens for each item type and contextually swap top-bar-right actions.

* Create view and edit modes for stories, characters, and worlds.
* Load selected item data into these modes on card click.
* Implement Save/Cancel/Edit/Delete buttons that appear based on current mode.
* Ensure transitions between view ↔ edit update the top-bar-right button set.

## Backup & Data Management Utilities

Finalize full backup import/export/delete features referenced by the options chin.

* Define `App.importAllData`, `App.exportAllData`, and `App.deleteAllData`.
* Connect them to `upload-backup`, `download-backup`, and `delete-all-data` buttons.
* Implement JSON parsing, file download generation, and localStorage reset.

## Accessibility & Keyboard Support

Add ARIA roles, focus management, and keyboard navigation enhancements.

* Assign `role="tab"` to chin buttons and `role="tabpanel"` to panels with `aria-controls`.
* Focus each panel’s search input when opened; return focus to the triggering button when closed.
* Verify all chin interactions are reachable via keyboard and screen readers.

These streamlined steps outline what remains for full chin integration and are ready for execution in the next phase.
