// 📜 SCHOLAR: The Runtime State
import { events, EVENTS } from "@core/engine/bus.js"
import { db } from "@data/db.js"
import { entities } from "@data/repository.js"

function createRuntimeStore() {
    let state = $state({
        character: {
            id: null, // Critical for DB updates
            name: "Unlinked",
            description: "No data stream connected.",

            // 🧠 Deep State
            eternal: { mental: "", physical: "" }, // Renamed from 'forever'
            present: { mental: "", physical: "" },
            timeline: { past: "", future: "" },

            // 🧪 Dynamics (Dev)
            dynamics: {
                entropy: 50,
                velocity: 50,
                permeability: 50,
                resonance: 50,
            },

            // 🎭 Visuals & Voice
            voice: { rate: 1.0, pitch: 1.0 },
            visuals: {
                profilePicture: null, // URL
                profilePictureSeed: 0, // Used for transition keys
                signatureColor: "#84cc16", // Default Lime
                noBackground: false,
            },

            customData: {
                plot: {
                    active: [],
                    resolved: [],
                },
            },
        },
        userCharacter: null, // Specific reference
        aiCharacter: null,
        storyFractal: null,
        ready: false,
        storyId: null,
    })

    return {
        get character() {
            return state.character
        },
        get userCharacter() {
            return state.userCharacter
        },
        get aiCharacter() {
            return state.aiCharacter
        },
        get storyFractal() {
            return state.storyFractal
        },
        get isReady() {
            return state.ready
        },

        // 🟢 SYNC: Read from DB
        async sync(activeStoryId = null) {
            if (activeStoryId) state.storyId = activeStoryId

            // If we don't know who we are playing, try to recover from persistence
            if (!state.storyId) {
                try {
                    const setting = await db.settings.get("active_story")
                    if (setting?.value) {
                        state.storyId = setting.value
                    } else {
                        return // truly no active story
                    }
                } catch {
                    return
                }
            }

            try {
                // 1. Fetch Story to get Character IDs
                const story = await db.stories.get(state.storyId)
                if (!story) return

                // 2. Fetch Entities
                const [userData, aiData, fractalData] = await Promise.all([
                    entities.get("character", story.userId),
                    entities.get("character", story.aiId || "unknown_ai"),
                    entities.get("fractal", story.fractalId),
                ])

                if (userData) {
                    state.character = {
                        ...state.character,
                        ...userData,
                        id: userData.id,
                    }
                    // Also set specific User slot
                    state.userCharacter = state.character
                }

                if (aiData) {
                    state.aiCharacter = aiData
                }

                if (fractalData) {
                    state.storyFractal = fractalData
                }

                state.ready = true
            } catch (err) {
                console.warn("[Scholar] Sync Failed:", err)
            }
        },

        // 🔬 VIBE INJECTION (Called by GameMaster)
        updateVibe(entityId, newColor, newSeed) {
            const targets = [
                state.character,
                state.userCharacter,
                state.aiCharacter,
                state.storyFractal,
            ]
            targets.forEach((t) => {
                if (t && t.id === entityId) {
                    if (newColor) t.visuals.signatureColor = newColor
                    if (newSeed !== undefined)
                        t.visuals.profilePictureSeed = newSeed
                }
            })
        },

        // 🔴 UPDATE: Write to DB
        async save(turn = null) {
            if (!state.storyId) return
            try {
                // [FIX] Turn is passed directly to avoid circular dependency with App Store
                const targetTurn = turn ?? 0

                await db.stories.update(state.storyId, {
                    turn: targetTurn,
                    lastPlayed: Date.now(),
                })
            } catch (err) {
                console.error("[Scholar] Story Save Failed:", err)
            }
        },

        // 🧬 GENERIC ENTITY MANAGEMENT
        async saveEntity(type, entity) {
            try {
                await entities.upsert(type, entity)

                // If this is the current character, sync state
                if (state.character && state.character.id === entity.id) {
                    Object.assign(state.character, entity)
                }
            } catch (err) {
                console.error("[Scholar] Entity Save Failed:", err)
                throw err
            }
        },

        async deleteEntity(type, id) {
            try {
                await entities.remove(type, id)
                // If we deleted the active character, we might need a fallback?
                // For now, let the UI handle the closure.
            } catch (err) {
                console.error("[Scholar] Entity Delete Failed:", err)
                throw err
            }
        },

        async updateCharacter(data) {
            // Optimistic UI Update
            Object.assign(state.character, data)

            if (state.character.id) {
                try {
                    // Send to IndexedDB
                    await db.entities.update(state.character.id, {
                        ...data,
                        updatedAt: Date.now(),
                    })
                } catch (err) {
                    console.error("[Scholar] Save Failed:", err)
                    // Revert optimistic update
                    // NOTE: We rely on the UI to handle the flicker, or we could reload from DB
                    // For now, we just log.
                    // state.character = ... (requires keeping previous state)
                }
            } else {
                console.warn("[Scholar] Cannot save: No Character ID linked.")
            }
        },

        // 👂 INTERNAL: Sync with external updates (Warden, Echo)
        _initListeners() {
            events.addEventListener(EVENTS.ENTITY_UPDATED, (e) => {
                const { id, ...updates } = e.detail

                const targets = [
                    state.character,
                    state.userCharacter,
                    state.aiCharacter,
                    state.storyFractal,
                ]

                targets.forEach((t) => {
                    if (t && t.id === id) {
                        Object.assign(t, updates)
                    }
                })
            })
        },

        // 🧪 DEBUG: Inject Mock State
        _debugInject(mockData) {
            if (mockData.user) state.userCharacter = mockData.user
            if (mockData.ai) state.aiCharacter = mockData.ai
            if (mockData.fractal) state.storyFractal = mockData.fractal
            state.ready = true
        },
    }
}

export const runtime = createRuntimeStore()
runtime._initListeners()
