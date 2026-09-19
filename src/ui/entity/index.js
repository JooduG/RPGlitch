/**
 * @file src/ui/entity/index.js
 * 🎴 ENTITY UI EXPORT HUB
 * Centralized gateway for card and entity presentation components.
 */

export { default as EntityCard } from "./EntityCard.svelte";
export { default as CardHand } from "./CardHand.svelte";
export { default as ImportModal } from "./ImportModal.svelte";
export * from "./ContextMenu.svelte.js";

/**
 * CHANGELOG:
 * - 2026-09-19: Removed re-export of EntityCard.svelte.js following relocation of card flight engine to src/ui/motion/card-flight.svelte.js under P4 Pre-Beta Purity.
 */
