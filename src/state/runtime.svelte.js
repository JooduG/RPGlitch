/**
 * src/state/runtime.svelte.js
 * ⚡ RUNTIME ENGINE STORE: Reactive Simulation State & Entity Kernel
 * (Rank 3, state)
 *
 * Core Responsibilities:
 * - Owns the reactive Svelte 5 Runes representing active simulation state:
 *   - Active Entities: `character` (User Persona), `active_user`, `active_ai`, `active_fractal`.
 *   - NPC World Cast: `active_npcs` (hydrated records; each carries
 *     `presence: 'active' | 'nearby' | 'dormant'` - the Stage Spotlight).
 *   - Live Physics & Dynamics: `ai_physics`, `fractal_physics`, and per-entity dynamic baselines.
 *   - Macro Chronology: `story_id`, `round`, `turn_type`, and `is_ready` flags.
 *   - Generation Concurrency Mutex: `is_foreground_generating` vs `is_background_generating`.
 *   - Telemetry Ring Buffer: Director turn latency tracking (`last_director_ms`, `p50`, `p95`).
 * - Manages bi-directional synchronization with IndexedDB persistence via `@data` repositories.
 * - Manages reactive auto-save effect root (`init_effects`, `teardown_effects`).
 * - Imports sibling state stores directly (`app`, `chat`) — no callback bridge.
 *
 * Dependencies & Layer Boundaries:
 * - `@data`: `db`, `entities`, checkpoints, session driver persistence.
 * - `./app.svelte.js`: `app` (selection synchronization, story title decomposition).
 * - `./chat.svelte.js`: `session_driver` (active session pointer).
 *
 * ============================================================================
 */

import { TELEMETRY_CAPS } from "@config";
import { clear_session_checkpoint, coerce_story_key, db, entities, load_session_checkpoint, SESSION_ID_KEY } from "@data";
import { default_dynamics_for_scope } from "@definitions";
import { get_signature_color } from "@media";
import { decompose_story_title } from "@simulation";
import { app } from "./app.svelte.js";
import { session_driver } from "./chat.svelte.js";
import { SvelteSet } from "svelte/reactivity";

// ============================================================================
// [SECTION 1: JSDOC SCHEMAS & TYPE DEFINITIONS]
// ============================================================================

/**
 * @typedef {Object} TemporalVector
 * @property {string} id
 * @property {number} timestamp
 * @property {string} content
 * @property {Float32Array | null} [embedding]
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
// [SECTION 2: RUNTIME STORE FACTORY]
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
  if (!story?.title || !app) return;
  app.story_title = story.title;
  app.story_title_parts = decompose_story_title(story.title, { ai, user, fractal, get_color: get_signature_color });
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
  /** @type {SimulationEntity | null} */
  active_user = $state(null);
  /** @type {SimulationEntity | null} */
  active_ai = $state(null);
  /** @type {SimulationEntity | null} */
  active_fractal = $state(null);

  // --- NPC World Cast & Stage Spotlight (Track 1.3: presence enum owns staging) ---
  /** @type {Record<string, any>} */
  #active_npcs = $state({});

  // --- Chronology & Session State ---
  // Single source of truth for the active story pointer is session_driver
  // (session_driver.active_id); this store keeps only the row cache below.
  is_ready = $state(false);
  /** @type {{ by_id: Record<string, any> }} */
  #story = $state({ by_id: {} });
  round = $state(0);
  turn_type = $state("USER_TURN");

  // --- Dynamics & Live Physics ---
  /** @type {EntityDynamics | null} */
  #ai_physics = $state(null);
  /** @type {EntityDynamics | null} */
  #fractal_physics = $state(null);
  last_director_beat_round = $state(-1);
  last_dynamics_beat_round = $state(-1);

  // --- Director turn telemetry ---
  last_director_ms = $state(0);
  /** @type {number[]} */
  director_ms_pool = $state([]);

  // --- Simulation Stability & Caretaker-turn telemetry ---
  /** @type {number} */
  structural_errors = $state(0);
  /** @type {number} */
  back_shot_cursor = $state(0);

  // --- Scene Momentum & Stagnation Backstop (Track 4) ---
  /** @type {number} */
  stagnation_turns = $state(0);
  /** @type {number} */
  last_semantic_drift = $state(1.0);

  // --- Prompt Token Budget & Cliff Telemetry (Track 9 / 5.5) ---
  /** @type {any} */
  last_prompt_token_snapshot = $state(null);
  /** @type {Record<string, any>} */
  prompt_snapshots_by_mode = $state({});

  // --- Generation Concurrency Mutex ---
  is_foreground_generating = $state(false);
  is_background_generating = $state(false);

  // --- Lifecycle Teardown Handle ---
  /** @type {(() => void) | null} */
  #runtime_cleanup = null;

  // --------------------------------------------------------------------------
  // Lifecycle & Effects
  // --------------------------------------------------------------------------

  /**
   * Held while sync() hydrates state so the trailing is_ready flip does not
   * trigger a redundant writeback of the row that was just read.
   * @type {boolean} */
  #auto_save_suspended = false;

  init_effects() {
    if (this.#runtime_cleanup) return;
    this.#runtime_cleanup = $effect.root(() => {
      $effect(() => {
        const _round = this.round;
        const _ai = this.#ai_physics;
        const _fractal = this.#fractal_physics;
        const _director_beat = this.last_director_beat_round;
        const _dynamics_beat = this.last_dynamics_beat_round;
        const _stagnation_turns = this.stagnation_turns;
        const _last_drift = this.last_semantic_drift;
        if (this.is_ready && !this.#auto_save_suspended && session_driver?.active_id) {
          this.#persist_story_snapshot(_round).catch((err) => console.error("[Data] Auto-save failed:", err));
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
    return { AI: $state.snapshot(this.active_ai), USER: $state.snapshot(this.active_user), FRACTAL: $state.snapshot(this.active_fractal) };
  }

  /** Non-reactive snapshot of the hydrated NPC world cast. */
  get snapshot_npcs() {
    return Object.fromEntries(Object.entries(this.#active_npcs).map(([id, e]) => [id, $state.snapshot(e)]));
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

  // --------------------------------------------------------------------------
  // Dynamics & Physics Accessors
  // --------------------------------------------------------------------------

  get ai() {
    return this.#ai_physics;
  }
  set ai(val) {
    const fallback = default_dynamics_for_scope("somatic");
    this.#ai_physics = val || fallback;
    if (this.active_ai) {
      this.active_ai.dynamics = val || fallback;
    }
  }

  get fractal() {
    return this.#fractal_physics;
  }
  set fractal(val) {
    const fallback = default_dynamics_for_scope("fractal");
    this.#fractal_physics = val || fallback;
    if (this.active_fractal) {
      this.active_fractal.dynamics = val || fallback;
    }
  }

  // --------------------------------------------------------------------------
  // Chronology & Session Accessors
  // --------------------------------------------------------------------------

  get story_id() {
    // Single source of truth: session_driver owns the active pointer (RAM +
    // kv_settings persistence). This getter is a pure derived view — all
    // switches flow through set_active / restore_active / clear_active.
    return session_driver?.active_id ?? null;
  }
  set story_id(id) {
    // Sync RAM-only mirror for contexts that assign the pointer directly
    // (tests, boot restore). Durable switches use set_active/clear_active.
    try {
      session_driver?.restore_active?.(id);
    } catch {
      /* driver remains readable directly */
    }
  }

  get active_story() {
    const active_id = session_driver?.active_id ?? null;
    if (active_id == null) return null;
    return this.#story.by_id[active_id] ?? this.#story.by_id[coerce_story_key(active_id)] ?? null;
  }

  // --------------------------------------------------------------------------
  // Telemetry Ring Buffer Accessors & Mutators
  // --------------------------------------------------------------------------

  /**
   * Shared percentile reader over the director latency ring buffer.
   * @param {number} p - Quantile in [0, 1].
   */
  #percentile(p) {
    if (!this.director_ms_pool.length) return 0;
    const sorted = [...this.director_ms_pool].sort((a, b) => a - b);
    return sorted[Math.min(sorted.length - 1, Math.floor(sorted.length * p))] || 0;
  }

  get director_p50_ms() {
    return this.#percentile(0.5);
  }

  get director_p95_ms() {
    return this.#percentile(0.95);
  }

  /**
   * Records a director latency execution sample into the rolling ring buffer.
   * @param {number} ms
   */
  record_director_latency(ms) {
    const valid = Math.max(0, Number(ms) || 0);
    this.last_director_ms = valid;
    const next = [...this.director_ms_pool, valid];
    if (next.length > TELEMETRY_CAPS.DIRECTOR_LATENCY_POOL) {
      next.shift();
    }
    this.director_ms_pool = next;
  }

  /**
   * Records a turn's semantic drift and updates the stagnation counter.
   * Increments stagnation_turns when drift < 0.15; resets to 0 otherwise.
   * @param {number} drift - Semantic drift score in [0.0, 1.0]
   */
  record_turn_drift(drift) {
    const valid_drift = Math.max(0.0, Math.min(1.0, Number(drift) || 0.0));
    this.last_semantic_drift = valid_drift;
    if (valid_drift < 0.15) {
      this.stagnation_turns += 1;
    } else {
      this.stagnation_turns = 0;
    }
  }

  // --------------------------------------------------------------------------
  // Database Synchronization & Entity Persistence
  // --------------------------------------------------------------------------

  /**
   * Synchronizes runtime state with IndexedDB for the active or given story.
   * @param {string | number | null} [active_story_id]
   */
  async sync(active_story_id = null) {
    this.#auto_save_suspended = true;
    try {
      let resolved_id = active_story_id ? String(active_story_id) : (session_driver?.active_id ?? null);

      const checkpoint = !resolved_id ? load_session_checkpoint() : null;
      if (!resolved_id) {
        if (checkpoint?.story_id) {
          resolved_id = checkpoint.story_id;
        } else {
          try {
            const entry = await db.kv_settings.get(SESSION_ID_KEY);
            if (entry?.value) resolved_id = entry.value;
            else return;
          } catch {
            return;
          }
        }
      }

      // Publish the resolved pointer through its single owner before loading.
      session_driver?.restore_active?.(String(resolved_id));
      const active_id = session_driver?.active_id ?? String(resolved_id);

      try {
        const db_key = coerce_story_key(active_id);
        const story = await db.stories.get(db_key);
        if (!story) {
          clear_session_checkpoint();
          return;
        }

        if (story.round != null) this.round = story.round;
        if (typeof checkpoint?.round === "number" && checkpoint.round > (story.round ?? 0)) {
          this.round = checkpoint.round;
        }
        this.last_director_beat_round = typeof story.last_director_beat_round === "number" ? story.last_director_beat_round : -1;
        this.last_dynamics_beat_round = typeof story.last_dynamics_beat_round === "number" ? story.last_dynamics_beat_round : -1;
        this.stagnation_turns = typeof story.stagnation_turns === "number" ? story.stagnation_turns : 0;
        this.last_semantic_drift = typeof story.last_semantic_drift === "number" ? story.last_semantic_drift : 1.0;

        const [user_data, ai_data, fractal_data] = await Promise.all([
          /** @type {Promise<SimulationEntity | null>} */ (entities.get("character", story.user_id)),
          /** @type {Promise<SimulationEntity | null>} */ (entities.get("character", story.ai_id || "unknown_ai")),
          /** @type {Promise<SimulationEntity | null>} */ (entities.get("fractal", story.fractal_id)),
        ]);

        if (user_data) {
          this.active_user = { ...user_data };
        }

        if (ai_data) {
          this.active_ai = ai_data;
          this.#ai_physics =
            story.ai_dynamics ? { ...story.ai_dynamics }
            : story.entity_snapshots?.ai?.dynamics ? { ...story.entity_snapshots.ai.dynamics }
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
          this.#fractal_physics =
            story.fractal_dynamics ? { ...story.fractal_dynamics }
            : story.entity_snapshots?.fractal?.dynamics ? { ...story.entity_snapshots.fractal.dynamics }
            : { ...fractal_data.dynamics };
        }

        // Dynamics baselines
        if (story.entity_snapshots?.ai?.dynamics && this.active_ai) {
          this.active_ai.dynamics_baseline = { ...story.entity_snapshots.ai.dynamics };
        }
        if (story.entity_snapshots?.fractal?.dynamics && this.active_fractal) {
          this.active_fractal.dynamics_baseline = { ...story.entity_snapshots.fractal.dynamics };
        }

        // NPC World Cast hydration (Track 1.3: presence enum owns staging)
        const npc_ids = Array.isArray(story.npc_ids) ? story.npc_ids : [];
        if (npc_ids.length) {
          const npc_list = (await Promise.all(npc_ids.map((nid) => entities.get("character", nid)))).filter(Boolean);
          this.#active_npcs = Object.fromEntries(npc_list.map((n) => [String(n.id), { ...n, presence: "active" }]));
        } else {
          this.#active_npcs = {};
        }

        // Sync selections to app store
        if (app) {
          app.selected_ai = this.active_ai;
          app.selected_user = this.active_user;
          app.selected_fractal = this.active_fractal;
        }

        // Story title decomposition
        apply_story_title(story, this.active_ai, this.active_user, this.active_fractal);

        this.#story.by_id[db_key] = story;
        if (String(db_key) !== String(active_id)) {
          this.#story.by_id[active_id] = story;
        }

        this.is_ready = true;
        clear_session_checkpoint();
      } catch (err) {
        console.warn("[Data] Sync Failed:", err);
      }
    } finally {
      this.#auto_save_suspended = false;
    }
  }

  /**
   * Re-asserts the active story's title into the shared app store.
   * The storyboard owns `app.story_title` while it is mounted (it previews the
   * draft title from the current slot selections), so entering storymode must
   * restore the authoritative story title - otherwise a transient storyboard
   * mount during boot leaves the lobby placeholder as the prologue header.
   */
  restore_story_title() {
    const active_id = session_driver?.active_id ?? null;
    if (active_id == null) return;
    const story = this.#story.by_id[active_id] ?? this.#story.by_id[coerce_story_key(active_id)] ?? null;
    apply_story_title(story, this.active_ai, this.active_user, this.active_fractal);
  }

  /**
   * Resets story title and parts on app store to prevent title bleed across stories.
   */
  reset_story_title() {
    if (!app) return;
    app.story_title = "";
    app.story_title_parts = [];
  }

  /**
   * Persists story round and dynamics state to IndexedDB.
   * @param {number | null} [round]
   */
  /**
   * Single shared story-snapshot writer: the reactive auto-save effect and
   * explicit save() both persist through here so the row shape can't drift.
   * @param {number} target_round
   * @returns {Promise<boolean>} false when no story is loaded
   */
  async #persist_story_snapshot(target_round) {
    const active_id = session_driver?.active_id ?? null;
    if (active_id == null) return false;
    await db.stories.update(coerce_story_key(active_id), {
      round: target_round,
      last_played: Date.now(),
      updated_at: Date.now(),
      ai_dynamics: $state.snapshot(this.#ai_physics),
      fractal_dynamics: $state.snapshot(this.#fractal_physics),
      last_director_beat_round: this.last_director_beat_round,
      last_dynamics_beat_round: this.last_dynamics_beat_round,
      stagnation_turns: this.stagnation_turns,
      last_semantic_drift: this.last_semantic_drift,
    });
    return true;
  }

  async save(round = null) {
    if (session_driver?.active_id == null) return;
    try {
      const target_round = typeof round === "number" ? round : this.round;
      const wrote = await this.#persist_story_snapshot(target_round);
      if (!wrote) return;
      if (app) app.stories_version++;
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
      const entity_payload = $state.snapshot(entity);
      await entities.upsert(type, entity_payload);
      if (this.active_ai?.id === entity.id) {
        Object.assign(this.active_ai, entity);
      }
      if (this.active_user?.id === entity.id) {
        Object.assign(this.active_user, entity);
      }
      if (this.active_fractal?.id === entity.id) {
        Object.assign(this.active_fractal, entity);
      }
      if (this.#active_npcs[String(entity.id)]) {
        this.#active_npcs[String(entity.id)] = entity;
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
        if (app) app.stories_version++;
        if (session_driver?.active_id != null && String(session_driver.active_id) === String(id)) {
          for (const key of [id, coerce_story_key(id)]) {
            if (this.#story.by_id[key] != null) Object.assign(this.#story.by_id[key], data);
          }
        }
      } else {
        let unproxied_data = data;
        try {
          unproxied_data = $state.snapshot(data);
        } catch {
          unproxied_data = data;
        }
        const payload = { ...unproxied_data, updated_at: Date.now() };
        await entities.update(type, String(id), payload);
        const targets = [...new SvelteSet([this.active_user, this.active_ai, this.active_fractal])];
        targets.forEach((t) => {
          if (t && t.id === id) Object.assign(t, payload);
        });
        if (this.#active_npcs[String(id)]) {
          this.#active_npcs[String(id)] = { ...this.#active_npcs[String(id)], ...payload };
        }
        if (payload.dynamics) {
          if (this.active_ai && id === this.active_ai.id) {
            this.#ai_physics = { ...this.#ai_physics, ...payload.dynamics };
          } else if (this.active_fractal && id === this.active_fractal.id) {
            this.#fractal_physics = { ...this.#fractal_physics, ...payload.dynamics };
          }
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
        }
      } else {
        if (this.active_fractal?.id === id) this.active_fractal = null;
      }

      if (this.#active_npcs[String(id)]) {
        const next_npcs = { ...this.#active_npcs };
        delete next_npcs[String(id)];
        this.#active_npcs = next_npcs;
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
      if (app) app.selected_user = mock_data.user;
    }
    if (mock_data.ai) {
      this.active_ai = mock_data.ai;
      if (app) app.selected_ai = mock_data.ai;
    }
    if (mock_data.fractal) {
      this.active_fractal = mock_data.fractal;
      if (app) app.selected_fractal = mock_data.fractal;
    }
    if (mock_data.structural_errors !== undefined) {
      this.structural_errors = mock_data.structural_errors;
    }
    if (mock_data.back_shot_cursor !== undefined) {
      this.back_shot_cursor = mock_data.back_shot_cursor;
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
