import { db, entities } from "@data";
import { SESSION_ID_KEY } from "@engine";
import { temporal_engine } from "@intelligence";
import { app } from "@state";
// We split the large state object into cohesive internal modules:
// 1. Entities (character, active_user, active_ai, active_fractal)
// 2. Story / Narrative (story, story_id, simulation_log, turn, ready)
// 3. Physics / Dynamics (ai_physics, fractal_physics)
/**
 * @typedef {import('@intelligence/temporal.js').TemporalVector} TemporalVector
 * @typedef {import('./log.svelte.js').LogEntry} LogEntry
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

  /** @type {SimulationEntity} */
  let character_state = $state({
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
  });

  /** @type {SimulationEntity | null} */
  let active_user_state = $state(null);
  /** @type {SimulationEntity | null} */
  let active_ai_state = $state(null);
  /** @type {SimulationEntity | null} */
  let active_fractal_state = $state({
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
  });

  let simulation_is_ready = $state(false);
  /** @type {string | null} */
  let simulation_story_id = $state(null);
  /** @type {{ by_id: Record<string, any>, active_id: string | null }} */
  let simulation_story = $state({ by_id: {}, active_id: null });
  /** @type {{ by_story_id: Record<string, LogEntry[]> }} */
  let simulation_log_data = $state({ by_story_id: {} });
  let simulation_round = $state(0);
  let simulation_turn_type = $state("USER_TURN"); // USER_TURN, AI_TURN, SYSTEM_TURN
  // [R5] Dynamics Snapshots (Live Physics)
  /** @type {EntityDynamics | null} */
  let ai_physics = $state(null);
  /** @type {EntityDynamics | null} */
  let fractal_physics = $state(null);

  /** @type {(() => void) | null} */
  let runtime_cleanup = null;

  const api = {
    // --- LIFECYCLE ---
    init_effects() {
      if (runtime_cleanup) return;
      runtime_cleanup = $effect.root(() => {
        $effect(() => {
          const _round = simulation_round;
          const _ai = ai_physics;
          const _fractal = fractal_physics;
          if (simulation_is_ready && simulation_story_id) {
            db.stories
              .update(coerce_story_key(simulation_story_id), {
                round: _round,
                last_played: Date.now(),
                ai_dynamics: $state.snapshot(_ai),
                fractal_dynamics: $state.snapshot(_fractal),
              })
              .catch((err) => console.error("[Data] Auto-save failed:", err));
          }
        });
      });
    },
    teardown_effects() {
      if (runtime_cleanup) {
        runtime_cleanup();
        runtime_cleanup = null;
      }
    },
    // --- GETTERS ---
    get character() {
      return character_state;
    },
    /** @returns {SimulationEntity | null} */
    get active_user() {
      return active_user_state;
    },
    /** @returns {SimulationEntity | null} */
    get active_ai() {
      return active_ai_state;
    },
    /** @returns {SimulationEntity | null} */
    get active_fractal() {
      return active_fractal_state;
    },
    /**
     * Returns a non-reactive snapshot of the current entities.
     * Crucial for passing data to non-Svelte logic (like the dynamics engine)
     * to avoid math-on-proxy errors.
     */
    get snapshot_entities() {
      return {
        AI: $state.snapshot(active_ai_state),
        USER: $state.snapshot(active_user_state),
        FRACTAL: $state.snapshot(active_fractal_state),
      };
    },
    get ai() {
      return ai_physics;
    },
    set ai(val) {
      const fallback = { chaos: 50, intensity: 50, openness: 50, affinity: 50 };
      ai_physics = val || fallback;
      if (active_ai_state) {
        active_ai_state.dynamics = val || fallback;
      }
    },
    get fractal() {
      return fractal_physics;
    },
    set fractal(val) {
      const fallback = { velocity: 50, entropy: 50 };
      fractal_physics = val || fallback;
      if (active_fractal_state) {
        active_fractal_state.dynamics = val || fallback;
      }
    },

    get simulation_log() {
      return simulation_log_data;
    },
    get story_id() {
      return simulation_story_id;
    },
    set story_id(id) {
      simulation_story_id = id;
      simulation_story.active_id = id;
    },
    get is_ready() {
      return simulation_is_ready;
    },
    set is_ready(val) {
      simulation_is_ready = val;
    },
    get round() {
      return simulation_round;
    },
    set round(val) {
      simulation_round = val;
    },
    get turn_type() {
      return simulation_turn_type;
    },
    set turn_type(val) {
      simulation_turn_type = val;
    },
    get active_story() {
      return simulation_story_id ? simulation_story.by_id[simulation_story_id] : null;
    },
    // --- VECTOR API ---

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
      const story_id = simulation_story_id || "debug";
      if (!simulation_log_data.by_story_id[story_id]) {
        simulation_log_data.by_story_id[story_id] = [];
      }
      simulation_log_data.by_story_id[story_id].push({
        role: is_user ? "user" : "assistant",
        text: content,
        character_name: is_user ? active_user_state?.name || "User" : active_ai_state?.name || "AI",
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
      if (role === "AI") return active_ai_state;
      if (role === "USER") return active_user_state;
      if (role === "FRACTAL") return active_fractal_state;
      return null;
    },
    // --- DATA SYNC ---
    /**
     * Synchronizes the runtime state with the database.
     * @param {string|null} [active_story_id] - Optional ID to force sync a specific story.
     */
    sync: async (active_story_id = null) => {
      if (active_story_id) simulation_story_id = active_story_id;
      if (!simulation_story_id) {
        try {
          const entry = await db.kv_settings.get(SESSION_ID_KEY);
          if (entry?.value) simulation_story_id = entry.value;
          else return;
        } catch {
          return;
        }
      }
      try {
        const db_key = coerce_story_key(simulation_story_id);
        const story = await db.stories.get(db_key);
        if (!story) return;
        const [user_data, ai_data, fractal_data] = await Promise.all([
          /** @type {Promise<SimulationEntity | null>} */ (entities.get("character", story.user_id)),
          /** @type {Promise<SimulationEntity | null>} */ (entities.get("character", story.ai_id || "unknown_ai")),
          /** @type {Promise<SimulationEntity | null>} */ (entities.get("fractal", story.fractal_id)),
        ]);
        if (user_data) {
          Object.assign(character_state, user_data);
          character_state.id = user_data.id;
          active_user_state = character_state;
        }
        if (ai_data) {
          active_ai_state = ai_data;
          ai_physics = story.ai_dynamics
            ? { ...story.ai_dynamics }
            : story.entity_snapshots?.ai?.dynamics
              ? { ...story.entity_snapshots.ai.dynamics }
              : { ...ai_data.dynamics };
        }
        if (fractal_data) {
          active_fractal_state = fractal_data;
          fractal_physics = story.fractal_dynamics
            ? { ...story.fractal_dynamics }
            : story.entity_snapshots?.fractal?.dynamics
              ? { ...story.entity_snapshots.fractal.dynamics }
              : { ...fractal_data.dynamics };
        }
        // Stamp dynamics_baseline from the story snapshot.
        // This gives the physics engine a per-character gravitational center
        // rather than the universal 50 fallback.
        if (story.entity_snapshots?.ai?.dynamics && active_ai_state) {
          active_ai_state.dynamics_baseline = { ...story.entity_snapshots.ai.dynamics };
        }
        if (story.entity_snapshots?.fractal?.dynamics && active_fractal_state) {
          active_fractal_state.dynamics_baseline = { ...story.entity_snapshots.fractal.dynamics };
        }

        // Synchronize app selections for UI consistency in storymode
        app.selected_ai = active_ai_state;
        app.selected_user = active_user_state;
        app.selected_fractal = active_fractal_state;

        simulation_is_ready = true;
      } catch (err) {
        console.warn("[Data] Sync Failed:", err);
      }
    },
    /**
     * Synchronizes the runtime state with the database.
     * @param {number|null} [round]
     */
    save: async (round = null) => {
      if (!simulation_story_id) return;
      try {
        const target_round = typeof round === "number" ? round : 0;
        await db.stories.update(coerce_story_key(simulation_story_id), {
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
        if (character_state && character_state.id === entity.id) {
          Object.assign(character_state, entity);
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
          if (simulation_story_id === id) {
            Object.assign(simulation_story.by_id[id] || {}, data);
          }
        } else {
          // Add updated_at if not present for consistency
          const payload = { ...data, updated_at: Date.now() };
          await entities.update(type, String(id), payload);
          const targets = [...new Set([character_state, active_user_state, active_ai_state, active_fractal_state])];
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
        active_user_state = mock_data.user;
        app.selected_user = mock_data.user;
      }
      if (mock_data.ai) {
        active_ai_state = mock_data.ai;
        app.selected_ai = mock_data.ai;
      }
      if (mock_data.fractal) {
        active_fractal_state = mock_data.fractal;
        app.selected_fractal = mock_data.fractal;
      }
      simulation_is_ready = true;
    },
  };
  return api;
}
export const runtime = createRuntimeStore();
if (typeof window !== "undefined") {
  window.runtime = runtime;
  runtime.init_effects();
}
