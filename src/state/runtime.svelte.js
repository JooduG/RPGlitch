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
 * - `./interface.svelte.js`: `app` (selection synchronization, story title decomposition).
 * - `./status.svelte.js`: `simulation_state` (phase updates during stasis and reset).
 *
 * ============================================================================
 */

import { SvelteSet } from "svelte/reactivity";
import { db, entities, coerce_story_key, session_driver, SESSION_ID_KEY } from "@data";
import { load_session_checkpoint, clear_session_checkpoint } from "@platform";
import { decompose_story_title } from "@utils";
import { get_signature_color } from "@media";
import { app } from "./interface.svelte.js";

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {import('@intelligence/temporal.js').TemporalVector} TemporalVector
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
 * Applies the authoritative story title (and its colored decomposition) to the
 * shared app store against the story's bound entity trio.
 * @param {any} story
 * @param {any} [ai]
 * @param {any} [user]
 * @param {any} [fractal]
 */
function apply_story_title(story, ai = null, user = null, fractal = null) {
  if (!story?.title) return;
  app.story_title = story.title;
  app.story_title_parts = decompose_story_title(story.title, {
    ai,
    user,
    fractal,
    get_color: get_signature_color,
  });
}

/**
 /**
 * Reactive Svelte 5 Runtime Engine Store Class.
 * Owns live simulation entities, macro chronology, dynamics, and persistence synchronization.
 */
export class RuntimeEngineStore {
  // --------------------------------------------------------------------------
  // Reactive Svelte 5 State Runes
  // --------------------------------------------------------------------------

  // --- Active Entities State ---
  /** @type {SimulationEntity} */
  character = $state(create_unlinked_entity());
  /** @type {SimulationEntity | null} */
  active_user = $state(null);
  /** @type {SimulationEntity | null} */
  active_ai = $state(null);
  /** @type {SimulationEntity | null} */
  active_fractal = $state(null);

  // --- NPC World Cast & Stage Spotlight ---
  /** @type {Record<string, any>} */
  #active_npcs = $state({});
  /** @type {string[]} */
  #in_scene_npc_ids = $state([]);
  /** @type {string | null} */
  streaming_entity_id = $state(null);

  // --- Chronology & Session State ---
  is_ready = $state(false);
  /** @type {string | null} */
  #story_id = $state(null);
  /** @type {{ by_id: Record<string, any>, active_id: string | null }} */
  #story = $state({ by_id: {}, active_id: null });
  round = $state(0);
  turn_type = $state("USER_TURN");

  // --- Dynamics & Live Physics ---
  /** @type {EntityDynamics | null} */
  #ai_physics = $state(null);
  /** @type {EntityDynamics | null} */
  #fractal_physics = $state(null);
  last_director_beat_round = $state(-1);
  last_dynamics_beat_round = $state(-1);

  // --- Director Quick Shot Telemetry ---
  last_director_ms = $state(0);
  /** @type {number[]} */
  director_ms_pool = $state([]);

  // --- Generation Concurrency Mutex ---
  is_foreground_generating = $state(false);
  is_background_generating = $state(false);

  // --- Lifecycle Teardown Handle ---
  /** @type {(() => void) | null} */
  #runtime_cleanup = null;

  // --------------------------------------------------------------------------
  // Lifecycle & Effects
  // --------------------------------------------------------------------------

  init_effects() {
    if (this.#runtime_cleanup) return;
    this.#runtime_cleanup = $effect.root(() => {
      $effect(() => {
        const _round = this.round;
        const _ai = this.#ai_physics;
        const _fractal = this.#fractal_physics;
        if (this.is_ready && this.#story_id) {
          db.stories
            .update(coerce_story_key(this.#story_id), {
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
  }

  teardown_effects() {
    if (this.#runtime_cleanup) {
      this.#runtime_cleanup();
      this.#runtime_cleanup = null;
    }
  }

  // --------------------------------------------------------------------------
  // Non-Reactive Snapshots
  // --------------------------------------------------------------------------

  /**
   * Returns a non-reactive snapshot of primary simulation entities.
   * Prevents Proxy errors during mathematical operations in physics engines.
   */
  get snapshot_entities() {
    return {
      AI: $state.snapshot(this.active_ai),
      USER: $state.snapshot(this.active_user),
      FRACTAL: $state.snapshot(this.active_fractal),
    };
  }

  /** Non-reactive snapshot of the hydrated NPC world cast. */
  get snapshot_npcs() {
    return Object.fromEntries(Object.entries(this.#active_npcs).map(([id, e]) => [id, $state.snapshot(e)]));
  }

  /** Non-reactive snapshot of on-stage NPC IDs. */
  get snapshot_in_scene_npc_ids() {
    return [...this.#in_scene_npc_ids];
  }

  // --------------------------------------------------------------------------
  // NPC World Cast Accessors
  // --------------------------------------------------------------------------

  get active_npcs() {
    return this.#active_npcs;
  }
  set active_npcs(val) {
    this.#active_npcs = val || {};
  }

  get in_scene_npc_ids() {
    return this.#in_scene_npc_ids;
  }
  set in_scene_npc_ids(val) {
    this.#in_scene_npc_ids = Array.isArray(val) ? [...new SvelteSet(val.map((x) => String(x)))] : [];
  }

  // --------------------------------------------------------------------------
  // Dynamics & Physics Accessors
  // --------------------------------------------------------------------------

  get ai() {
    return this.#ai_physics;
  }
  set ai(val) {
    const fallback = { ...DEFAULT_AI_DYNAMICS };
    this.#ai_physics = val || fallback;
    if (this.active_ai) {
      this.active_ai.dynamics = val || fallback;
    }
  }

  get fractal() {
    return this.#fractal_physics;
  }
  set fractal(val) {
    const fallback = { ...DEFAULT_FRACTAL_DYNAMICS };
    this.#fractal_physics = val || fallback;
    if (this.active_fractal) {
      this.active_fractal.dynamics = val || fallback;
    }
  }

  // --------------------------------------------------------------------------
  // Chronology & Session Accessors
  // --------------------------------------------------------------------------

  get story_id() {
    return this.#story_id;
  }
  set story_id(id) {
    this.#story_id = id;
    this.#story.active_id = id;
  }

  get active_story() {
    if (!this.#story_id) return null;
    return this.#story.by_id[this.#story_id] ?? this.#story.by_id[coerce_story_key(this.#story_id)] ?? null;
  }

  // --------------------------------------------------------------------------
  // Telemetry Ring Buffer Accessors & Mutators
  // --------------------------------------------------------------------------

  get director_p50_ms() {
    if (!this.director_ms_pool.length) return 0;
    const sorted = [...this.director_ms_pool].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.5)] || 0;
  }

  get director_p95_ms() {
    if (!this.director_ms_pool.length) return 0;
    const sorted = [...this.director_ms_pool].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * 0.95))] || 0;
  }

  /**
   * Records a director latency execution sample into the rolling ring buffer.
   * @param {number} ms
   */
  record_director_latency(ms) {
    const valid = Math.max(0, Number(ms) || 0);
    this.last_director_ms = valid;
    const next = [...this.director_ms_pool, valid];
    if (next.length > DIRECTOR_MS_POOL_CAP) {
      next.shift();
    }
    this.director_ms_pool = next;
  }

  // --------------------------------------------------------------------------
  // Generation Concurrency Mutex
  // --------------------------------------------------------------------------

  acquire_foreground_generation() {
    this.is_foreground_generating = true;
  }

  release_foreground_generation() {
    this.is_foreground_generating = false;
  }

  acquire_background_generation() {
    this.is_background_generating = true;
  }

  release_background_generation() {
    this.is_background_generating = false;
  }

  can_start_background_generation() {
    return !this.is_foreground_generating;
  }

  // --------------------------------------------------------------------------
  // Database Synchronization & Entity Persistence
  // --------------------------------------------------------------------------

  /**
   * Synchronizes runtime state with IndexedDB for the active or given story.
   * @param {string | number | null} [active_story_id]
   */
  async sync(active_story_id = null) {
    if (active_story_id) this.#story_id = String(active_story_id);

    const checkpoint = !this.#story_id ? load_session_checkpoint() : null;
    if (!this.#story_id) {
      if (checkpoint?.story_id) {
        this.#story_id = checkpoint.story_id;
      } else {
        try {
          const entry = await db.kv_settings.get(SESSION_ID_KEY);
          if (entry?.value) this.#story_id = entry.value;
          else return;
        } catch {
          return;
        }
      }
    }

    try {
      const db_key = coerce_story_key(this.#story_id);
      const story = await db.stories.get(db_key);
      if (!story) {
        clear_session_checkpoint();
        return;
      }

      if (session_driver?.restore_active) {
        session_driver.restore_active(String(this.#story_id));
      }

      if (story.round != null) this.round = story.round;
      if (typeof checkpoint?.round === "number" && checkpoint.round > (story.round ?? 0)) {
        this.round = checkpoint.round;
      }

      const [user_data, ai_data, fractal_data] = await Promise.all([
        /** @type {Promise<SimulationEntity | null>} */ (entities.get("character", story.user_id)),
        /** @type {Promise<SimulationEntity | null>} */ (entities.get("character", story.ai_id || "unknown_ai")),
        /** @type {Promise<SimulationEntity | null>} */ (entities.get("fractal", story.fractal_id)),
      ]);

      if (user_data) {
        Object.assign(this.character, user_data);
        this.character.id = user_data.id;
        this.active_user = this.character;
      }

      if (ai_data) {
        this.active_ai = ai_data;
        this.#ai_physics = story.ai_dynamics
          ? { ...story.ai_dynamics }
          : story.entity_snapshots?.ai?.dynamics
            ? { ...story.entity_snapshots.ai.dynamics }
            : { ...ai_data.dynamics };
      }

      if (fractal_data) {
        const effective_visual_style = story.visual_style || story.entity_snapshots?.fractal?.visual_style || fractal_data.visual_style;
        const effective_narrative_style = story.narrative_style || story.entity_snapshots?.fractal?.narrative_style || fractal_data.narrative_style;

        this.active_fractal = {
          ...fractal_data,
          ...(effective_visual_style ? { visual_style: effective_visual_style } : {}),
          ...(effective_narrative_style ? { narrative_style: effective_narrative_style } : {}),
        };
        this.#fractal_physics = story.fractal_dynamics
          ? { ...story.fractal_dynamics }
          : story.entity_snapshots?.fractal?.dynamics
            ? { ...story.entity_snapshots.fractal.dynamics }
            : { ...fractal_data.dynamics };
      }

      // Dynamics baselines
      if (story.entity_snapshots?.ai?.dynamics && this.active_ai) {
        this.active_ai.dynamics_baseline = { ...story.entity_snapshots.ai.dynamics };
      }
      if (story.entity_snapshots?.fractal?.dynamics && this.active_fractal) {
        this.active_fractal.dynamics_baseline = { ...story.entity_snapshots.fractal.dynamics };
      }

      // NPC World Cast hydration
      const npc_ids = Array.isArray(story.npc_ids) ? story.npc_ids : [];
      if (npc_ids.length) {
        const npc_list = (await Promise.all(npc_ids.map((nid) => entities.get("character", nid)))).filter(Boolean);
        this.#active_npcs = Object.fromEntries(npc_list.map((n) => [String(n.id), n]));
        const valid_npc_id_set = new SvelteSet(npc_list.map((n) => String(n.id)));
        if (Array.isArray(story.in_scene_npc_ids)) {
          this.#in_scene_npc_ids = story.in_scene_npc_ids.map(String).filter((id) => valid_npc_id_set.has(id));
        } else {
          this.#in_scene_npc_ids = npc_list.map((n) => String(n.id));
        }
      } else {
        this.#active_npcs = {};
        this.#in_scene_npc_ids = [];
      }

      // Sync selections to app store
      app.selected_ai = this.active_ai;
      app.selected_user = this.active_user;
      app.selected_fractal = this.active_fractal;

      // Story title decomposition
      apply_story_title(story, this.active_ai, this.active_user, this.active_fractal);

      this.#story.by_id[db_key] = story;
      if (String(db_key) !== String(this.#story_id)) {
        this.#story.by_id[this.#story_id] = story;
      }

      this.is_ready = true;
      clear_session_checkpoint();
    } catch (err) {
      console.warn("[Data] Sync Failed:", err);
    }
  }

  /**
   * Re-asserts the active story's title into the shared app store.
   * The storyboard owns `app.story_title` while it is mounted (it previews the
   * draft title from the current slot selections), so entering storymode must
   * restore the authoritative story title — otherwise a transient storyboard
   * mount during boot leaves the lobby placeholder as the prologue header.
   */
  restore_story_title() {
    if (!this.#story_id) return;
    const story = this.#story.by_id[this.#story_id] ?? this.#story.by_id[coerce_story_key(this.#story_id)] ?? null;
    apply_story_title(story, this.active_ai, this.active_user, this.active_fractal);
  }

  /**
   * Persists story round and dynamics state to IndexedDB.
   * @param {number | null} [round]
   */
  async save(round = null) {
    if (!this.#story_id) return;
    try {
      const target_round = typeof round === "number" ? round : this.round;
      await db.stories.update(coerce_story_key(this.#story_id), {
        round: target_round,
        last_played: Date.now(),
        updated_at: Date.now(),
        ai_dynamics: $state.snapshot(this.#ai_physics),
        fractal_dynamics: $state.snapshot(this.#fractal_physics),
      });
      app.stories_version++;
    } catch (err) {
      console.error("[Data] Story Save Failed:", err);
    }
  }

  /**
   * Upserts an entity in persistence and syncs reactive references.
   * @param {'character' | 'fractal'} type
   * @param {SimulationEntity} entity
   */
  async save_entity(type, entity) {
    try {
      await entities.upsert(type, entity);
      if (this.character && this.character.id === entity.id) {
        Object.assign(this.character, entity);
      }
      if (this.active_ai?.id === entity.id) {
        Object.assign(this.active_ai, entity);
      }
      if (this.active_user?.id === entity.id) {
        Object.assign(this.active_user, entity);
      }
      if (this.active_fractal?.id === entity.id) {
        Object.assign(this.active_fractal, entity);
      }
      if (this.#active_npcs[entity.id]) {
        this.#active_npcs[entity.id] = entity;
      }
    } catch (err) {
      console.error("[Data] Entity Save Failed:", err);
      throw err;
    }
  }

  /**
   * Updates an entity or story in persistence and syncs reactive memory.
   * @param {'character' | 'fractal' | 'story'} type
   * @param {string | number} id
   * @param {Record<string, any>} data
   */
  async update_entity(type, id, data) {
    try {
      if (type === "story") {
        await db.stories.update(coerce_story_key(id), data);
        app.stories_version++;
        if (this.#story_id === id) {
          Object.assign(this.#story.by_id[id] || {}, data);
        }
      } else {
        const payload = { ...data, updated_at: Date.now() };
        await entities.update(type, String(id), payload);
        const targets = [...new SvelteSet([this.character, this.active_user, this.active_ai, this.active_fractal])];
        targets.forEach((t) => {
          if (t && t.id === id) Object.assign(t, payload);
        });
        if (this.#active_npcs[id]) {
          this.#active_npcs[id] = { ...this.#active_npcs[id], ...payload };
        }
      }
    } catch (err) {
      console.error(`[Data] Update Entity (${type}) Failed:`, err);
    }
  }

  /**
   * Deletes an entity from persistence and clears active runtime references.
   * @param {'character' | 'fractal'} type
   * @param {string | number} id
   */
  async delete_entity(type, id) {
    try {
      await entities.remove(type, String(id));

      if (type === "character") {
        if (this.active_ai?.id === id) this.active_ai = null;
        if (this.active_user?.id === id) {
          this.active_user = null;
          Object.assign(this.character, create_unlinked_entity());
        }
      } else {
        if (this.active_fractal?.id === id) this.active_fractal = null;
      }

      if (this.#active_npcs[id]) {
        const next_npcs = { ...this.#active_npcs };
        delete next_npcs[id];
        this.#active_npcs = next_npcs;
        this.#in_scene_npc_ids = this.#in_scene_npc_ids.filter((x) => x !== String(id));
      }
    } catch (err) {
      console.error("[Data] Entity Delete Failed:", err);
      throw err;
    }
  }

  /**
   * Debug and test helper for injecting mocked entity kernels.
   * @param {Object} mock_data
   * @param {SimulationEntity} [mock_data.user]
   * @param {SimulationEntity} [mock_data.ai]
   * @param {SimulationEntity} [mock_data.fractal]
   */
  _debug_inject(mock_data) {
    if (mock_data.user) {
      this.active_user = mock_data.user;
      app.selected_user = mock_data.user;
    }
    if (mock_data.ai) {
      this.active_ai = mock_data.ai;
      app.selected_ai = mock_data.ai;
    }
    if (mock_data.fractal) {
      this.active_fractal = mock_data.fractal;
      app.selected_fractal = mock_data.fractal;
    }
    this.is_ready = true;
  }
}

// ============================================================================
// [SECTION 4: SINGLETON EXPORT & BROWSER BRIDGE]
// ============================================================================

export const runtime = new RuntimeEngineStore();

if (typeof window !== "undefined") {
  window.runtime = runtime;
  runtime.init_effects();
}

/**
 * CHANGELOG:
 * - 2026-09-24: Refactored `create_runtime_store()` into idiomatic Svelte 5 `RuntimeEngineStore` class, eliminating closure getters/setters in favor of direct `$state` fields while preserving 100% API compatibility.
 * - 2026-09-24: Extracted `apply_story_title` and added `restore_story_title()` so entering storymode re-asserts the
 *   active story's authoritative title — a transient storyboard mount during boot was leaving "Your story begins here..."
 *   as the prologue header. Also reasserted at the end of `sync()` via the shared helper.
 * - 2026-09-16: Added support for explicit story.in_scene_npc_ids during story load, preventing un-staged NPCs from flooding in_scene_npc_ids.
 * - 2026-08-29: Applied /harmonize protocol: added Universal File Architecture header block,
 *   structured section dividers, exported DIRECTOR_MS_POOL_CAP constant, cleaned up unlinked
 *   entity blueprint reset in delete_entity, and verified 100% test pass.
 * - 2026-08-16: Added Director Quick Shot latency telemetry pool (p50/p95) and Generation Mutex.
 * - 2026-06-15: Added NPC world cast and Stage Spotlight state hydration.
 */
