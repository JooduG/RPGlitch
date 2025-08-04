# Storyboard card title displayed twice

## updateStoryboardCard inserts a .card-title element in the article while also showing a header title, leading to duplicate titles on each card

* File: `apps/rpglitch/RPGlitch.js`
* In `App.updateStoryboardCard`, delete creation/insertion of the `.card-title` element so only the header’s selected title (or the `<select>`) remains.
* Confirm no extra title nodes render after selection.

## Options chin layout misalignment

### The Options chin should render buttons on a single row with text areas on the next row, each occupying half the width. Current grid styles do not consistently achieve this layout

* File: `apps/rpglitch/RPGlitch.scss`
* Ensure `.chin-panel` uses `grid-template-rows` to place `.chin-actions` in row 1 and `.chin-options-fields` in row 2.
* Verify `.chin-options-fields` keeps `grid-template-columns: 1fr 1fr` so each textarea fills ~50% width.

## Storyboard dynamic title toggle not functioning

### The dynamic title in updateStoryboardCard does not reliably replace/re-show the <select> when selections change, causing inconsistent title display and dropdown visibility

* File: `apps/rpglitch/RPGlitch.js`
* Refine `App.updateStoryboardCard` so selecting an item hides the `<select>` and shows the heading; clearing the selection reverses this.
* Attach a click handler to the heading that reliably re-displays the `<select>` for re-selection.
