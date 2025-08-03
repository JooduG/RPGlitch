# World chin always displayed for other tabs

App._toggleChinContent hides only non-matching panels, so previously shown panels can remain visible underneath the newest one, making Worlds appear active regardless of which button is clicked.

- Edit `apps/rpglitch/RPGlitch.js`.
- In `App._toggleChinContent` (lines 66‑92), hide **all** `.chin-panel` elements before determining the target
  - `const target = container.querySelector(\`\[data-chin="${chin}"]\`);\`
  - Hide every panel up front, then show the target if it exists.
  - If the target was already visible, close the container to toggle off.
- Rebuild logic so exactly one panel (or none) is visible after each click.
- Run `npm run lint && npm run build && npm test && npm run validate`.

## Options chin handled differently from other chins

Option‑specific actions are wired inside _attachTopBarEventListeners, leaving chin toggling inconsistent across buttons.

- Edit `apps/rpglitch/RPGlitch.js`.
- In `_attachTopBarEventListeners`, invoke `App.ui.showChin(btn.dataset.chin)` for all buttons instead of calling `_toggleChinContent` directly.
- Move the backup/upload/delete listeners into a new helper (e.g., `_attachOptionChinActions`) called once from `_attachTopBarEventListeners`.
- Ensure the options chin toggles through `showChin` like the others.
- Run `npm run lint && npm run build && npm test && npm run validate`.

Back up and restore any user data when testing the options chin to avoid accidental deletion.
