// 👑 ENGINE: The Silent Observer
// Tracks the heartbeat of the engine without revealing it.
import { app } from "./app.svelte.js";

/**
 * @typedef {Object} AppSettings
 * @property {boolean} sound - Whether audio feedback and notification sounds are enabled.
 * @property {boolean} call_mode - Toggles the immersive 'Call' UI overlay for focus.
 * @property {boolean} stream_text - Toggles the character text streaming/typing animation.
 * @property {boolean} auto_scroll - Toggles automatic log scrolling to the bottom of the stack.
 * @property {boolean} dev_mode - Enables the Telemetry HUD and system debug overrides.
 * @property {boolean} dev_grid_visible - Toggles the visual chess grid overlay.
 * @property {string} [narrative_style] - The active narrative writing style profile in the session.
 * @property {string} [visual_style] - The global default visual style for image generation. Defaults to "photo".
 */

/**
 * @typedef {Object} CardHandState
 * @property {boolean} open - Whether the card hand is currently visible.
 * @property {'ai' | 'user' | 'fractal' | null} type - The target category for entity selection.
 * @property {number} regenerate_count - The number of times the current selection pool has been shuffled.
 */

/**
 * @typedef {Object} SimulationControl
 * @property {boolean} loading - STASIS: True when the Chrono Engine is processing a turn.
 */

/**
 * @typedef {Object} FateSystem
 * @property {boolean} active - Whether the Fate Card system is currently engaged.
 * @property {any[]} hand - The current collection of unresolved fate vectors.
 * @property {any | null} selected - The specific fate vector currently under resolution.
 */

class SimulationStateStore {
  /** @type {"idle" | "generating" | "locked"} */ #phase = $state("idle");
  /** @type {"ai" | "system" | "fractal" | "user" | null} */ #role = $state(null);
  /** @type {string | number | null} */ #active_id = $state(null);
  #is_typing = $state(false);
  /** @type {boolean} */ #intent_active = $state(false);

  // 🎭 DIRECTOR DELEGATION — identity of whichever entity is actively speaking
  // (the Director can hand the turn to the AI, the Fractal world, or an NPC).
  /** @type {"ai" | "fractal" | "user" | "npc" | null} */ #generating_entity_type = $state(null);
  /** @type {string | null} */ #generating_entity_name = $state(null);
  /** @type {string | null} */ #generating_entity_avatar = $state(null);
  /** @type {string | null} */ #generating_entity_color = $state(null);

  get phase() {
    return this.#phase;
  }
  set phase(value) {
    this.#phase = value;
  }

  get role() {
    return this.#role;
  }
  set role(value) {
    this.#role = value;
  }

  get active_id() {
    return this.#active_id;
  }
  set active_id(value) {
    this.#active_id = value;
  }

  get is_typing() {
    return this.#is_typing;
  }
  set is_typing(value) {
    this.#is_typing = value;
  }

  get intent_active() {
    return this.#intent_active;
  }
  set intent_active(value) {
    this.#intent_active = value;
  }

  get generating_entity_type() {
    return this.#generating_entity_type;
  }
  get generating_entity_name() {
    return this.#generating_entity_name;
  }
  get generating_entity_avatar() {
    return this.#generating_entity_avatar;
  }
  get generating_entity_color() {
    return this.#generating_entity_color;
  }

  get busy() {
    return this.#phase === "generating" || this.#intent_active;
  }

  /**
   * True while the engine has finished streaming a turn and is silently
   * consolidating memory in the background (idle phase + intent lock held).
   * The UI shows a "Processing memory…" cue instead of a plain disabled send.
   * @type {boolean}
   */
  get is_consolidating() {
    return this.#phase === "idle" && this.#intent_active;
  }

  start_generation(role = "ai") {
    this.#phase = "generating";
    this.#role = /** @type {"ai" | "system" | "fractal" | "user" | null} */ (role);
  }
  /**
   * @param {"ai" | "system" | "fractal" | "user" | null} role
   * @param {string | number | null} id
   */
  start_typing(role, id) {
    this.#is_typing = true;
    this.#role = /** @type {"ai" | "system" | "fractal" | "user" | null} */ (role);
    this.#active_id = id;
  }
  stop_typing() {
    this.#is_typing = false;
    this.#role = null;
    this.#active_id = null;
    this.clear_generating_entity();
  }
  complete() {
    this.#phase = "idle";
    this.#role = null;
    this.clear_generating_entity();
  }
  lock() {
    this.#phase = "locked";
  }
  unlock() {
    this.#phase = "idle";
  }
  /**
   * Sets the intent lock state.
   * @param {boolean} active
   */
  set_intent_active(active) {
    this.#intent_active = active;
  }
  /**
   * Marks which entity the Director delegated the current turn to, so the UI
   * can mirror avatar/badge/color to whoever is actively speaking.
   * @param {{ type?: "ai" | "fractal" | "user" | "npc" | null, name?: string | null, avatar?: string | null, color?: string | null }} entity
   */
  set_generating_entity({ type = null, name = null, avatar = null, color = null } = {}) {
    this.#generating_entity_type = type;
    this.#generating_entity_name = name;
    this.#generating_entity_avatar = avatar;
    this.#generating_entity_color = color;
  }
  clear_generating_entity() {
    this.#generating_entity_type = null;
    this.#generating_entity_name = null;
    this.#generating_entity_avatar = null;
    this.#generating_entity_color = null;
  }
}

export const simulation_state = new SimulationStateStore();

class UIStateStore {
  #loading = $state(false);

  // STRICTLY READ-ONLY GETTERS
  get loading() {
    return this.#loading;
  }

  get menu_open() {
    return !!(app?.profile_open || app?.control_panel_open || app?.card_hand?.open);
  }

  get input_active() {
    return simulation_state.intent_active;
  }

  // Mutators for internal/controller use
  /**
   * @param {boolean} value
   */
  set_loading(value) {
    this.#loading = value;
  }
}

export const ui_state = new UIStateStore();
