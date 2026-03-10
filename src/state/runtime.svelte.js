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
            past: [],
            future: [],

            // 🧪 Dynamics (Dev)
            dynamics: {
                chaos: 50,
                intensity: 50,
                openness: 50,
                affinity: 50,
            },

            // 🎭 Visuals & Voice
            voice: { rate: 1.0, pitch: 1.0 },
            visuals: {
                profile_picture: null, // URL
                profile_picture_seed: 0, // Used for transition keys
                signature_color: "#84cc16", // Default Lime
                no_background: false,
            },
        },
        active_user: null,
        active_ai: null,
        active_fractal: {
            name: "Environment",
            description: "",
            // 🧠 Unified Temporal structure
            eternal: { non_physical: "", physical: "" },
            present: { non_physical: "", physical: "" },
            past: [],
            future: [],
        },
        ready: false,
        story_id: null,

        story: { by_id: {}, active_id: null },
        simulation_log: { by_story_id: {} },
        turn: 0,
    })

    // [R5] Narrative State is now integrated into Fractal Vectors

    return {
        // ... (Existing Getters)
        get character() {
            return state.character
        },
        get active_user() {
            return state.active_user
        },
        get active_ai() {
            return state.active_ai
        },
        get active_fractal() {
            return state.active_fractal
        },
        get story() {
            return state.story
        },
        get simulation_log() {
            return state.simulation_log
        },
        get story_id() {
            return state.story_id
        },
        set story_id(id) {
            state.story_id = id
            state.story.active_id = id
        },
        get is_ready() {
            return state.ready
        },
        get turn() {
            return state.turn
        },
        set turn(val) {
            state.turn = val
        },
        get active_story() {
            return state.story_id ? state.story.by_id[state.story_id] : null
        },

        // 📜 UNIVERSAL VECTOR API (Trajectories for AI, USER, and FRACTAL)
        active_vector(role = "AI") {
            const entity = this._get_entity_by_role(role)
            return entity?.future?.[0]?.text || (role === "FRACTAL" ? "Continue the journey." : "")
        },

        active_echoes(role = "AI") {
            const entity = this._get_entity_by_role(role)
            return entity?.future?.slice(1) || []
        },

        add_vector(text, role = "AI", is_vanguard = false) {
            const entity = this._get_entity_by_role(role)
            if (!entity) return

            if (!Array.isArray(entity.future)) entity.future = []

            const new_vector = VectorEngine.create_vector(text)

            if (is_vanguard) {
                entity.future.unshift(new_vector)
            } else {
                entity.future.push(new_vector)
            }
        },

        /**
         * 📝 NARRATIVE LOG: Adds a message to the active story thread.
         * Used primarily for UI updates and prompt history assembly.
         */
        log_turn(content, is_user = false) {
            const story_id = state.story_id || "debug"
            if (!state.simulation_log.by_story_id[story_id]) {
                state.simulation_log.by_story_id[story_id] = []
            }
            state.simulation_log.by_story_id[story_id].push({
                role: is_user ? "user" : "assistant",
                text: content,
                character_name: is_user ? state.active_user?.name || "User" : state.active_ai?.name || "AI",
                created_at: Date.now(),
            })
        },

        complete_vector(role = "AI") {
            const entity = this._get_entity_by_role(role)
            if (Array.isArray(entity?.future) && entity.future.length > 0) {
                entity.future.shift()
            }
        },

        // Helper to resolve entity by role string
        _get_entity_by_role(role) {
            if (role === "AI") return state.active_ai
            if (role === "USER") return state.active_user
            if (role === "FRACTAL") return state.active_fractal
            return null // Triad-only for now
        },

        // 🟢 SYNC: Read from DB
        async sync(active_story_id = null) {
            if (active_story_id) state.story_id = active_story_id

            // If we don't know who we are playing, try to recover from persistence
            if (!state.story_id) {
                try {
                    const entry = await db.kv_settings.get("active_session_id")
                    if (entry?.value) {
                        state.story_id = entry.value
                    } else {
                        return // truly no active story
                    }
                } catch {
                    return
                }
            }

            try {
                // 1. Fetch Story to get Character IDs
                const story = await db.stories.get(state.story_id)
                if (!story) return

                // 2. Fetch Entities
                const [user_data, ai_data, fractal_data] = await Promise.all([entities.get("character", story.user_id), entities.get("character", story.ai_id || "unknown_ai"), entities.get("fractal", story.fractal_id)])

                if (user_data) {
                    state.character = {
                        ...state.character,
                        ...user_data,
                        id: user_data.id,
                    }
                    // Also set specific User slot
                    state.active_user = state.character
                }

                if (ai_data) {
                    state.active_ai = ai_data
                }

                if (fractal_data) {
                    state.active_fractal = fractal_data
                }

                state.ready = true
            } catch (err) {
                console.warn("[Data] Sync Failed:", err)
            }
        },

        // 🔬 VIBE INJECTION (Called by Engine)
        update_vibe(entity_id, new_color, new_seed) {
            const targets = [state.character, state.active_user, state.active_ai, state.active_fractal]
            targets.forEach((t) => {
                if (t && t.id === entity_id) {
                    if (new_color) t.visuals.signature_color = new_color
                    if (new_seed !== undefined) t.visuals.profile_picture_seed = new_seed
                }
            })
        },

        // 🔴 UPDATE: Write to DB
        async save(turn = null) {
            if (!state.story_id) return
            try {
                // [FIX] Turn is passed directly to avoid circular dependency with App Store
                const targetTurn = turn ?? 0

                await db.stories.update(state.story_id, {
                    turn: targetTurn,
                    last_played: Date.now(),
                })
            } catch (err) {
                console.error("[Data] Story Save Failed:", err)
            }
        },

        // 🧬 GENERIC ENTITY MANAGEMENT
        async save_entity(type, entity) {
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

        async update_entity(type, id, data) {
            try {
                // 1. Update DB
                if (type === "story") {
                    await db.stories.update(id, data)
                    // 2. Sync local state if it's the active story
                    if (state.story_id === id) {
                        Object.assign(state.story.by_id[id] || {}, data)
                    }
                } else {
                    await entities.update(type, id, data)
                    // Handle character/AI/fractal sync if needed
                    const targets = [state.character, state.active_user, state.active_ai, state.active_fractal]
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

        async delete_entity(type, id) {
            try {
                await entities.remove(type, id)
                // If we deleted the active character, we might need a fallback?
                // For now, let the UI handle the closure.
            } catch (err) {
                console.error("[Data] Entity Delete Failed:", err)
                throw err
            }
        },

        async update_character(data) {
            // Optimistic UI Update
            Object.assign(state.character, data)

            if (state.character.id) {
                try {
                    // Send to IndexedDB
                    await db.entities.update(state.character.id, {
                        ...data,
                        updated_at: Date.now(),
                    })
                } catch (err) {
                    console.error("[Data] Save Failed:", err)
                    // Revert optimistic update
                    // NOTE: We rely on the UI to handle the flicker, or we could reload from DB
                    // For now, we just log.
                    // state.character = ... (requires keeping previous state)
                    // state.character = ... (requires keeping previous state)
                }
            } else {
                console.warn("[Data] Cannot save: No Character ID linked.")
            }
        },

        // 🧪 DEBUG: Inject Mock State
        _debug_inject(mock_data) {
            if (mock_data.user) state.active_user = mock_data.user
            if (mock_data.ai) state.active_ai = mock_data.ai
            if (mock_data.fractal) state.active_fractal = mock_data.fractal
            state.ready = true
        },
    }
}

export const runtime = createRuntimeStore()
