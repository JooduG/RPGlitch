/**
 * src/utils/bridges.js
 * 🌉 CROSS-LAYER BRIDGES
 * Callback registries that let lower layers reach the state layer without
 * importing from @state directly (which would violate the downward import
 * rule). The state layer registers its accessors/handlers at boot time;
 * engine and platform layers consume them here.
 *
 * - state_bridge:  engine-side access to app/runtime/simulation state.
 * - stream_bridge: platform-side hooks for text streaming lifecycle.
 */

/** @type {any} */
const _accessors = {
  app: null,
  runtime: null,
  simulation_state: null,
  simulation_log: null,
  session_driver: null,
};

/**
 * Registers state accessors. Called once by the state layer at boot.
 * @param {{ app: any, runtime: any, simulation_state: any, simulation_log: any, session_driver?: any }} accessors
 */
export function register_state_accessors(accessors) {
  _accessors.app = accessors.app;
  _accessors.runtime = accessors.runtime;
  _accessors.simulation_state = accessors.simulation_state;
  _accessors.simulation_log = accessors.simulation_log;
  _accessors.session_driver = accessors.session_driver;
}

/**
 * The state bridge consumed by the engine layer.
 * Safely delegates to registered accessors.
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

/** @type {{ start: Function|null, update: Function|null, end: Function|null, error: Function|null, is_active: Function|null }} */
const _handlers = { start: null, update: null, end: null, error: null, is_active: null };

/**
 * Registers streaming handlers. Called once by the state layer at boot.
 * @param {{ start: Function, update: Function, end: Function, error: Function, is_active: Function }} handlers
 */
export function register_stream_handlers(handlers) {
  _handlers.start = handlers.start;
  _handlers.update = handlers.update;
  _handlers.end = handlers.end;
  _handlers.error = handlers.error;
  _handlers.is_active = handlers.is_active;
}

/**
 * The streaming bridge consumed by the platform layer.
 * Each method safely delegates to the registered handler or no-ops.
 */
export const stream_bridge = {
  is_active: () => _handlers.is_active?.() ?? false,
  start: (node_id, role) => _handlers.start?.(node_id, role),
  update: (chunk) => _handlers.update?.(chunk),
  end: () => _handlers.end?.(),
  error: (node_id) => _handlers.error?.(node_id),
};

/**
 * Story-version bridge — lets the @data layer notify the UI that the
 * story archive changed without importing from @state directly (downward
 * import rule). The state layer registers a bump callback at module load.
 */
/** @type {(() => void) | null} */
let _bump_stories_version = null;

export const stories_bridge = {
  /** @param {() => void} fn */
  register_bump(fn) {
    _bump_stories_version = fn;
  },
  bump() {
    _bump_stories_version?.();
  },
};
