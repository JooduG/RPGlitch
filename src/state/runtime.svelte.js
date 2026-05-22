import { temporal_engine } from "@core/intelligence/temporal-engine.js";
import { db } from "@data/db.js";
import { entities } from "@data/repository.js";
import { SESSION_ID_KEY } from "@core/constants.js";
import { app } from "@state/app.svelte.js";
// We split the large state object into cohesive internal modules:
// 1. Entities (character, active_user, active_ai, active_fractal)
// 2. Story / Narrative (story, story_id, simulation_log, turn, ready)
// 3. Physics / Dynamics (ai_physics, fractal_physics)
/**
 * @typedef {import('@core/intelligence/temporal-engine.js').TemporalVector} TemporalVector
 * @typedef {import('./simulation-log.svelte.js').LogEntry} LogEntry
 */

/**
 * @typedef {Object} EntityDynamics
 * @property {number} [chaos]
 * @property {number} [intensity]
 * @property {number} [openness]
 * @property {number} [affinity]
 * @property {number} [velocity]
 * @property {number} [entropy]
 */

/**
 * @typedef {Object} EntityFragments
 * @property {string} non_physical
 * @property {string} physical
 */

/**
 * @typedef {Object} SimulationEntity
 * @property {string | number | null} id
 * @property {string} name
 * @property {string} [description]
 * @property {EntityFragments} eternal
 * @property {EntityFragments} present
 * @property {TemporalVector[]} past
 * @property {TemporalVector[]} future
 * @property {EntityDynamics} dynamics
 * @property {EntityDynamics} [dynamics_baseline]
 * @property {any} [voice]
 * @property {string | null} [profile_picture]
 * @property {string} [signature_color]
 * @property {any} [modifiers]
 * @property {string[]} [associated_ids]
 */

/**
 * @typedef {Object} EntityState
 * @property {SimulationEntity} character
 * @property {SimulationEntity | null} active_user
 * @property {SimulationEntity | null} active_ai
 * @property {SimulationEntity} active_fractal
 */

/**
 * @typedef {Object} SimulationState
 * @property {boolean} is_ready
 * @property {string | null} story_id
 * @property {Object} story
 * @property {Record<string, any>} story.by_id
 * @property {string | null} story.active_id
 * @property {Object} simulation_log
 * @property {Record<string, LogEntry[]>} simulation_log.by_story_id
 * @property {number} round
 * @property {string} turn_type
 */

/**
 *
 */
function createRuntimeStore() {
  /**
   * Coerces a story_id to match the Dexie `++id` auto-increment integer key type.
   * The stories table uses numeric auto-increment keys, but session persistence
   * and URL routing may store the ID as a string. This prevents silent lookup failures.
   * @param {string | number | null} id
   * @returns {string | number | null}
   */
  const coerce_story_key = (id) => {
    if (typeof id === "string" && /^\d+$/.test(id)) return Number(id);
    return id;
  };
  /** @type {EntityState} */
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
      id: "active_fractal",
      name: "Environment",
      description: "",
      eternal: { non_physical: "", physical: "" },
      present: { non_physical: "", physical: "" },
      past: [],
      future: [],
      dynamics: { velocity: 50, entropy: 50 },
      profile_picture: null,
      signature_color: "",
    },
  });
  /** @type {SimulationState} */
  let simulation_state = $state({
    is_ready: false,
    story_id: null,
    story: { by_id: {}, active_id: null },
    simulation_log: { by_story_id: {} },
    round: 0,
    turn_type: "USER_TURN", // USER_TURN, AI_TURN, SYSTEM_TURN
  });
  // [R5] Dynamics Snapshots (Live Physics)
  /** @type {EntityDynamics | null} */
  let ai_physics = $state(null);
  /** @type {EntityDynamics | null} */
  let fractal_physics = $state(null);
  $effect.root(() => {
    $effect(() => {
      const _round = simulation_state.round;
      const _ai = ai_physics;
      const _fractal = fractal_physics;
      if (simulation_state.is_ready && simulation_state.story_id) {
        db.stories
          .update(coerce_story_key(simulation_state.story_id), {
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
    /** @returns {SimulationEntity | null} */
    get active_user() {
      return entity_state.active_user;
    },
    /** @returns {SimulationEntity | null} */
    get active_ai() {
      return entity_state.active_ai;
    },
    /** @returns {SimulationEntity} */
    get active_fractal() {
      return entity_state.active_fractal;
    },
    /**
     * Returns a non-reactive snapshot of the current entities.
     * Crucial for passing data to non-Svelte logic (like the dynamics engine)
     * to avoid math-on-proxy errors.
     */
    get snapshot_entities() {
      return {
        AI: $state.snapshot(entity_state.active_ai),
        USER: $state.snapshot(entity_state.active_user),
        FRACTAL: $state.snapshot(entity_state.active_fractal),
      };
    },
    get ai() {
      return ai_physics;
    },
    set ai(val) {
      const fallback = { chaos: 50, intensity: 50, openness: 50, affinity: 50 };
      ai_physics = val || fallback;
      if (entity_state.active_ai) {
        entity_state.active_ai.dynamics = val || fallback;
      }
    },
    get fractal() {
      return fractal_physics;
    },
    set fractal(val) {
      const fallback = { velocity: 50, entropy: 50 };
      fractal_physics = val || fallback;
      if (entity_state.active_fractal) {
        entity_state.active_fractal.dynamics = val || fallback;
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
    /**
     * @param {string} [role]
     * @returns {TemporalVector[]}
     */
    active_vectors: (role = "AI") => {
      const entity = api._get_entity_by_role(role);
      return entity?.future || [];
    },
    /**
     * @param {string} [role]
     * @returns {string}
     */
    active_vector: (role = "AI") => {
      const entity = api._get_entity_by_role(role);
      return entity?.future?.[0]?.text || (role === "FRACTAL" ? "Continue the journey." : "");
    },
    /**
     * @param {string} text
     * @param {string} [role]
     * @param {boolean} [is_vanguard]
     */
    add_vector: (text, role = "AI", is_vanguard = false) => {
      const entity = api._get_entity_by_role(role);
      if (!entity) return;
      if (!Array.isArray(entity.future)) entity.future = [];
      const new_vector = temporal_engine.create(text);
      if (is_vanguard) entity.future.unshift(new_vector);
      else entity.future.push(new_vector);
    },
    /**
     * @param {string} content
     * @param {boolean} [is_user]
     */
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
    /**
     * @param {string} [role]
     */
    complete_vector: (role = "AI") => {
      const entity = api._get_entity_by_role(role);
      if (Array.isArray(entity?.future) && entity.future.length > 0) {
        entity.future.shift();
      }
    },
    /**
     * @param {string} role
     * @returns {SimulationEntity | null}
     */
    _get_entity_by_role: (role) => {
      if (role === "AI") return entity_state.active_ai;
      if (role === "USER") return entity_state.active_user;
      if (role === "FRACTAL") return entity_state.active_fractal;
      return null;
    },
    // --- DATA SYNC ---
    /**
     * Synchronizes the runtime state with the database.
     * @param {string|null} [active_story_id] - Optional ID to force sync a specific story.
     */
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
        const db_key = coerce_story_key(simulation_state.story_id);
        const story = await db.stories.get(db_key);
        if (!story) return;
        const [user_data, ai_data, fractal_data] = await Promise.all([
          /** @type {Promise<SimulationEntity | null>} */ (
            entities.get("character", story.user_id)
          ),
          /** @type {Promise<SimulationEntity | null>} */ (
            entities.get("character", story.ai_id || "unknown_ai")
          ),
          /** @type {Promise<SimulationEntity | null>} */ (
            entities.get("fractal", story.fractal_id)
          ),
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

        // Synchronize app selections for UI consistency in storymode
        app.selected_ai = entity_state.active_ai;
        app.selected_user = entity_state.active_user;
        app.selected_fractal = entity_state.active_fractal;

        simulation_state.is_ready = true;
      } catch (err) {
        console.warn("[Data] Sync Failed:", err);
      }
    },
    /**
     * Synchronizes the runtime state with the database.
     * @param {number|null} [round]
     */
    save: async (round = null) => {
      if (!simulation_state.story_id) return;
      try {
        const target_round = typeof round === "number" ? round : 0;
        await db.stories.update(coerce_story_key(simulation_state.story_id), {
          round: target_round,
          last_played: Date.now(),
          ai_dynamics: $state.snapshot(ai_physics),
          fractal_dynamics: $state.snapshot(fractal_physics),
        });
      } catch (err) {
        console.error("[Data] Story Save Failed:", err);
      }
    },
    /**
     * @param {'character' | 'fractal'} type
     * @param {SimulationEntity} entity
     */
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
    /**
     * @param {'character' | 'fractal' | 'story'} type
     * @param {string | number} id
     * @param {any} data
     */
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
          await entities.update(type, String(id), payload);
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
    /**
     * @param {'character' | 'fractal'} type
     * @param {string | number} id
     */
    delete_entity: async (type, id) => {
      try {
        await entities.remove(type, String(id));
      } catch (err) {
        console.error("[Data] Entity Delete Failed:", err);
        throw err;
      }
    },
    /**
     * @param {Object} mock_data
     * @param {SimulationEntity} [mock_data.user]
     * @param {SimulationEntity} [mock_data.ai]
     * @param {SimulationEntity} [mock_data.fractal]
     */
    _debug_inject: (mock_data) => {
      if (mock_data.user) {
        entity_state.active_user = mock_data.user;
        app.selected_user = mock_data.user;
      }
      if (mock_data.ai) {
        entity_state.active_ai = mock_data.ai;
        app.selected_ai = mock_data.ai;
      }
      if (mock_data.fractal) {
        entity_state.active_fractal = mock_data.fractal;
        app.selected_fractal = mock_data.fractal;
      }
      simulation_state.is_ready = true;
    },
  };
  return api;
}
export const runtime = createRuntimeStore();
if (typeof window !== "undefined") {
  window.runtime = runtime;
}
