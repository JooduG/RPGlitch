import { temporal_engine } from "../core/intelligence/temporal-engine.js";
import { db } from "../data/db.js";
import { entities } from "../data/repository.js";
import { SESSION_ID_KEY } from "@core/constants.js";
// We split the large state object into cohesive internal modules:
// 1. Entities (character, active_user, active_ai, active_fractal)
// 2. Story / Narrative (story, story_id, simulation_log, turn, ready)
// 3. Physics / Dynamics (ai_physics, fractal_physics)
function createRuntimeStore() {
  let entity_state = $state({
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
      signature_color: "",
      modifiers: {
        prompt: "",
        noBackground: false,
        flipped: false,
        profile_picture_seed: 0,
        colorName: "",
      },
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
  });
  let simulation_state = $state({
    is_ready: false,
    story_id: null,
    story: { by_id: {}, active_id: null },
    simulation_log: { by_story_id: {} },
    round: 0,
    turn_type: "USER_TURN", // USER_TURN, AI_TURN, SYSTEM_TURN
  });
  // [R5] Dynamics Snapshots (Live Physics)
  let ai_physics = $state(null);
  let fractal_physics = $state(null);
  $effect.root(() => {
    $effect(() => {
      const _round = simulation_state.round;
      const _ai = ai_physics;
      const _fractal = fractal_physics;
      if (simulation_state.is_ready && simulation_state.story_id) {
        db.stories
          .update(simulation_state.story_id, {
            round: _round,
            last_played: Date.now(),
            ai_dynamics: $state.snapshot(_ai),
            fractal_dynamics: $state.snapshot(_fractal),
          })
          .catch((err) => console.error("[Data] Auto-save failed:", err));
      }
    });
  });
  const api = {
    // --- GETTERS ---
    get character() {
      return entity_state.character;
    },
    get active_user() {
      return entity_state.active_user;
    },
    get active_ai() {
      return entity_state.active_ai;
    },
    get active_fractal() {
      return entity_state.active_fractal;
    },
    get ai() {
      return ai_physics;
    },
    set ai(val) {
      ai_physics = val;
      if (entity_state.active_ai) {
        entity_state.active_ai.dynamics = val;
      }
    },
    get fractal() {
      return fractal_physics;
    },
    set fractal(val) {
      fractal_physics = val;
      if (entity_state.active_fractal) {
        entity_state.active_fractal.dynamics = val;
      }
    },
    get simulation() {
      return simulation_state;
    },
    get simulation_log() {
      return simulation_state.simulation_log;
    },
    get story_id() {
      return simulation_state.story_id;
    },
    set story_id(id) {
      simulation_state.story_id = id;
      simulation_state.story.active_id = id;
    },
    get is_ready() {
      return simulation_state.is_ready;
    },
    get round() {
      return simulation_state.round;
    },
    set round(val) {
      simulation_state.round = val;
    },
    get turn_type() {
      return simulation_state.turn_type;
    },
    set turn_type(val) {
      simulation_state.turn_type = val;
    },
    get active_story() {
      return simulation_state.story_id
        ? simulation_state.story.by_id[simulation_state.story_id]
        : null;
    },
    // --- VECTOR API ---
    active_vectors: (role = "AI") => {
      const entity = api._get_entity_by_role(role);
      return entity?.future || [];
    },
    active_vector: (role = "AI") => {
      const entity = api._get_entity_by_role(role);
      return entity?.future?.[0]?.text || (role === "FRACTAL" ? "Continue the journey." : "");
    },
    add_vector: (text, role = "AI", is_vanguard = false) => {
      const entity = api._get_entity_by_role(role);
      if (!entity) return;
      if (!Array.isArray(entity.future)) entity.future = [];
      const new_vector = temporal_engine.create(text);
      if (is_vanguard) entity.future.unshift(new_vector);
      else entity.future.push(new_vector);
    },
    log_turn: (content, is_user = false) => {
      const story_id = simulation_state.story_id || "debug";
      if (!simulation_state.simulation_log.by_story_id[story_id]) {
        simulation_state.simulation_log.by_story_id[story_id] = [];
      }
      simulation_state.simulation_log.by_story_id[story_id].push({
        role: is_user ? "user" : "assistant",
        text: content,
        character_name: is_user
          ? entity_state.active_user?.name || "User"
          : entity_state.active_ai?.name || "AI",
        created_at: Date.now(),
      });
    },
    complete_vector: (role = "AI") => {
      const entity = api._get_entity_by_role(role);
      if (Array.isArray(entity?.future) && entity.future.length > 0) {
        entity.future.shift();
      }
    },
    _get_entity_by_role: (role) => {
      if (role === "AI") return entity_state.active_ai;
      if (role === "USER") return entity_state.active_user;
      if (role === "FRACTAL") return entity_state.active_fractal;
      return null;
    },
    // --- DATA SYNC ---
    sync: async (active_story_id = null) => {
      if (active_story_id) simulation_state.story_id = active_story_id;
      if (!simulation_state.story_id) {
        try {
          const entry = await db.kv_settings.get(SESSION_ID_KEY);
          if (entry?.value) simulation_state.story_id = entry.value;
          else return;
        } catch {
          return;
        }
      }
      try {
        const story = await db.stories.get(simulation_state.story_id);
        if (!story) return;
        const [user_data, ai_data, fractal_data] = await Promise.all([
          entities.get("character", story.user_id),
          entities.get("character", story.ai_id || "unknown_ai"),
          entities.get("fractal", story.fractal_id),
        ]);
        if (user_data) {
          entity_state.character = {
            ...entity_state.character,
            ...user_data,
            id: user_data.id,
          };
          entity_state.active_user = entity_state.character;
        }
        if (ai_data) {
          entity_state.active_ai = ai_data;
          ai_physics = ai_data.dynamics; // Initialize with seed dynamics
        }
        if (fractal_data) {
          entity_state.active_fractal = fractal_data;
          fractal_physics = fractal_data.dynamics; // Initialize with seed dynamics
        }
        // Stamp dynamics_baseline from the story snapshot.
        // This gives the physics engine a per-character gravitational center
        // rather than the universal 50 fallback.
        if (story.entity_snapshots?.ai?.dynamics && entity_state.active_ai) {
          entity_state.active_ai.dynamics_baseline = story.entity_snapshots.ai.dynamics;
        }
        if (story.entity_snapshots?.fractal?.dynamics && entity_state.active_fractal) {
          entity_state.active_fractal.dynamics_baseline = story.entity_snapshots.fractal.dynamics;
        }
        simulation_state.is_ready = true;
      } catch (err) {
        console.warn("[Data] Sync Failed:", err);
      }
    },
    save: async (round = null) => {
      if (!simulation_state.story_id) return;
      try {
        const target_round = round ?? 0;
        await db.stories.update(simulation_state.story_id, {
          round: target_round,
          last_played: Date.now(),
          ai_dynamics: $state.snapshot(ai_physics),
          fractal_dynamics: $state.snapshot(fractal_physics),
        });
      } catch (err) {
        console.error("[Data] Story Save Failed:", err);
      }
    },
    save_entity: async (type, entity) => {
      try {
        await entities.upsert(type, entity);
        if (entity_state.character && entity_state.character.id === entity.id) {
          Object.assign(entity_state.character, entity);
        }
      } catch (err) {
        console.error("[Data] Entity Save Failed:", err);
        throw err;
      }
    },
    update_entity: async (type, id, data) => {
      try {
        if (type === "story") {
          await db.stories.update(id, data);
          if (simulation_state.story_id === id) {
            Object.assign(simulation_state.story.by_id[id] || {}, data);
          }
        } else {
          // Add updated_at if not present for consistency
          const payload = { ...data, updated_at: Date.now() };
          await entities.update(type, id, payload);
          const targets = [
            ...new Set([
              entity_state.character,
              entity_state.active_user,
              entity_state.active_ai,
              entity_state.active_fractal,
            ]),
          ];
          targets.forEach((t) => {
            if (t && t.id === id) Object.assign(t, payload);
          });
        }
      } catch (err) {
        console.error(`[Data] Update Entity (${type}) Failed:`, err);
      }
    },
    delete_entity: async (type, id) => {
      try {
        await entities.remove(type, id);
      } catch (err) {
        console.error("[Data] Entity Delete Failed:", err);
        throw err;
      }
    },
    _debug_inject: (mock_data) => {
      if (mock_data.user) entity_state.active_user = mock_data.user;
      if (mock_data.ai) entity_state.active_ai = mock_data.ai;
      if (mock_data.fractal) entity_state.active_fractal = mock_data.fractal;
      simulation_state.is_ready = true;
    },
  };
  return api;
}
export const runtime = createRuntimeStore();
