/**
 * src/utils/bridges.js
 * 🌉 CROSS-LAYER BRIDGES & ARCHITECTURAL INVERSION REGISTRY
 *
 * Core Responsibilities:
 * - Provides decoupled callback registries allowing lower architectural layers (`@intelligence`,
 *   `@data`, `@media`, `@platform`) to interact with `@state` and UI reactivity without violating
 *   the strict unidirectional downward layer hierarchy (`ui` -> `state` -> `intelligence` -> `data` -> `platform`).
 * - Exposes:
 *   1. `state_bridge`: Engine/utils access to live `app`, `runtime`, `simulation_state`,
 *      `simulation_log`, and `session_driver`.
 *   2. `stream_bridge`: Platform/LLM access to typewriter text streaming hooks (`start`, `update`, `end`, `is_active`).
 *   3. `stories_bridge`: Data repository access to notify reactive stores of story archive mutations (`bump`).
 *
 * Lifecycle Invariant:
 * - The state layer registers its accessors and handlers at boot time in `src/main.js`.
 */

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {Object} StateAccessors
 * @property {any} [app] - Main UI & ephemeral state store.
 * @property {any} [runtime] - Reactive entity kernel & simulation chronology store.
 * @property {any} [simulation_state] - State machine & intent lock store.
 * @property {any} [simulation_log] - Reactive message dialogue feed store.
 * @property {any} [session_driver] - Session log persistence driver.
 */

/**
 * @typedef {Object} StreamHandlers
 * @property {() => boolean} [is_active] - Checks if text stream is active.
 * @property {(node_id: string | null, role: string) => void} [start] - Initiates active text stream.
 * @property {(chunk: string) => void} [update] - Appends token delta to stream buffer.
 * @property {() => void} [end] - Finalizes active stream buffer.
 */

// ============================================================================
// [SECTION 2: STATE ACCESSOR BRIDGE]
// ============================================================================

/** @type {StateAccessors} */
const _accessors = {
  app: null,
  runtime: null,
  simulation_state: null,
  simulation_log: null,
  session_driver: null,
};

/**
 * Registers state accessors. Invoked once by the composition root during application startup.
 * @param {StateAccessors} accessors
 */
export function register_state_accessors(accessors) {
  _accessors.app = accessors.app ?? null;
  _accessors.runtime = accessors.runtime ?? null;
  _accessors.simulation_state = accessors.simulation_state ?? null;
  _accessors.simulation_log = accessors.simulation_log ?? null;
  _accessors.session_driver = accessors.session_driver ?? null;
}

/**
 * The state bridge consumed by non-UI engine modules.
 * Safely delegates to registered state accessors.
 */
export const state_bridge = {
  get app() {
    return _accessors.app;
  },
  get runtime() {
    return _accessors.runtime;
  },
  get simulation_state() {
    return _accessors.simulation_state;
  },
  get simulation_log() {
    return _accessors.simulation_log;
  },
  get session_driver() {
    return _accessors.session_driver;
  },
};

// ============================================================================
// [SECTION 3: STREAM HANDLER BRIDGE]
// ============================================================================

/** @type {StreamHandlers} */
const _handlers = {
  start: null,
  update: null,
  end: null,
  is_active: null,
};

/**
 * Registers streaming lifecycle handlers from the streaming coordinator store.
 * @param {StreamHandlers} handlers
 */
export function register_stream_handlers(handlers) {
  _handlers.start = handlers.start ?? null;
  _handlers.update = handlers.update ?? null;
  _handlers.end = handlers.end ?? null;
  _handlers.is_active = handlers.is_active ?? null;
}

/**
 * The streaming bridge consumed by LLM transport and prompt drivers.
 * Safely executes registered callbacks or degrades gracefully to no-op.
 */
export const stream_bridge = {
  /** @returns {boolean} */
  is_active: () => _handlers.is_active?.() ?? false,

  /**
   * @param {string | null} node_id
   * @param {string} [role="ai"]
   */
  start: (node_id, role = "ai") => _handlers.start?.(node_id, role),

  /** @param {string} chunk */
  update: (chunk) => _handlers.update?.(chunk),

  /** Finalizes stream */
  end: () => _handlers.end?.(),
};

// ============================================================================
// [SECTION 4: STORIES ARCHIVE EVENT BRIDGE]
// ============================================================================

/** @type {(() => void) | null} */
let _bump_stories_version = null;

/**
 * Story-version bridge — allows persistence and repository layers to notify
 * reactive UI views that the story archive was modified.
 */
export const stories_bridge = {
  /** @param {() => void} fn */
  register_bump(fn) {
    _bump_stories_version = fn;
  },
  bump() {
    _bump_stories_version?.();
  },
};

// ============================================================================
// [SECTION 5: TEST RESET HOOK]
// ============================================================================

/**
 * Resets all bridge registries to blank state for isolated unit testing.
 */
export function reset_bridges_for_testing() {
  _accessors.app = null;
  _accessors.runtime = null;
  _accessors.simulation_state = null;
  _accessors.simulation_log = null;
  _accessors.session_driver = null;

  _handlers.start = null;
  _handlers.update = null;
  _handlers.end = null;
  _handlers.is_active = null;

  _bump_stories_version = null;
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, defined StateAccessors and StreamHandlers JSDoc schemas, added
 *   reset_bridges_for_testing() helper, and verified full unit test coverage.
 * - 2026-06-15: Added stories_bridge for decoupled story archive reactive version bumping.
 */
