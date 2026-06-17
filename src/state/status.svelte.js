// 👑 ENGINE: The Silent Observer
// Tracks the heartbeat of the engine without revealing it.
import { app } from "@state";

/**
 * @typedef {Object} AppSettings
 * @property {boolean} sound - Whether audio feedback and notification sounds are enabled.
 * @property {boolean} call_mode - Toggles the immersive 'Call' UI overlay for focus.
 * @property {boolean} stream_text - Toggles the character text streaming/typing animation.
 * @property {boolean} auto_scroll - Toggles automatic log scrolling to the bottom of the stack.
 * @property {boolean} dev_mode - Enables the Telemetry HUD and system debug overrides.
 * @property {boolean} dev_grid_visible - Toggles the visual chess grid overlay.
 */

/**
 * @typedef {Object} CardHandState
 * @property {boolean} open - Whether the card hand is currently visible.
 * @property {'ai' | 'user' | 'fractal' | null} type - The target category for entity selection.
 * @property {number} reroll_count - The number of times the current selection pool has been shuffled.
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

export const simulationState = $state({
  /** @type {"idle" | "generating" | "locked"} */
  phase: "idle",
  /** @type {"ai" | "system" | "fractal" | "user" | null} */
  role: null,
  /** @type {string | number | null} */
  active_id: null,
  is_typing: false,
  /** @type {boolean} */
  intent_active: false,

  // Streamlined busy lock property that combines phase and intent lock
  get busy() {
    return this.phase !== "idle" || this.intent_active;
  },

  // Actions
  start_generation(role = "ai") {
    this.phase = "generating";
    this.role = /** @type {"ai" | "system" | "fractal" | "user" | null} */ (role);
  },
  /**
   * @param {"ai" | "system" | "fractal" | "user" | null} role
   * @param {string | number | null} id
   */
  start_typing(role, id) {
    this.is_typing = true;
    this.role = /** @type {"ai" | "system" | "fractal" | "user" | null} */ (role);
    this.active_id = id;
  },
  stop_typing() {
    this.is_typing = false;
    this.role = null;
    this.active_id = null;
  },
  complete() {
    this.phase = "idle";
    this.role = null;
  },
  lock() {
    this.phase = "locked";
  },
  unlock() {
    this.phase = "idle";
  },
  /**
   * Sets the intent lock state.
   * @param {boolean} active
   */
  set_intent_active(active) {
    this.intent_active = active;
  },
});

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
    return simulationState.intent_active;
  }

  // Mutators for internal/controller use
  /**
   * @param {boolean} value
   */
  set_loading(value) {
    this.#loading = value;
  }
}

export const uiState = new UIStateStore();

// Compatibility alias to support existing references to controlState without breaking them
export const controlState = {
  get intent_active() {
    return simulationState.intent_active;
  },
  set intent_active(value) {
    simulationState.intent_active = value;
  },
  /**
   * @param {boolean} active
   */
  set_intent_active(active) {
    simulationState.set_intent_active(active);
  },
};
