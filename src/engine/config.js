/**
 * @file src/engine/config.js
 * ⚔️ The Single Source of Truth for Global Architecture.
 */

export const APP_VERSION = "0.3.0";
export const SESSION_ID_KEY = "active_session_id";

export const CONFIG = {
  ENTITIES: {
    AI: "ai_character",
    USER: "user_persona",
    FRACTAL: "fractal",
  },
  ROLES: {
    USER: "user",
    AI: "ai",
    FRACTAL: "fractal",
    SYSTEM: "system",
  },
  VIEWS: {
    STORYBOARD: "storyboard",
    STORYMODE: "storymode",
  },
};

/**
 * Auto image trigger configuration (Signal B gate + cooldown).
 * - `extreme_high` / `extreme_low`: band edges. A dynamics axis fires the
 *   image trigger when it *enters* the extreme band this turn:
 *   `(old < high && new >= high) || (old > low && new <= low)`. Exiting an
 *   extreme band never triggers — only entering.
 * - `sum_threshold`: Signal A — fires when the sum of all |axis deltas|
 *   across the six axes exceeds this even if nothing crossed a band edge.
 * - `cooldown_rounds`: minimum rounds between auto images. Shared by both
 *   the math gate and the director's LLM trigger (the director's explicit
 *   trigger may bypass it, but still updates the shared counter).
 * - `tiers`: the four visual target types the director may request.
 */
export const IMAGE_TRIGGER = {
  extreme_high: 85,
  extreme_low: 15,
  sum_threshold: 60,
  cooldown_rounds: 3,
  tiers: ["story", "character", "entity", "scene"],
};

export const { ROLES, ENTITIES, VIEWS } = CONFIG;
