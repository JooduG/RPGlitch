// 👑 ENGINE: The Silent Observer
// Tracks the heartbeat of the engine without revealing it.
export const engineState = $state({
  phase: "idle", // "idle" | "generating" | "locked"
  role: null, // "ai" | "system" | "fractal" | null
  activeId: null,
  is_typing: false,
  // Actions
  startGeneration(role = "ai") {
    this.phase = "generating";
    this.role = role;
  },
  startTyping(role, id) {
    this.is_typing = true;
    this.role = role;
    this.activeId = id;
  },
  stopTyping() {
    this.is_typing = false;
    this.role = null;
    this.activeId = null;
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
