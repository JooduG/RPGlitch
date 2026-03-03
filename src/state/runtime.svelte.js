import { VectorEngine } from "@core/intelligence/vector_engine.js"
import { db } from "@data/db.js"
import { entities } from "@data/repository.js"

function createRuntimeStore() {
    let state = $state({
        character: {
            id: null, // Critical for DB updates
            name: "Unlinked",
            description: "No data stream connected.",

            // 🧠 Deep State (Fragments: Eternal, Present, Past, Future)
            eternal: { non_physical: "", physical: "" },
            present: { non_physical: "", physical: "" },
            past: { vectors: [] },
            future: { vectors: [] },

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
        },
        activeUser: null,
        activeAI: null,
        activeFractal: {
            name: "Environment",
            description: "",
            // 🧠 Unified Temporal structure
            eternal: { non_physical: "", physical: "" },
            present: { non_physical: "", physical: "" },
            past: { vectors: [] },
            future: { vectors: [] },
        },
        ready: false,
        storyId: null,

        story: { byId: {}, activeId: null },
        messages: { byStoryId: {} },
        turn: 0,
    })

    // [R5] Narrative State is now integrated into Fractal Vectors

    return {
        // ... (Existing Getters)
        get character() {
            return state.character
        },
        get activeUser() {
            return state.activeUser
        },
        get activeAI() {
            return state.activeAI
        },
        get activeFractal() {
            return state.activeFractal
        },
        get story() {
            return state.story
        },
        get messages() {
            return state.messages
        },
        get storyId() {
            return state.storyId
        },
        set storyId(id) {
            state.storyId = id
            state.story.activeId = id
        },
        get isReady() {
            return state.ready
        },
        get turn() {
            return state.turn
        },
        set turn(val) {
            state.turn = val
        },
        get activeStory() {
            return state.storyId ? state.story.byId[state.storyId] : null
        },

        // 📜 UNIVERSAL VECTOR API (Trajectories for AI, USER, and FRACTAL)
        activeVector(role = "AI") {
            const entity = this._get_entity_by_role(role)
            return entity?.future?.vectors?.[0]?.text || (role === "FRACTAL" ? "Continue the journey." : "")
        },

        activeEchoes(role = "AI") {
            const entity = this._get_entity_by_role(role)
            return entity?.future?.vectors?.slice(1) || []
        },

        addVector(text, role = "AI", isVanguard = false) {
            const entity = this._get_entity_by_role(role)
            if (!entity) return

            if (!entity.future) entity.future = { vectors: [] }
            if (!Array.isArray(entity.future.vectors)) entity.future.vectors = []

            const newVector = VectorEngine.create_vector(text)

            if (isVanguard) {
                entity.future.vectors.unshift(newVector)
            } else {
                entity.future.vectors.push(newVector)
            }
        },

        completeVector(role = "AI") {
            const entity = this._get_entity_by_role(role)
            if (entity?.future?.vectors?.length > 0) {
                entity.future.vectors.shift()
            }
        },

        // Helper to resolve entity by role string
        _get_entity_by_role(role) {
            if (role === "AI") return state.activeAI
            if (role === "USER") return state.activeUser
            if (role === "FRACTAL") return state.activeFractal
            return null // Triad-only for now
        },

        // 🟢 SYNC: Read from DB
        async sync(activeStoryId = null) {
            if (activeStoryId) state.storyId = activeStoryId

            // If we don't know who we are playing, try to recover from persistence
            if (!state.storyId) {
                try {
                    const entry = await db.kv_settings.get("active_session_id")
                    if (entry?.value) {
                        state.storyId = entry.value
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
                const [userData, aiData, fractalData] = await Promise.all([entities.get("character", story.userId), entities.get("character", story.aiId || "unknown_ai"), entities.get("fractal", story.fractalId)])

                if (userData) {
                    state.character = {
                        ...state.character,
                        ...userData,
                        id: userData.id,
                    }
                    // Also set specific User slot
                    state.activeUser = state.character
                }

                if (aiData) {
                    state.activeAI = aiData
                }

                if (fractalData) {
                    state.activeFractal = fractalData
                }

                state.ready = true
            } catch (err) {
                console.warn("[Data] Sync Failed:", err)
            }
        },

        // 🔬 VIBE INJECTION (Called by Engine)
        updateVibe(entityId, newColor, newSeed) {
            const targets = [state.character, state.activeUser, state.activeAI, state.activeFractal]
            targets.forEach((t) => {
                if (t && t.id === entityId) {
                    if (newColor) t.visuals.signatureColor = newColor
                    if (newSeed !== undefined) t.visuals.profilePictureSeed = newSeed
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
                console.error("[Data] Story Save Failed:", err)
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
                console.error("[Data] Entity Save Failed:", err)
                throw err
            }
        },

        async updateEntity(type, id, data) {
            try {
                // 1. Update DB
                if (type === "story") {
                    await db.stories.update(id, data)
                    // 2. Sync local state if it's the active story
                    if (state.storyId === id) {
                        Object.assign(state.story.byId[id] || {}, data)
                    }
                } else {
                    await entities.update(type, id, data)
                    // Handle character/AI/fractal sync if needed
                    const targets = [state.character, state.activeUser, state.activeAI, state.activeFractal]
                    targets.forEach((t) => {
                        if (t && t.id === id) {
                            Object.assign(t, data)
                        }
                    })
                }
            } catch (err) {
                console.error(`[Data] Update Entity (${type}) Failed:`, err)
            }
        },

        async deleteEntity(type, id) {
            try {
                await entities.remove(type, id)
                // If we deleted the active character, we might need a fallback?
                // For now, let the UI handle the closure.
            } catch (err) {
                console.error("[Data] Entity Delete Failed:", err)
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
                    console.error("[Data] Save Failed:", err)
                    // Revert optimistic update
                    // NOTE: We rely on the UI to handle the flicker, or we could reload from DB
                    // For now, we just log.
                    // state.character = ... (requires keeping previous state)
                }
            } else {
                console.warn("[Data] Cannot save: No Character ID linked.")
            }
        },

        // 🧪 DEBUG: Inject Mock State
        _debugInject(mockData) {
            if (mockData.user) state.activeUser = mockData.user
            if (mockData.ai) state.activeAI = mockData.ai
            if (mockData.fractal) state.activeFractal = mockData.fractal
            state.ready = true
        },
    }
}

export const runtime = createRuntimeStore()
