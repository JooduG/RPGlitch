import { VectorEngine } from "@core/intelligence/VectorEngine.js"
import { db } from "@data/db.js"
import { entities } from "@data/repository.js"

function createRuntimeStore() {
    let state = $state({
        character: {
            id: null,
            name: "Unlinked",
            description: "No data stream connected.",
            eternal: { non_physical: "", physical: "" },
            present: { non_physical: "", physical: "" },
            past: [],
            future: [],
            dynamics: { chaos: 50, intensity: 50, openness: 50, affinity: 50 },
            voice: { rate: 1.0, pitch: 1.0 },
            profile_picture: null,
            signature_color: "var(--color-user)",
            visuals: { profile_picture_seed: 0, no_background: false },
        },
        active_user: null,
        active_ai: null,
        active_fractal: {
            name: "Environment",
            description: "",
            eternal: { non_physical: "", physical: "" },
            present: { non_physical: "", physical: "" },
            past: [],
            future: [],
            dynamics: { velocity: 50, entropy: 50 },
        },
        ready: false,
        story_id: null,
        story: { by_id: {}, active_id: null },
        simulation_log: { by_story_id: {} },
        turn: 0,
    })

    // [R5] Dynamics Snapshots (Live Physics)
    let ai_physics = $state(null)
    let fractal_physics = $state(null)

    $effect.root(() => {
        $effect(() => {
            const _turn = state.turn
            const _ai = ai_physics
            const _fractal = fractal_physics

            if (state.ready && state.story_id) {
                db.stories
                    .update(state.story_id, {
                        turn: _turn,
                        last_played: Date.now(),
                        ai_dynamics: $state.snapshot(_ai),
                        fractal_dynamics: $state.snapshot(_fractal),
                    })
                    .catch((err) => console.error("[Data] Auto-save failed:", err))
            }
        })
    })

    return {
        // --- GETTERS ---
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
        get ai() {
            return ai_physics
        },
        set ai(val) {
            ai_physics = val
        },
        get fractal() {
            return fractal_physics
        },
        set fractal(val) {
            fractal_physics = val
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

        // --- VECTOR API ---
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
            if (is_vanguard) entity.future.unshift(new_vector)
            else entity.future.push(new_vector)
        },

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

        _get_entity_by_role(role) {
            if (role === "AI") return state.active_ai
            if (role === "USER") return state.active_user
            if (role === "FRACTAL") return state.active_fractal
            return null
        },

        // --- DATA SYNC ---
        async sync(active_story_id = null) {
            if (active_story_id) state.story_id = active_story_id
            if (!state.story_id) {
                try {
                    const entry = await db.kv_settings.get("active_session_id")
                    if (entry?.value) state.story_id = entry.value
                    else return
                } catch {
                    return
                }
            }

            try {
                const story = await db.stories.get(state.story_id)
                if (!story) return

                const [user_data, ai_data, fractal_data] = await Promise.all([entities.get("character", story.user_id), entities.get("character", story.ai_id || "unknown_ai"), entities.get("fractal", story.fractal_id)])

                if (user_data) {
                    state.character = { ...state.character, ...user_data, id: user_data.id }
                    state.active_user = state.character
                }

                if (ai_data) {
                    state.active_ai = ai_data
                    ai_physics = ai_data.dynamics // Initialize with seed dynamics
                }

                if (fractal_data) {
                    state.active_fractal = fractal_data
                    fractal_physics = fractal_data.dynamics // Initialize with seed dynamics
                }

                state.ready = true
            } catch (err) {
                console.warn("[Data] Sync Failed:", err)
            }
        },

        update_vibe(entity_id, new_color, new_seed) {
            const targets = [state.character, state.active_user, state.active_ai, state.active_fractal]
            targets.forEach((t) => {
                if (t && t.id === entity_id) {
                    if (new_color) t.signature_color = new_color
                    if (new_seed !== undefined) t.visuals.profile_picture_seed = new_seed
                }
            })
        },

        async save(turn = null) {
            if (!state.story_id) return
            try {
                const targetTurn = turn ?? 0
                await db.stories.update(state.story_id, {
                    turn: targetTurn,
                    last_played: Date.now(),
                    ai_dynamics: $state.snapshot(ai_physics),
                    fractal_dynamics: $state.snapshot(fractal_physics),
                })
            } catch (err) {
                console.error("[Data] Story Save Failed:", err)
            }
        },

        async save_entity(type, entity) {
            try {
                await entities.upsert(type, entity)
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
                if (type === "story") {
                    await db.stories.update(id, data)
                    if (state.story_id === id) {
                        Object.assign(state.story.by_id[id] || {}, data)
                    }
                } else {
                    await entities.update(type, id, data)
                    const targets = [state.character, state.active_user, state.active_ai, state.active_fractal]
                    targets.forEach((t) => {
                        if (t && t.id === id) Object.assign(t, data)
                    })
                }
            } catch (err) {
                console.error(`[Data] Update Entity (${type}) Failed:`, err)
            }
        },

        async delete_entity(type, id) {
            try {
                await entities.remove(type, id)
            } catch (err) {
                console.error("[Data] Entity Delete Failed:", err)
                throw err
            }
        },

        async update_character(data) {
            Object.assign(state.character, data)
            if (state.character.id) {
                try {
                    await db.entities.update(state.character.id, {
                        ...data,
                        updated_at: Date.now(),
                    })
                } catch (err) {
                    console.error("[Data] Save Failed:", err)
                }
            } else {
                console.warn("[Data] Cannot save: No Character ID linked.")
            }
        },

        _debug_inject(mock_data) {
            if (mock_data.user) state.active_user = mock_data.user
            if (mock_data.ai) state.active_ai = mock_data.ai
            if (mock_data.fractal) state.active_fractal = mock_data.fractal
            state.ready = true
        },
    }
}

export const runtime = createRuntimeStore()
