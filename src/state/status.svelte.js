// 👑 ENGINE: The Silent Observer
// Tracks the heartbeat of the engine without revealing it.

export const engineState = $state({
    phase: "idle", // "idle" | "generating" | "locked"
    role: null, // "ai" | "system" | "fractal" | null

    // Actions
    startGeneration(role = "ai") {
        this.phase = "generating"
        this.role = role
    },

    complete() {
        this.phase = "idle"
        this.role = null
    },

    lock() {
        this.phase = "locked"
    },

    unlock() {
        this.phase = "idle"
    },
})
