// src/core/engine/bus.svelte.js
// 🕹️ ENGINE: The Synapse (Reactive v5)

/**
 * THE SYNAPSE
 * A simple Event Bus to decouple UI components from the Data Layer.
 * Extends EventTarget for native event handling capabilities.
 */
export class GlobalEventBus extends EventTarget {}

export const events = new GlobalEventBus()

export const EVENTS = {
    STATE_CHANGED: "state:changed",
    DB_UPDATED: "db:updated",
    TURN_COMPLETED: "turn:completed",
    STORY_LOADED: "story:loaded",
    MESSAGE_RECEIVED: "message:received",
    TYPING_STARTED: "typing:started",
    TYPING_STOPPED: "typing:stopped",
    GENERATION_STARTED: "generation:started",
    GENERATION_COMPLETED: "generation:completed",
    CHAT_REFRESH: "chat:refresh",
    ENTITY_UPDATED: "entity:updated",
    MEMORY_PRESSURE_CHECK: "memory:pressure_check",
}

// 🧬 REACTIVE STATE (Svelte 5 Runes)
export let state = $state({
    storyTitle: "My Story",
    selectedAI: null,
    selectedFractal: null,
    selectedUser: null,
    mode: "storyboard",
    isCustomTitle: false,
    story: { byId: {}, activeId: null },
    messages: { byStoryId: {} },
    settings: {
        temperature: 0.7,
        top_p: 1.0,
        maxTokens: 512,
        stop: [],
        model: "default",
        historyLength: 10,
        developerMode: false,
        storyPrologueInstructions: "",
    },
    ui: { fsm: "idle" },
})

/**
 * Updates the state using a deep merge approach.
 * Since 'state' is reactive ($state), we mutate the properties directly.
 * @param {Object} patch - The delta to apply.
 */
export const applyPatch = (patch) => {
    const merge = (target, source) => {
        for (const key in source) {
            if (source[key] && typeof source[key] === "object" && !Array.isArray(source[key])) {
                if (!target[key]) target[key] = {}
                merge(target[key], source[key])
            } else {
                target[key] = source[key]
            }
        }
    }

    merge(state, patch)

    // Maintain legacy event support for non-reactive listeners
    events.dispatchEvent(new CustomEvent(EVENTS.STATE_CHANGED, { detail: { patch } }))
}
