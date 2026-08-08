/**
 * src/ui/organisms/EntityCardContextMenu.svelte.js
 * Shared context-menu coordination signal.
 * Each EntityCard claims the menu when it opens; all others auto-close.
 */
let menu_epoch = $state(0);

export function claim_menu() {
  menu_epoch += 1;
  return menu_epoch;
}

export function get_menu_epoch() {
  return menu_epoch;
}

/**
 * Profile-flip morph signal. The card whose context menu opens last "claims"
 * the profile morph source; exactly ONE card carries the view-transition-name
 * when the profile flips, so duplicates (same entity shown in the message row
 * AND the side panel) never collide with the View-Transitions singleton.
 */
let morph_epoch = $state(0);

export function claim_morph_epoch() {
  morph_epoch += 1;
  return morph_epoch;
}

export function get_morph_epoch() {
  return morph_epoch;
}
