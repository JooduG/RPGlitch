/**
 * src/ui/utils/state-bridge.js
 * 🌉 STATE BRIDGE
 * Callback registry allowing the engine layer to access runtime state
 * without a direct import from @state (which would violate the downward
 * import rule: engine MUST NOT import from state).
 *
 * The state layer registers its accessors at boot time via register_state_accessors().
 * The engine layer reads/writes state via state_bridge.*.
 */

/** @type {any} */
const _accessors = {
  app: null,
  runtime: null,
  simulationState: null,
  simulation_log: null,
  session_driver: null,
};

/**
 * Registers state accessors. Called once by the state layer at boot.
 * @param {{ app: any, runtime: any, simulationState: any, simulation_log: any, session_driver?: any }} accessors
 */
export function register_state_accessors(accessors) {
  _accessors.app = accessors.app;
  _accessors.runtime = accessors.runtime;
  _accessors.simulationState = accessors.simulationState;
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
  get simulationState() {
    return _accessors.simulationState;
  },
  get simulation_log() {
    return _accessors.simulation_log;
  },
  get session_driver() {
    return _accessors.session_driver;
  },
};
