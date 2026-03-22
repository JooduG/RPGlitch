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
    activeUser: null,
    activeAi: null,
    activeFractal: {
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
    storyId: null,
    story: { byId: {}, activeId: null },
    simulationLog: { byStoryId: {} },
    round: 0,
    turnType: "USER_TURN", // USER_TURN, AI_TURN, SYSTEM_TURN
  });
  // [R5] Dynamics Snapshots (Live Physics)
  let aiPhysics = $state(null);
  let fractalPhysics = $state(null);
  $effect.root(() => {
    $effect(() => {
      const _round = simulationState.round;
      const _ai = aiPhysics;
      const _fractal = fractalPhysics;
      if (simulationState.ready && simulationState.storyId) {
        db.stories
          .update(simulationState.storyId, {
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
    get activeUser() {
      return entityState.activeUser;
    },
    get activeAi() {
      return entityState.activeAi;
    },
    get activeFractal() {
      return entityState.activeFractal;
    },
    get ai() {
      return aiPhysics;
    },
    set ai(val) {
      aiPhysics = val;
    },
    get fractal() {
      return fractalPhysics;
    },
    set fractal(val) {
      fractalPhysics = val;
    },
    get simulation() {
      return simulationState;
    },
    get simulationLog() {
      return simulationState.simulationLog;
    },
    get storyId() {
      return simulationState.storyId;
    },
    set storyId(id) {
      simulationState.storyId = id;
      simulationState.story.activeId = id;
    },
    get isReady() {
      return simulationState.ready;
    },
    get round() {
      return simulationState.round;
    },
    set round(val) {
      simulationState.round = val;
    },
    get turnType() {
      return simulationState.turnType;
    },
    set turnType(val) {
      simulationState.turnType = val;
    },
    get activeStory() {
      return simulationState.storyId
        ? simulationState.story.byId[simulationState.storyId]
        : null;
    },
    // --- VECTOR API ---
    activeVectors: (role = "AI") => {
      const entity = api._getEntityByRole(role);
      return entity?.future || [];
    },
    activeVector: (role = "AI") => {
      const entity = api._getEntityByRole(role);
      return entity?.future?.[0]?.text || (role === "FRACTAL" ? "Continue the journey." : "");
    },
    addVector: (text, role = "AI", is_vanguard = false) => {
      const entity = api._getEntityByRole(role);
      if (!entity) return;
      if (!Array.isArray(entity.future)) entity.future = [];
      const newVector = VectorEngine.createVector(text);
      if (is_vanguard) entity.future.unshift(newVector);
      else entity.future.push(newVector);
    },
    logTurn: (content, isUser = false) => {
      const storyId = simulationState.storyId || "debug";
      if (!simulationState.simulationLog.byStoryId[storyId]) {
        simulationState.simulationLog.byStoryId[storyId] = [];
      }
      simulationState.simulationLog.byStoryId[storyId].push({
        role: isUser ? "user" : "assistant",
        text: content,
        character_name: isUser
          ? entityState.activeUser?.name || "User"
          : entityState.activeAi?.name || "AI",
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
    sync: async (activeStoryId = null) => {
      if (activeStoryId) simulationState.storyId = activeStoryId;
      if (!simulationState.storyId) {
        try {
          const entry = await db.kv_settings.get("active_session_id");
          if (entry?.value) simulationState.storyId = entry.value;
          else return;
        } catch {
          return;
        }
      }
      try {
        const story = await db.stories.get(simulationState.storyId);
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
          entityState.activeUser = entityState.character;
        }
        if (ai_data) {
          entityState.activeAi = ai_data;
          aiPhysics = ai_data.dynamics; // Initialize with seed dynamics
        }
        if (fractal_data) {
          entityState.activeFractal = fractal_data;
          fractalPhysics = fractal_data.dynamics; // Initialize with seed dynamics
        }
        // Stamp dynamics_baseline from the story snapshot.
        // This gives the physics engine a per-character gravitational center
        // rather than the universal 50 fallback.
        if (story.entity_snapshots?.ai?.dynamics) {
          entityState.activeAi.dynamics_baseline = story.entity_snapshots.ai.dynamics;
        }
        if (story.entity_snapshots?.fractal?.dynamics) {
          entityState.activeFractal.dynamics_baseline = story.entity_snapshots.fractal.dynamics;
        }
        simulationState.ready = true;
      } catch (err) {
        console.warn("[Data] Sync Failed:", err);
      }
    },
    save: async (round = null) => {
      if (!simulationState.storyId) return;
      try {
        const targetRound = round ?? 0;
        await db.stories.update(simulationState.storyId, {
          round: targetRound,
          last_played: Date.now(),
          ai_dynamics: $state.snapshot(aiPhysics),
          fractal_dynamics: $state.snapshot(fractalPhysics),
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
          if (simulationState.storyId === id) {
            Object.assign(simulationState.story.byId[id] || {}, data);
          }
        } else {
          // Add updated_at if not present for consistency
          const payload = { ...data, updated_at: Date.now() };
          await entities.update(type, id, payload);
          const targets = [
            ...new Set([
              entityState.character,
              entityState.activeUser,
              entityState.activeAi,
              entityState.activeFractal,
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
      if (mock_data.user) entityState.activeUser = mock_data.user;
      if (mock_data.ai) entityState.activeAi = mock_data.ai;
      if (mock_data.fractal) entityState.activeFractal = mock_data.fractal;
      simulationState.ready = true;
    },
  };
  return api;
}
export const runtime = createRuntimeStore();
