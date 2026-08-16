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

/************************************************************************************
 * 🧊 FREEZE WATCHDOG (composer-freeze recovery)
 * ----------------------------------------------------------------------------------
 * The composer can only die if the simulation state machine gets stuck
 * (phase generating/locked or intent_active stuck true) with no live turn.
 * Two tiers:
 *   - Tier 1 (fast & safe): busy/locked with NO active stream for 90s → force unlock.
 *   - Tier 2 (broad): busy/locked for 5 min regardless of streaming, with no
 *     streaming progress (content growing / heartbeat) → abort + force unlock.
 * A live stream with growing content extends the window, so slow-but-healthy
 * generations are never interrupted.
 ************************************************************************************/
let _freeze_watchdog_started = false;
const FREEZE_WATCHDOG_INTERVAL_MS = 15000;
const FREEZE_WATCHDOG_IDLE_GRACE_MS = 90000;
const FREEZE_WATCHDOG_MAX_MS = 5 * 60 * 1000;
// Idle-phase consolidation (phase==="idle" while intent_active) runs a separate,
// generous LLM forge that can legitimately take minutes — it must never trip the
// tier-1 no-stream error path. Guard it with its own longer window.
const FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS = 4 * 60 * 1000;

/**
 * Installs the freeze watchdog. Called once from app.init() so it only runs in
 * the browser after the real bootstrap, never in tests or SSR.
 */
export function install_freeze_watchdog() {
  if (_freeze_watchdog_started || typeof window === "undefined") return;
  _freeze_watchdog_started = true;

  /** @type {number} */
  let stuck_since = 0;
  let last_stream_len = 0;

  const force_recover = (reason) => {
    console.warn("[Watchdog] Detected frozen simulation state — force-recovering.", {
      reason,
      phase: simulation_state.phase,
      intent_active: simulation_state.intent_active,
      loading: app.simulation.loading,
      streaming_active: app.streaming.active,
    });
    app.log(`[Watchdog] ${reason} — force-recovering the simulation.`, "error");
    try {
      simulation_state.complete();
      simulation_state.unlock();
      simulation_state.set_intent_active(false);
    } catch (_err) {
      /* state store never throws */
    }
    app.simulation.loading = false;
    app.end_stream();
    app.streaming.active = false;
    app.streaming.content = "";
    app.streaming.node_id = null;
    if (app.streaming.abort_controller) {
      try {
        app.streaming.abort_controller.abort();
      } catch (_err) {
        /* already aborted */
      }
      app.streaming.abort_controller = null;
    }
  };

  setInterval(() => {
    const phase = simulation_state.phase;
    const intent_active = simulation_state.intent_active;
    const generating = phase === "generating";
    const locked = phase === "locked";
    const consolidating = phase === "idle" && intent_active;
    const streaming_active = app.streaming.active;
    const stream_len = app.streaming.content?.length ?? 0;

    // The watchdog only arms on the phases it can actually diagnose. A plain
    // idle phase (no generation in flight) is healthy even if a stale intent
    // flag is stuck on — arming there caused the tier-1 false positives that
    // interrupted legitimate post-turn consolidation. Idle+intent gets its own
    // generous consolidation window below instead.
    const stuck = generating || locked || consolidating;
    if (!stuck) {
      stuck_since = 0;
      last_stream_len = stream_len;
      return;
    }

    if (stuck_since === 0) {
      stuck_since = Date.now();
      last_stream_len = stream_len;
      return;
    }

    const elapsed = Date.now() - stuck_since;
    const stream_grew = stream_len > last_stream_len;
    last_stream_len = stream_len;

    if (generating || locked) {
      if (!streaming_active && elapsed >= FREEZE_WATCHDOG_IDLE_GRACE_MS) {
        force_recover(`Simulation stuck ${Math.round(elapsed / 1000)}s with no stream`);
        stuck_since = 0;
        return;
      }
      if (elapsed >= FREEZE_WATCHDOG_MAX_MS && !stream_grew) {
        force_recover(`Simulation stuck ${Math.round(elapsed / 1000)}s with no progress`);
        stuck_since = 0;
        return;
      }
      return;
    }

    // Consolidation window: LLM forges are slow and silent by design. If one
    // overruns, release the intent lock with a warning instead of a full
    // force-recovery (the forge is guarded against double-consolidation, so the
    // only real failure mode is the lock being held too long).
    if (elapsed >= FREEZE_WATCHDOG_CONSOLIDATE_GRACE_MS) {
      console.warn(`[Watchdog] Post-turn consolidation overran ${Math.round(elapsed / 1000)}s — releasing intent lock.`, {
        phase,
        intent_active,
      });
      app.log(`[Watchdog] Post-turn consolidation overran ${Math.round(elapsed / 1000)}s — releasing intent lock.`, "warn");
      try {
        simulation_state.set_intent_active(false);
      } catch (_err) {
        /* state store never throws */
      }
      stuck_since = 0;
    }
  }, FREEZE_WATCHDOG_INTERVAL_MS);
}
