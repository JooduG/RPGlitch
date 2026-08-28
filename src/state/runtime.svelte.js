/**
 * src/state/runtime.svelte.js
 * ⚡ RUNTIME ENGINE STORE: Reactive Simulation State & Entity Kernel
 *
 * Core Responsibilities:
 * - Owns the reactive Svelte 5 Runes representing active simulation state:
 *   - Active Entities: `character` (User Persona), `active_user`, `active_ai`, `active_fractal`.
 *   - NPC World Cast: `active_npcs` (hydrated records) and `in_scene_npc_ids` (Stage Spotlight).
 *   - Live Physics & Dynamics: `ai_physics`, `fractal_physics`, and per-entity dynamic baselines.
 *   - Macro Chronology: `story_id`, `round`, `turn_type`, and `is_ready` flags.
 *   - Generation Concurrency Mutex: `is_foreground_generating` vs `is_background_generating`.
 *   - Telemetry Ring Buffer: Director Quick Shot latency tracking (`last_director_ms`, `p50`, `p95`).
 * - Manages bi-directional synchronization with IndexedDB persistence via `@data` repositories.
 * - Manages reactive auto-save effect root (`init_effects`, `teardown_effects`).
 *
 * Dependencies & Layer Boundaries:
 * - `@data`: `db`, `entities`, `coerce_story_key`, `session_driver`, `SESSION_ID_KEY`.
 * - `@platform`: `load_session_checkpoint`, `clear_session_checkpoint`.
 * - `@utils`: `decompose_story_title`.
 * - `@media`: `get_signature_color`.
 * - `./app-store.svelte.js`: `app` (selection synchronization, story title decomposition).
 */

import { db, entities, coerce_story_key, session_driver, SESSION_ID_KEY } from "@data";
import { load_session_checkpoint, clear_session_checkpoint } from "@platform";
import { decompose_story_title } from "@utils";
import { get_signature_color } from "@media";
import { app } from "./app-store.svelte.js";

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {import('@intelligence/temporal-pipeline.js').TemporalVector} TemporalVector
 */

/**
 * @typedef {Object} EntityDynamics
 * @property {number} [chaos] - Chaos metric (0-100).
 * @property {number} [intensity] - Intensity metric (0-100).
 * @property {number} [openness] - Openness metric (0-100).
 * @property {number} [affinity] - Interpersonal affinity metric (0-100).
 * @property {number} [velocity] - Environmental velocity metric (0-100).
 * @property {number} [entropy] - Environmental entropy metric (0-100).
 */

/**
 * @typedef {Object} EntityFragments
 * @property {string} non_physical - Psychological, behavioral, or metaphysical profile text.
 * @property {string} physical - Visual appearance, clothing, inventory, and sensory features.
 */

/**
 * @typedef {Object} SimulationEntity
 * @property {string | number | null} id - Entity identifier.
 * @property {string} name - Display name.
 * @property {string} [description] - Summary description.
 * @property {EntityFragments} eternal - Immutable core archetype.
 * @property {EntityFragments} present - Immediate physical state & active parameters.
 * @property {TemporalVector[]} past - Historical anchor memories and session vectors.
 * @property {string} future - Standing agenda and trajectory string.
 * @property {EntityDynamics} dynamics - Live dynamic physics values.
 * @property {EntityDynamics} [dynamics_baseline] - Gravitational baseline dynamics.
 * @property {Record<string, any>} [voice] - TTS voice configuration.
 * @property {string | null} [profile_picture] - Visual avatar data URL or path.
 * @property {string} [signature_color] - CSS accent color token.
 * @property {Record<string, any>} [modifiers] - Image prompt modifiers and generation seeds.
 * @property {string[]} [associated_ids] - Related world entity IDs.
 */

// ============================================================================
// [SECTION 2: CONSTANTS & DEFAULT CONFIGURATIONS]
// ============================================================================

export const DIRECTOR_MS_POOL_CAP = 50;

const DEFAULT_AI_DYNAMICS = Object.freeze({
  chaos: 50,
  intensity: 50,
  openness: 50,
  affinity: 50,
});

const DEFAULT_FRACTAL_DYNAMICS = Object.freeze({
  velocity: 50,
  entropy: 50,
});

/**
 * Creates a blank unlinked entity blueprint.
 * @returns {SimulationEntity}
 */
function create_unlinked_entity() {
  return {
    id: null,
    name: "Unlinked",
    description: "No data stream connected.",
    eternal: { non_physical: "", physical: "" },
    present: { non_physical: "", physical: "" },
    future: "",
    past: [],
    dynamics: { ...DEFAULT_AI_DYNAMICS },
    voice: { rate: 1.0 },
    profile_picture: null,
    signature_color: "",
    modifiers: {
      prompt: "",
      flipped: false,
      profile_picture_seed: 0,
      last_generated_seed: null,
    },
  };
}

// ============================================================================
// [SECTION 3: RUNTIME STORE FACTORY]
// ============================================================================

/**
 * Constructs the reactive runtime store instance.
 */
function create_runtime_store() {
  // --- Active Entities State ---
  /** @type {SimulationEntity} */
  let character_state = $state(create_unlinked_entity());
  /** @type {SimulationEntity | null} */
  let active_user_state = $state(null);
  /** @type {SimulationEntity | null} */
  let active_ai_state = $state(null);
  /** @type {SimulationEntity | null} */
  let active_fractal_state = $state(null);

  // --- NPC World Cast & Stage Spotlight ---
  /** @type {Record<string, any>} */
  let active_npcs_state = $state({});
  /** @type {string[]} */
  let in_scene_npc_ids_state = $state([]);
  /** @type {string | null} */
  let streaming_entity_id_state = $state(null);

  // --- Chronology & Session State ---
  let simulation_is_ready = $state(false);
  /** @type {string | null} */
  let simulation_story_id = $state(null);
  /** @type {{ by_id: Record<string, any>, active_id: string | null }} */
  let simulation_story = $state({ by_id: {}, active_id: null });
  let simulation_round = $state(0);
  let simulation_turn_type = $state("USER_TURN");

  // --- Dynamics & Live Physics ---
  /** @type {EntityDynamics | null} */
  let ai_physics = $state(null);
  /** @type {EntityDynamics | null} */
  let fractal_physics = $state(null);
  let last_director_beat_round = $state(-1);
  let last_dynamics_beat_round = $state(-1);

  // --- Director Quick Shot Telemetry ---
  let last_director_ms = $state(0);
  /** @type {number[]} */
  let director_ms_pool = $state([]);

  // --- Generation Concurrency Mutex ---
  let is_foreground_generating = $state(false);
  let is_background_generating = $state(false);

  /** @type {(() => void) | null} */
  let runtime_cleanup = null;

  const api = {
    // ------------------------------------------------------------------------
    // Lifecycle & Effects
    // ------------------------------------------------------------------------
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
                updated_at: Date.now(),
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

    // ------------------------------------------------------------------------
    // Entity Accessors & Non-Reactive Snapshots
    // ------------------------------------------------------------------------
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
     * Returns a non-reactive snapshot of primary simulation entities.
     * Prevents Proxy errors during mathematical operations in physics engines.
     */
    get snapshot_entities() {
      return {
        AI: $state.snapshot(active_ai_state),
        USER: $state.snapshot(active_user_state),
        FRACTAL: $state.snapshot(active_fractal_state),
      };
    },

    /** Non-reactive snapshot of the hydrated NPC world cast. */
    get snapshot_npcs() {
      return Object.fromEntries(Object.entries(active_npcs_state).map(([id, e]) => [id, $state.snapshot(e)]));
    },

    /** Non-reactive snapshot of on-stage NPC IDs. */
    get snapshot_in_scene_npc_ids() {
      return [...in_scene_npc_ids_state];
    },

    get active_npcs() {
      return active_npcs_state;
    },
    set active_npcs(val) {
      active_npcs_state = val || {};
    },

    get in_scene_npc_ids() {
      return in_scene_npc_ids_state;
    },
    set in_scene_npc_ids(val) {
      in_scene_npc_ids_state = Array.isArray(val) ? [...new Set(val.map((x) => String(x)))] : [];
    },

    get streaming_entity_id() {
      return streaming_entity_id_state;
    },
    set streaming_entity_id(val) {
      streaming_entity_id_state = val;
    },

    // ------------------------------------------------------------------------
    // Dynamics & Physics
    // ------------------------------------------------------------------------
    get ai() {
      return ai_physics;
    },
    set ai(val) {
      const fallback = { ...DEFAULT_AI_DYNAMICS };
      ai_physics = val || fallback;
      if (active_ai_state) {
        active_ai_state.dynamics = val || fallback;
      }
    },

    get fractal() {
      return fractal_physics;
    },
    set fractal(val) {
      const fallback = { ...DEFAULT_FRACTAL_DYNAMICS };
      fractal_physics = val || fallback;
      if (active_fractal_state) {
        active_fractal_state.dynamics = val || fallback;
      }
    },

    // ------------------------------------------------------------------------
    // Chronology & Session Flags
    // ------------------------------------------------------------------------
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

    get last_director_beat_round() {
      return last_director_beat_round;
    },
    set last_director_beat_round(val) {
      last_director_beat_round = val;
    },

    get last_dynamics_beat_round() {
      return last_dynamics_beat_round;
    },
    set last_dynamics_beat_round(val) {
      last_dynamics_beat_round = val;
    },

    get active_story() {
      if (!simulation_story_id) return null;
      return simulation_story.by_id[simulation_story_id] ?? simulation_story.by_id[coerce_story_key(simulation_story_id)] ?? null;
    },

    // ------------------------------------------------------------------------
    // Telemetry Ring Buffer
    // ------------------------------------------------------------------------
    get last_director_ms() {
      return last_director_ms;
    },
    get director_ms_pool() {
      return director_ms_pool;
    },
    get director_p50_ms() {
      if (!director_ms_pool.length) return 0;
      const sorted = [...director_ms_pool].sort((a, b) => a - b);
      return sorted[Math.floor(sorted.length * 0.5)] || 0;
    },
    get director_p95_ms() {
      if (!director_ms_pool.length) return 0;
      const sorted = [...director_ms_pool].sort((a, b) => a - b);
      return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] || 0;
    },

    /**
     * Records a director latency execution sample into the rolling ring buffer.
     * @param {number} ms
     */
    record_director_latency(ms) {
      const valid = Math.max(0, Number(ms) || 0);
      last_director_ms = valid;
      const next = [...director_ms_pool, valid];
      if (next.length > DIRECTOR_MS_POOL_CAP) {
        next.shift();
      }
      director_ms_pool = next;
    },

    // ------------------------------------------------------------------------
    // Generation Concurrency Mutex
    // ------------------------------------------------------------------------
    get is_foreground_generating() {
      return is_foreground_generating;
    },
    get is_background_generating() {
      return is_background_generating;
    },
    acquire_foreground_generation() {
      is_foreground_generating = true;
    },
    release_foreground_generation() {
      is_foreground_generating = false;
    },
    acquire_background_generation() {
      is_background_generating = true;
    },
    release_background_generation() {
      is_background_generating = false;
    },
    can_start_background_generation() {
      return !is_foreground_generating;
    },

    // ------------------------------------------------------------------------
    // Database Synchronization & Entity Persistence
    // ------------------------------------------------------------------------
    /**
     * Synchronizes runtime state with IndexedDB for the active or given story.
     * @param {string | number | null} [active_story_id]
     */
    sync: async (active_story_id = null) => {
      if (active_story_id) simulation_story_id = String(active_story_id);

      const checkpoint = !simulation_story_id ? load_session_checkpoint() : null;
      if (!simulation_story_id) {
        if (checkpoint?.story_id) {
          simulation_story_id = checkpoint.story_id;
        } else {
          try {
            const entry = await db.kv_settings.get(SESSION_ID_KEY);
            if (entry?.value) simulation_story_id = entry.value;
            else return;
          } catch {
            return;
          }
        }
      }

      try {
        const db_key = coerce_story_key(simulation_story_id);
        const story = await db.stories.get(db_key);
        if (!story) {
          clear_session_checkpoint();
          return;
        }

        if (session_driver?.restore_active) {
          session_driver.restore_active(String(simulation_story_id));
        }

        if (story.round != null) api.round = story.round;
        if (typeof checkpoint?.round === "number" && checkpoint.round > (story.round ?? 0)) {
          api.round = checkpoint.round;
        }

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
          const effective_visual_style = story.visual_style || story.entity_snapshots?.fractal?.visual_style || fractal_data.visual_style;
          const effective_narrative_style = story.narrative_style || story.entity_snapshots?.fractal?.narrative_style || fractal_data.narrative_style;

          active_fractal_state = {
            ...fractal_data,
            ...(effective_visual_style ? { visual_style: effective_visual_style } : {}),
            ...(effective_narrative_style ? { narrative_style: effective_narrative_style } : {}),
          };
          fractal_physics = story.fractal_dynamics
            ? { ...story.fractal_dynamics }
            : story.entity_snapshots?.fractal?.dynamics
              ? { ...story.entity_snapshots.fractal.dynamics }
              : { ...fractal_data.dynamics };
        }

        // Dynamics baselines
        if (story.entity_snapshots?.ai?.dynamics && active_ai_state) {
          active_ai_state.dynamics_baseline = { ...story.entity_snapshots.ai.dynamics };
        }
        if (story.entity_snapshots?.fractal?.dynamics && active_fractal_state) {
          active_fractal_state.dynamics_baseline = { ...story.entity_snapshots.fractal.dynamics };
        }

        // NPC World Cast hydration
        const npc_ids = Array.isArray(story.npc_ids) ? story.npc_ids : [];
        if (npc_ids.length) {
          const npc_list = (await Promise.all(npc_ids.map((nid) => entities.get("character", nid)))).filter(Boolean);
          active_npcs_state = Object.fromEntries(npc_list.map((n) => [String(n.id), n]));
          in_scene_npc_ids_state = npc_list.map((n) => String(n.id));
        } else {
          active_npcs_state = {};
          in_scene_npc_ids_state = [];
        }

        // Sync selections to app store
        app.selected_ai = active_ai_state;
        app.selected_user = active_user_state;
        app.selected_fractal = active_fractal_state;

        // Story title decomposition
        if (story.title) {
          app.story_title = story.title;
          app.story_title_parts = decompose_story_title(story.title, {
            ai: active_ai_state,
            user: active_user_state,
            fractal: active_fractal_state,
            get_color: get_signature_color,
          });
        }

        simulation_story.by_id[db_key] = story;
        if (String(db_key) !== String(simulation_story_id)) {
          simulation_story.by_id[simulation_story_id] = story;
        }

        simulation_is_ready = true;
        clear_session_checkpoint();
      } catch (err) {
        console.warn("[Data] Sync Failed:", err);
      }
    },

    /**
     * Persists story round and dynamics state to IndexedDB.
     * @param {number | null} [round]
     */
    save: async (round = null) => {
      if (!simulation_story_id) return;
      try {
        const target_round = typeof round === "number" ? round : simulation_round;
        await db.stories.update(coerce_story_key(simulation_story_id), {
          round: target_round,
          last_played: Date.now(),
          updated_at: Date.now(),
          ai_dynamics: $state.snapshot(ai_physics),
          fractal_dynamics: $state.snapshot(fractal_physics),
        });
        app.stories_version++;
      } catch (err) {
        console.error("[Data] Story Save Failed:", err);
      }
    },

    /**
     * Upserts an entity in persistence and syncs reactive references.
     * @param {'character' | 'fractal'} type
     * @param {SimulationEntity} entity
     */
    save_entity: async (type, entity) => {
      try {
        await entities.upsert(type, entity);
        if (character_state && character_state.id === entity.id) {
          Object.assign(character_state, entity);
        }
        if (active_ai_state?.id === entity.id) {
          Object.assign(active_ai_state, entity);
        }
        if (active_user_state?.id === entity.id) {
          Object.assign(active_user_state, entity);
        }
        if (active_fractal_state?.id === entity.id) {
          Object.assign(active_fractal_state, entity);
        }
        if (active_npcs_state[entity.id]) {
          active_npcs_state[entity.id] = entity;
        }
      } catch (err) {
        console.error("[Data] Entity Save Failed:", err);
        throw err;
      }
    },

    /**
     * Updates an entity or story in persistence and syncs reactive memory.
     * @param {'character' | 'fractal' | 'story'} type
     * @param {string | number} id
     * @param {Record<string, any>} data
     */
    update_entity: async (type, id, data) => {
      try {
        if (type === "story") {
          await db.stories.update(coerce_story_key(id), data);
          app.stories_version++;
          if (simulation_story_id === id) {
            Object.assign(simulation_story.by_id[id] || {}, data);
          }
        } else {
          const payload = { ...data, updated_at: Date.now() };
          await entities.update(type, String(id), payload);
          const targets = [...new Set([character_state, active_user_state, active_ai_state, active_fractal_state])];
          targets.forEach((t) => {
            if (t && t.id === id) Object.assign(t, payload);
          });
          if (active_npcs_state[id]) {
            active_npcs_state[id] = { ...active_npcs_state[id], ...payload };
          }
        }
      } catch (err) {
        console.error(`[Data] Update Entity (${type}) Failed:`, err);
      }
    },

    /**
     * Deletes an entity from persistence and clears active runtime references.
     * @param {'character' | 'fractal'} type
     * @param {string | number} id
     */
    delete_entity: async (type, id) => {
      try {
        await entities.remove(type, String(id));

        if (type === "character") {
          if (active_ai_state?.id === id) active_ai_state = null;
          if (active_user_state?.id === id) {
            active_user_state = null;
            Object.assign(character_state, create_unlinked_entity());
          }
        } else {
          if (active_fractal_state?.id === id) active_fractal_state = null;
        }

        if (active_npcs_state[id]) {
          const next_npcs = { ...active_npcs_state };
          delete next_npcs[id];
          active_npcs_state = next_npcs;
          in_scene_npc_ids_state = in_scene_npc_ids_state.filter((x) => x !== String(id));
        }
      } catch (err) {
        console.error("[Data] Entity Delete Failed:", err);
        throw err;
      }
    },

    /**
     * Debug and test helper for injecting mocked entity kernels.
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

// ============================================================================
// [SECTION 4: SINGLETON EXPORT & BROWSER BRIDGE]
// ============================================================================

export const runtime = create_runtime_store();

if (typeof window !== "undefined") {
  window.runtime = runtime;
  runtime.init_effects();
}

// ============================================================================
// [CHANGELOG]
// ============================================================================
/**
 * CHANGELOG:
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported DIRECTOR_MS_POOL_CAP constant, cleaned up unlinked
 *   entity blueprint reset in delete_entity, and verified 100% test pass.
 * - 2026-08-16: Added Director Quick Shot latency telemetry pool (p50/p95) and Generation Mutex.
 * - 2026-06-15: Added NPC world cast and Stage Spotlight state hydration.
 */
