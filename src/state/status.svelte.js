// ðŸ‘‘ ENGINE: The Silent Observer
// Tracks the heartbeat of the engine without revealing it.
export const simulationState = $state({
  phase: "idle", // "idle" | "generating" | "locked"
  role: null, // "ai" | "system" | "fractal" | null
  active_id: null,
  is_typing: false,
  // Actions
  start_generation(role = "ai") {
    this.phase = "generating";
    this.role = role;
  },
  start_typing(role, id) {
    this.is_typing = true;
    this.role = role;
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
