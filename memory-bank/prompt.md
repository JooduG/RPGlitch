Center card headers and descriptions

Both chin and storyboard cards use flex containers without alignment rules, leaving header titles and descriptions top-left aligned rather than centered

1. In `apps/rpglitch/RPGlitch.scss`, update `.chin-card-left article` and `#storyboard-grid .storyboard-card .storyboard-card-right` to:
   * `justify-content: center;`
   * `align-items: center;`
   * `text-align: center;`
2. Ensure the card containers (`.chin-card-left` and `.storyboard-card-right`) remain `height: 100%` so vertical centering applies.
3. Run `npm run lint && npm run build && npm test && npm run validate`.
4. Record the change in `memory-bank/project/activeContext.md`, `progress.md`, `todo-handoff.md`, and `active-agent-insights.md`.

Footer alignment and anchoring

Chin card footers only set margin-top: auto without right-alignment or vertical centering, and storyboard card footers lack any positioning rules, allowing them to drift from the bottom

1. In `apps/rpglitch/RPGlitch.scss`:
   * Amend `.chin-card-left article footer` to `display: flex; justify-content: flex-end; align-items: center;`.
   * Add similar rules with `margin-top: auto` for `#storyboard-grid .storyboard-card-right footer`.
2. Confirm footers remain at the bottom of their cards on both chin and storyboard views.
3. Run `npm run lint && npm run build && npm test && npm run validate`.
4. Update memory-bank entries (`activeContext.md`, `progress.md`, `todo-handoff.md`, `active-agent-insights.md`) with the new footer behavior.

Missing placeholder for empty story list

renderList populates stories without a fallback message, so an empty story bank renders blank space instead of a friendly prompt

1. Modify `renderList` in `apps/rpglitch/RPGlitch.js`:
   * After fetching `all`, if `key === 'stories'` and `all.length === 0`, insert a `<p class="story-item-empty-message">` with a message like “Empty here—time to write your first story!”
2. Ensure existing CSS class `.story-item-empty-message` styles the placeholder.
3. Execute `npm run lint && npm run build && npm test && npm run validate`.
4. Document the behavior change in relevant memory-bank files.
