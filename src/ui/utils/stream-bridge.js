/**
 * src/ui/utils/stream-bridge.js
 * 🌉 STREAMING BRIDGE
 * Callback registry allowing the platform layer to invoke streaming
 * methods on the state layer without a direct import (which would violate
 * the downward import rule: platform MUST NOT import from state).
 *
 * The state layer registers its handlers at boot time via register_stream_handlers().
 * The platform layer calls them via stream_bridge.*.
 */

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
