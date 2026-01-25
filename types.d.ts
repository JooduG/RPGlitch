/**
 * 🛸 RPGlitch: Global Type Definitions
 * This file serves as the core "Reality Check" for agent state and system architecture.
 */

declare global {
    /** 🕰️ Chrono: The Timekeeper State */
    interface TurnState {
        id: string
        phase: "idle" | "scanning" | "forecasting" | "echoing"
        turnNumber: number
        timestamp: number
    }

    /** 🧠 App State: The App's "Consciousness" */
    interface AppState {
        storyMode: "chat" | "grid"
        theme: string
        isBusy: boolean
        activeTrackId?: string
    }

    /** 📚 Scholar: Persistence Layer Structures */
    interface LoreAtom {
        uid: string
        content: string
        type: "character" | "location" | "event" | "rule"
        metadata: Record<string, any>
    }

    /** 🗝️ Perchance Globals (Injected) */
    interface Window {
        ai: any
        rpgLists: any
        update: () => void
    }
}

export {}
