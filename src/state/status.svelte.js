// 👑 ENGINE: The Silent Observer
// Tracks the heartbeat of the engine without revealing it.
export const simulationState = $state({
  /** @type {"idle" | "generating" | "locked"} */
  phase: "idle",
  /** @type {"ai" | "system" | "fractal" | "user" | null} */
  role: null,
  /** @type {string | number | null} */
  active_id: null,
  is_typing: false,
  // Actions
  start_generation(role = "ai") {
    this.phase = "generating";
    /** @type {any} */ (this).role = role;
  },
  /**
   * @param {"ai" | "system" | "fractal" | "user" | null} role
   * @param {string | number | null} id
   */
  start_typing(role, id) {
    this.is_typing = true;
    /** @type {any} */ (this).role = role;
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
});
