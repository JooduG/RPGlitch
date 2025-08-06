# Handover Summary

The RPGlitch app now ships as a single-file offline build with cached external libraries, auto‑discovered component modules, and playful wiggle hover effects on chin and storyboard cards. Search fields align with button heights, and ProfilePictureComponent.js is bundled for placeholder avatars. The storyboard title supports in-place editing and resets on double‑click, though its default phrasing and selection grammar still need refinement.

## Outstanding Issues & Next Steps

### Dynamic storyboard title uses literal placeholders and lacks selection-aware grammar

Default title generation still hardcodes “AI Character and User Character in World,” so the text never shifts to a more immersive placeholder or adapt when only one or two cards are selected

* **File**: `apps/rpglitch/RPGlitch.js`
* Replace `_defaultStoryboardTitle` so:
  * When no selections: title = short, immersive placeholder (e.g., “Your story begins…”).
  * When one card selected: title = selected card’s name.
  * When two cards selected:
    * Two characters ⇒ “<AI> and <User>”
    * Character + world ⇒ “<Character> on <World>”
* Keep double-click reset to restore dynamic behavior.

### Profile pictures missing on chin and storyboard cards

Chin cards call getProfilePictureHTML with 'storyboard' context, producing a CSS class meant for storyboard usage and preventing images from rendering correctly. Storyboard cards also rely on this function but may not display due to similar context/class mismatches.

* **File**: `apps/rpglitch/RPGlitch.js`
* In `renderList`, invoke `getProfilePictureHTML(item, palette, 'list-item')` so chin cards use the list-item style.
* In `updateStoryboardCard`, keep `'storyboard'` context but ensure `ProfilePictureComponent.js` loads before `RPGlitch.js` in `RPGlitch.html`.
* Verify `.profile-picture` styles in `RPGlitch.scss` cover both contexts and add missing rules if needed.

### Storyboard card headers disappear after selection

When a card is chosen, updateStoryboardCard removes existing titles and hides the <select>, but the new <h4> heading sometimes isn’t inserted or displayed, leaving the article header empty.

* **File**: `apps/rpglitch/RPGlitch.js`
* Ensure `heading` is appended before removing `oldTitle`, or remove the `oldTitle` check so the same node is reused.
* Call `updateStoryboardCard` for each select on initial load so headings render immediately.
* In `renderDropdown`, preserve placeholder `<option>` text so the dropdown name reappears when the select is shown again.

## Testing

No tests were executed; verify fixes with npm test, npm run lint, and npm run build:offline after implementing the above changes.

## Notes

This handover captures pending UI logic and rendering gaps; confirm profile image and title behavior interact correctly in a browser once adjustments are made.
