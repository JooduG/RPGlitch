/**
 * @file src/ui/console/Console.svelte.js
 * 🎛️ CONSOLE STATE MODULE
 * Pure selection/shuffle/begin helpers backing the Console organism.
 */
import { NAME_PREFIXES } from "@data";

const DEFAULT_STOP_WORDS = new Set(NAME_PREFIXES.map((w) => w.replace(/\.$/, "")));

/**
 * Derives card initials from an entity name, skipping common prefixes.
 * @param {any} str
 * @param {Set<string>} [stop_words]
 */
export function compute_initials(str, stop_words = DEFAULT_STOP_WORDS) {
  const words = String(str || "")
    .replace(/['']/g, "")
    .replace(/[^\p{L}\s]/gu, " ")
    .trim()
    .split(/\s+/);
  const filtered = words.filter((w) => !stop_words.has(w.toLowerCase()));
  return (
    (filtered.length ? filtered : words)
      .slice(0, 3)
      .map((w) => w.charAt(0))
      .join("")
      .toUpperCase() || "?"
  );
}

/**
 * Computes the on-screen deck rect a card travels to/from during a shuffle.
 * @param {{ width: number, height: number }} viewport
 * @param {{ width: number, height: number }} slot_rect
 * @param {{ pickup_scale?: number, deck_clearance?: number }} [options]
 */
export function deck_geometry(viewport, slot_rect, { pickup_scale = 0.62, deck_clearance = 1.25 } = {}) {
  const width = slot_rect.width * pickup_scale;
  const height = slot_rect.height * pickup_scale;
  return {
    left: Math.max(0, viewport.width / 2 - width / 2),
    top: Math.max(0, viewport.height - height * deck_clearance),
    width,
    height,
  };
}

/**
 * Returns the first selected entity already claimed by an active story (or null),
 * so the begin flow can refuse to start with locked-in entities.
 * @param {Array<{ id: any } | null | undefined>} selected
 * @param {Iterable<unknown>} claimed_ids
 */
export function claimed_entity_lock(selected, claimed_ids) {
  const claimed = new Set(claimed_ids);
  return selected.filter(Boolean).find((e) => e.id != null && claimed.has(String(e.id))) || null;
}
