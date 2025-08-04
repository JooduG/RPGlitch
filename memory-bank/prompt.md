# Placeholder text on the Stories chin is not centered across the full width

## The placeholder message spans only grid column 2 / 3, leaving it offset instead of centered across the entire chin area

1. Open `apps/rpglitch/RPGlitch.scss`.
2. In the `.chin-grid .story-item-empty-message` block, change `grid-column: 2 / 3;` to `grid-column: 1 / -1;` so the placeholder spans the full width.
3. Verify text remains horizontally and vertically centered.
4. Run `npm run lint && npm run build && npm test && npm run validate`.
5. Record the change in:
   * `memory-bank/project/activeContext.md`
   * `memory-bank/project/progress.md`
   * `memory-bank/project/todo-handoff.md`
   * `memory-bank/project/active-agent-insights.md`

## Storyboard card dropdown does not become the title after selection

## App.updateStoryboardCard sets the card title but leaves the dropdown visible, so the selected item is not displayed as the card’s title

1. Edit `apps/rpglitch/RPGlitch.js` within `App.updateStoryboardCard`.
2. When a non-empty selection is made:
   * Hide the `<select>` element or replace it with an `<h4 class="card-title-selected">`.
   * Display the selected item’s title within this heading.
   * Add a click handler to the heading to reveal the `<select>` again for re-selection.
3. Ensure fallback logic restores the placeholder when the selection is cleared.
4. Run `npm run lint && npm run build && npm test && npm run validate`.
5. Document the behavior in the four memory-bank files (`activeContext.md`, `progress.md`, `todo-handoff.md`, `active-agent-insights.md`).

## Option chin buttons misaligned and text fields not laid out at 50% width

## Buttons in the Options chin may differ in height from other chins, and the text areas need explicit half-width positioning beneath the action bar

1. In `apps/rpglitch/RPGlitch.scss`:
   * Add a shared height (e.g., `height: 2.5rem;`) to `.chin-actions-right button` (and `.chin-actions-left button` if needed) to match other chins.
   * Ensure `.chin-options-fields` uses `grid-template-columns: 1fr 1fr;` and each `<textarea>` fills its column (`width: 100%` already present).
2. Confirm the textareas appear side-by-side beneath the buttons with roughly equal width.
3. Execute `npm run lint && npm run build && npm test && npm run validate`.
4. Log updates in `activeContext.md`, `progress.md`, `todo-handoff.md`, and `active-agent-insights.md`.
