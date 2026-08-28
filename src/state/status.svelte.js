/**
 * src/state/status.svelte.js
 * 👑 SIMULATION STATUS & ENGINE STATE STORE: Lifecycle & Generation State Machine
 *
 * Core Responsibilities:
 * - Tracks macro simulation execution phase (`idle`, `generating`, `locked`).
 * - Manages intent lock (`intent_active`) preventing overlapping turns and protecting memory consolidation.
 * - Tracks Director delegated speaker identity (`generating_entity_type`, `generating_entity_name`,
 *   `generating_entity_avatar`, `generating_entity_color`) for live UI speaker attribution.
 * - Exposes derived state flags (`busy`, `is_consolidating`).
 * - Provides lightweight UI status store (`ui_state.loading`).
 *
 * State Machine Lifecycle:
 * - `idle`: Engine is ready for user actions or silently running background memory consolidation.
 * - `generating`: Foreground stream or prompt turn in flight.
 * - `locked`: System is processing an atomic state transition or awaiting stasis release.
 */

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {"idle" | "generating" | "locked"} SimulationPhase
 */

/**
 * @typedef {"ai" | "system" | "fractal" | "user" | "npc" | string | null} TurnRole
 */

/**
 * @typedef {Object} GeneratingEntity
 * @property {"ai" | "fractal" | "user" | "npc" | null} [type] - Entity category.
 * @property {string | null} [name] - Display name of speaking entity.
 * @property {string | null} [avatar] - Avatar image URL or base64 data.
 * @property {string | null} [color] - Hex or token signature color.
 */

// ============================================================================
// [SECTION 2: SIMULATION STATE STORE]
// ============================================================================

export class SimulationStateStore {
  /** @type {SimulationPhase} */
  #phase = $state("idle");

  /** @type {TurnRole} */
  #role = $state(null);

  /** @type {boolean} */
  #intent_active = $state(false);

  /** @type {"ai" | "fractal" | "user" | "npc" | null} */
  #generating_entity_type = $state(null);

  /** @type {string | null} */
  #generating_entity_name = $state(null);

  /** @type {string | null} */
  #generating_entity_avatar = $state(null);

  /** @type {string | null} */
  #generating_entity_color = $state(null);

  // --- GETTERS & SETTERS ---

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

  /**
   * True if the engine is either actively generating a turn or holding an intent lock.
   */
  get busy() {
    return this.#phase === "generating" || this.#intent_active;
  }

  /**
   * True while the engine has finished streaming a turn and is silently
   * consolidating memory in the background (idle phase + intent lock held).
   */
  get is_consolidating() {
    return this.#phase === "idle" && this.#intent_active;
  }

  // --- STATE MUTATORS ---

  /**
   * Transitions state machine to active generation.
   * @param {TurnRole} [role="ai"]
   */
  start_generation(role = "ai") {
    this.#phase = "generating";
    this.#role = role;
  }

  /**
   * Sets typing indicator role.
   * @param {TurnRole} role
   */
  start_typing(role) {
    this.#role = role;
  }

  /**
   * Clears typing indicator and resets delegated speaker metadata.
   */
  stop_typing() {
    this.#role = null;
    this.clear_generating_entity();
  }

  /**
   * Concludes active generation cycle and returns phase to idle.
   */
  complete() {
    this.#phase = "idle";
    this.#role = null;
    this.clear_generating_entity();
  }

  /**
   * Locks the simulation state machine.
   */
  lock() {
    this.#phase = "locked";
  }

  /**
   * Unlocks the simulation state machine to idle.
   */
  unlock() {
    this.#phase = "idle";
  }

  /**
   * Sets the intent lock flag.
   * @param {boolean} active
   */
  set_intent_active(active) {
    this.#intent_active = active;
  }

  /**
   * Marks which entity the Director delegated the current turn to, so the UI
   * can mirror avatar/badge/color to whoever is actively speaking.
   * @param {GeneratingEntity} [entity={}]
   */
  set_generating_entity({ type = null, name = null, avatar = null, color = null } = {}) {
    this.#generating_entity_type = type;
    this.#generating_entity_name = name;
    this.#generating_entity_avatar = avatar;
    this.#generating_entity_color = color;
  }

  /**
   * Clears delegated speaker attribution.
   */
  clear_generating_entity() {
    this.#generating_entity_type = null;
    this.#generating_entity_name = null;
    this.#generating_entity_avatar = null;
    this.#generating_entity_color = null;
  }
}

// ============================================================================
// [SECTION 3: UI STATE STORE]
// ============================================================================

export class UIStateStore {
  #loading = $state(false);

  get loading() {
    return this.#loading;
  }

  /**
   * Sets global loading spinner state.
   * @param {boolean} value
   */
  set_loading(value) {
    this.#loading = value;
  }
}

// ============================================================================
// [SECTION 4: SINGLETON EXPORTS]
// ============================================================================

export const simulation_state = new SimulationStateStore();
export const ui_state = new UIStateStore();

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, defined JSDoc schemas (SimulationPhase, TurnRole, GeneratingEntity),
 *   exported store classes, and verified 100% test coverage.
 * - 2026-06-15: Added Director delegated speaker state (generating_entity_type, name, avatar, color).
 */
