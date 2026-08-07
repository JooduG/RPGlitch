/**
 * src/ui/molecules/EntityCardContextMenu.svelte.js
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
