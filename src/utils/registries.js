/**
 * src/utils/registries.js
 * ============================================================================
 * 🔌 CROSS-LAYER REGISTRIES & ARCHITECTURAL INVERSION
 * ============================================================================
 *
 * Core Responsibilities:
 * - Provides decoupled callback registries allowing lower architectural layers
 *   to interact with `@state` and UI reactivity without violating
 *   the strict unidirectional downward layer hierarchy
 *   (`ui` -> `state` -> `intelligence` -> `data` -> `platform`).
 * - Exposes:
 *   1. `state_bridge`: Engine/utils access to live `app`, `runtime`,
 *      `simulation_state`, `simulation_log`, and `session_driver`.
 *   2. `stream_bridge`: Platform/LLM access to typewriter text streaming hooks
 *      (`start`, `update`, `end`, `is_active`).
 *   3. `stories_bridge`: Data repository access to notify reactive stores of
 *      story archive mutations (`bump`).
 *
 * Lifecycle Invariant:
 * - The state layer registers its accessors and handlers at boot time in `src/main.js`.
 *
 * Design notes:
 * - Every registry is one cell from the same factory: register, read, reset.
 *   State reads warn once (dev) when nothing is registered; stream and story
 *   hooks stay silent because unregistered streaming is a legitimate mode.
 * - Reads never throw: unregistered state yields null, unregistered stream
 *   calls no-op. Failures stay quiet by contract, loud in dev by warning.
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
 * @property {((snapshot: any) => void)} [record_prompt_token_snapshot] - Live compiler token budget recorder.
 */

/**
 * @typedef {Object} StreamHandlers
 * @property {() => boolean} [is_active] - Checks if text stream is active.
 * @property {(node_id: string | null, role: string) => void} [start] - Initiates active text stream.
 * @property {(chunk: string) => void} [update] - Appends token delta to stream buffer.
 * @property {() => void} [end] - Finalizes active stream buffer.
 */

const UNDER_TEST = typeof process !== "undefined" && !!process.env.VITEST;

// ============================================================================
// [SECTION 2: REGISTRY CELL FACTORY]
// ============================================================================

/**
 * One nullable cell with register/read/reset semantics shared by every bridge.
 * Noisy cells warn once (outside tests) when read before registration.
 */
function create_cell(label, { noisy = false } = {}) {
  let current = null;
  let warned = false;
  return {
    register(value) {
      current = value ?? null;
    },
    peek() {
      return current;
    },
    read() {
      if (current == null && noisy && !UNDER_TEST && !warned) {
        warned = true;
        console.warn(`[registries] ${label} read before registration.`);
      }
      return current;
    },
    reset() {
      current = null;
      warned = false;
    },
  };
}

// ============================================================================
// [SECTION 3: STATE ACCESSOR REGISTRY]
// ============================================================================

const _app = create_cell("app", { noisy: true });
const _runtime = create_cell("runtime", { noisy: true });
const _simulation_state = create_cell("simulation_state", { noisy: true });
const _simulation_log = create_cell("simulation_log", { noisy: true });
const _session_driver = create_cell("session_driver", { noisy: true });
const _snapshot_recorder = create_cell("prompt token snapshot recorder");

/**
 * Registers state accessors. Invoked once by the composition root during application startup.
 * @param {StateAccessors} accessors
 */
export function register_state_accessors(accessors) {
  _app.register(accessors.app);
  _runtime.register(accessors.runtime);
  _simulation_state.register(accessors.simulation_state);
  _simulation_log.register(accessors.simulation_log);
  _session_driver.register(accessors.session_driver);
  _snapshot_recorder.register(accessors.record_prompt_token_snapshot);
}

/**
 * The state registry consumed by non-UI engine modules.
 * Safely delegates to registered state accessors.
 */
export const state_bridge = {
  get app() {
    return _app.read();
  },
  get runtime() {
    return _runtime.read();
  },
  get simulation_state() {
    return _simulation_state.read();
  },
  get simulation_log() {
    return _simulation_log.read();
  },
  get session_driver() {
    return _session_driver.read();
  },
  record_prompt_token_snapshot(snapshot) {
    const recorder = _snapshot_recorder.peek();
    if (typeof recorder === "function") {
      recorder(snapshot);
    } else if (_runtime.peek()) {
      const runtime = _runtime.peek();
      const current = runtime.last_prompt_token_snapshot;
      // Tag active snapshot and preserve peak foreground compile if optics ran after
      if (!current || (snapshot?.total ?? 0) >= (current?.total ?? 0) || current.round !== snapshot.round) {
        runtime.last_prompt_token_snapshot = snapshot;
      }
      if (!runtime.prompt_snapshots_by_mode) {
        runtime.prompt_snapshots_by_mode = {};
      }
      if (snapshot?.mode) {
        runtime.prompt_snapshots_by_mode[snapshot.mode] = snapshot;
      }
    }
  },
};

// ============================================================================
// [SECTION 4: STREAM HANDLER REGISTRY]
// ============================================================================

const _stream_start = create_cell("stream start handler");
const _stream_update = create_cell("stream update handler");
const _stream_end = create_cell("stream end handler");
const _stream_is_active = create_cell("stream is_active handler");

/**
 * Registers streaming lifecycle handlers from the streaming coordinator store.
 * @param {StreamHandlers} handlers
 */
export function register_stream_handlers(handlers) {
  _stream_start.register(handlers.start);
  _stream_update.register(handlers.update);
  _stream_end.register(handlers.end);
  _stream_is_active.register(handlers.is_active);
}

/**
 * The streaming registry consumed by LLM transport and prompt drivers.
 * Safely executes registered callbacks or degrades gracefully to no-op.
 */
export const stream_bridge = {
  /** @returns {boolean} */
  is_active: () => _stream_is_active.peek()?.() ?? false,

  /**
   * @param {string | null} node_id
   * @param {string} [role="ai"]
   */
  start: (node_id, role = "ai") => _stream_start.peek()?.(node_id, role),

  /** @param {string} chunk */
  update: (chunk) => _stream_update.peek()?.(chunk),

  /** Finalizes stream */
  end: () => _stream_end.peek()?.(),
};

// ============================================================================
// [SECTION 5: STORIES ARCHIVE EVENT REGISTRY]
// ============================================================================

const _stories_bump = create_cell("stories bump handler");

/**
 * Story-version bridge — allows persistence and repository layers to notify
 * reactive UI views that the story archive was modified.
 */
export const stories_bridge = {
  /** @param {() => void} fn */
  register_bump(fn) {
    _stories_bump.register(fn);
  },
  bump() {
    _stories_bump.peek()?.();
  },
};

// ============================================================================
// [SECTION 6: TEST RESET HOOK]
// ============================================================================

/**
 * Resets all registries to blank state for isolated unit testing.
 */
export function reset_registries_for_testing() {
  _app.reset();
  _runtime.reset();
  _simulation_state.reset();
  _simulation_log.reset();
  _session_driver.reset();
  _snapshot_recorder.reset();

  _stream_start.reset();
  _stream_update.reset();
  _stream_end.reset();
  _stream_is_active.reset();

  _stories_bump.reset();
}

/**
 * CHANGELOG:
 * - 2026-11-10: Renamed bridges.js to registries.js (the bridge/bridge.js name
 *   collision); all three registries now share one cell factory; reset covers
 *   the snapshot recorder (was silently skipped); state reads warn once in dev
 *   when nothing is registered. All export names unchanged.
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, defined StateAccessors and StreamHandlers JSDoc schemas, added
 *   reset_bridges_for_testing() helper, and verified full unit test coverage.
 * - 2026-06-15: Added stories_bridge for decoupled story archive reactive version bumping.
 */
