/**
 * src/ui/entity/ContextMenu.svelte.js
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

/**
 * Builds canonical entity actions for `@ID` and `RelationalGraph` card-back menus.
 * @param {any} entity
 * @param {{ on_open_profile?: (entity: any) => void, on_open_image_preview?: (payload: any) => void }} [handlers]
 * @returns {Array<{ label: string, onSelect: () => void }>}
 */
export function build_entity_preview_actions(entity, { on_open_profile, on_open_image_preview } = {}) {
  if (!entity) return [];
  const items = [];
  if (typeof on_open_profile === "function") {
    items.push({ label: "Profile", onSelect: () => on_open_profile(entity) });
  }
  if (entity.profile_picture && typeof on_open_image_preview === "function") {
    items.push({
      label: "Profile Picture",
      onSelect: () =>
        on_open_image_preview({
          src: entity.profile_picture,
          metadata:
            entity.modifiers ?
              { prompt: entity.modifiers.prompt, negative_prompt: entity.modifiers.negative_prompt, seed: entity.modifiers.last_generated_seed }
            : null,
        }),
    });
  }
  return items;
}
