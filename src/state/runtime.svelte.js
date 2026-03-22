import { VectorEngine } from "@core/intelligence/VectorEngine.js";
import { db } from "@data/db.js";
import { entities } from "@data/repository.js";
// We split the large state object into cohesive internal modules:
// 1. Entities (character, active_user, active_ai, active_fractal)
// 2. Story / Narrative (story, story_id, simulation_log, turn, ready)
// 3. Physics / Dynamics (ai_physics, fractal_physics)
function createRuntimeStore() {
  let entityState = $state({
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
  });
  let simulationState = $state({
    ready: false,
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
      const _round = simulationState.round;
      const _ai = ai_physics;
      const _fractal = fractal_physics;
      if (simulationState.ready && simulationState.story_id) {
        db.stories
          .update(simulationState.story_id, {
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
      return entityState.character;
    },
    get active_user() {
      return entityState.active_user;
    },
    get active_ai() {
      return entityState.active_ai;
    },
    get active_fractal() {
      return entityState.active_fractal;
    },
    get ai() {
      return ai_physics;
    },
    set ai(val) {
      ai_physics = val;
    },
    get fractal() {
      return fractal_physics;
    },
    set fractal(val) {
      fractal_physics = val;
    },
    get simulation() {
      return simulationState;
    },
    get simulation_log() {
      return simulationState.simulation_log;
    },
    get story_id() {
      return simulationState.story_id;
    },
    set story_id(id) {
      simulationState.story_id = id;
      simulationState.story.active_id = id;
    },
    get is_ready() {
      return simulationState.ready;
    },
    get round() {
      return simulationState.round;
    },
    set round(val) {
      simulationState.round = val;
    },
    get turn_type() {
      return simulationState.turn_type;
    },
    set turn_type(val) {
      simulationState.turn_type = val;
    },
    get active_story() {
      return simulationState.story_id
        ? simulationState.story.by_id[simulationState.story_id]
        : null;
    },
    // --- VECTOR API ---
    activeVectors: (role = "AI") => {
      const entity = api._getEntityByRole(role);
      return entity?.future || [];
    },
    addVector: (text, role = "AI", is_vanguard = false) => {
      const entity = api._getEntityByRole(role);
      if (!entity) return;
      if (!Array.isArray(entity.future)) entity.future = [];
      const new_vector = VectorEngine.create_vector(text);
      if (is_vanguard) entity.future.unshift(new_vector);
      else entity.future.push(new_vector);
    },
    logTurn: (content, is_user = false) => {
      const story_id = simulationState.story_id || "debug";
      if (!simulationState.simulation_log.by_story_id[story_id]) {
        simulationState.simulation_log.by_story_id[story_id] = [];
      }
      simulationState.simulation_log.by_story_id[story_id].push({
        role: is_user ? "user" : "assistant",
        text: content,
        character_name: is_user
          ? entityState.active_user?.name || "User"
          : entityState.active_ai?.name || "AI",
        created_at: Date.now(),
      });
    },
    completeVector: (role = "AI") => {
      const entity = api._getEntityByRole(role);
      if (Array.isArray(entity?.future) && entity.future.length > 0) {
        entity.future.shift();
      }
    },
    _getEntityByRole: (role) => {
      if (role === "AI") return entityState.active_ai;
      if (role === "USER") return entityState.active_user;
      if (role === "FRACTAL") return entityState.active_fractal;
      return null;
    },
    // --- DATA SYNC ---
    sync: async (active_story_id = null) => {
      if (active_story_id) simulationState.story_id = active_story_id;
      if (!simulationState.story_id) {
        try {
          const entry = await db.kv_settings.get("active_session_id");
          if (entry?.value) simulationState.story_id = entry.value;
          else return;
        } catch {
          return;
        }
      }
      try {
        const story = await db.stories.get(simulationState.story_id);
        if (!story) return;
        const [user_data, ai_data, fractal_data] = await Promise.all([
          entities.get("character", story.user_id),
          entities.get("character", story.ai_id || "unknown_ai"),
          entities.get("fractal", story.fractal_id),
        ]);
        if (user_data) {
          entityState.character = {
            ...entityState.character,
            ...user_data,
            id: user_data.id,
          };
          entityState.active_user = entityState.character;
        }
        if (ai_data) {
          entityState.active_ai = ai_data;
          ai_physics = ai_data.dynamics; // Initialize with seed dynamics
        }
        if (fractal_data) {
          entityState.active_fractal = fractal_data;
          fractal_physics = fractal_data.dynamics; // Initialize with seed dynamics
        }
        // Stamp dynamics_baseline from the story snapshot.
        // This gives the physics engine a per-character gravitational center
        // rather than the universal 50 fallback.
        if (story.entity_snapshots?.ai?.dynamics) {
          entityState.active_ai.dynamics_baseline =
            story.entity_snapshots.ai.dynamics;
        }
        if (story.entity_snapshots?.fractal?.dynamics) {
          entityState.active_fractal.dynamics_baseline =
            story.entity_snapshots.fractal.dynamics;
        }
        simulationState.ready = true;
      } catch (err) {
        console.warn("[Data] Sync Failed:", err);
      }
    },
    save: async (round = null) => {
      if (!simulationState.story_id) return;
      try {
        const targetRound = round ?? 0;
        await db.stories.update(simulationState.story_id, {
          round: targetRound,
          last_played: Date.now(),
          ai_dynamics: $state.snapshot(ai_physics),
          fractal_dynamics: $state.snapshot(fractal_physics),
        });
      } catch (err) {
        console.error("[Data] Story Save Failed:", err);
      }
    },
    saveEntity: async (type, entity) => {
      try {
        await entities.upsert(type, entity);
        if (entityState.character && entityState.character.id === entity.id) {
          Object.assign(entityState.character, entity);
        }
      } catch (err) {
        console.error("[Data] Entity Save Failed:", err);
        throw err;
      }
    },
    updateEntity: async (type, id, data) => {
      try {
        if (type === "story") {
          await db.stories.update(id, data);
          if (simulationState.story_id === id) {
            Object.assign(simulationState.story.by_id[id] || {}, data);
          }
        } else {
          // Add updated_at if not present for consistency
          const payload = { ...data, updated_at: Date.now() };
          await entities.update(type, id, payload);
          const targets = [
            ...new Set([
              entityState.character,
              entityState.active_user,
              entityState.active_ai,
              entityState.active_fractal,
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
    deleteEntity: async (type, id) => {
      try {
        await entities.remove(type, id);
      } catch (err) {
        console.error("[Data] Entity Delete Failed:", err);
        throw err;
      }
    },
    _debugInject: (mock_data) => {
      if (mock_data.user) entityState.active_user = mock_data.user;
      if (mock_data.ai) entityState.active_ai = mock_data.ai;
      if (mock_data.fractal) entityState.active_fractal = mock_data.fractal;
      simulationState.ready = true;
    },
  };
  return api;
}
export const runtime = createRuntimeStore();
