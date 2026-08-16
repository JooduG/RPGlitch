import { db, entities, coerce_story_key, session_driver, SESSION_ID_KEY } from "@data";
import { load_session_checkpoint, clear_session_checkpoint } from "@platform";
import { app } from "./app.svelte.js";
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
 * @property {string} future
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
function create_runtime_store() {
  /** @type {SimulationEntity} */
  let character_state = $state({
    id: null,
    name: "Unlinked",
    description: "No data stream connected.",
    eternal: { non_physical: "", physical: "" },
    present: { non_physical: "", physical: "" },
    future: "",
    past: [],
    dynamics: { chaos: 50, intensity: 50, openness: 50, affinity: 50 },
    voice: { rate: 1.0 },
    profile_picture: null,
    signature_color: "",
    modifiers: {
      prompt: "",
      flipped: false,
      profile_picture_seed: 0,
      last_generated_seed: null,
    },
  });

  /** @type {SimulationEntity | null} */
  let active_user_state = $state(null);
  /** @type {SimulationEntity | null} */
  let active_ai_state = $state(null);
  /** @type {SimulationEntity | null} */
  let active_fractal_state = $state(null);
  // NPC WORLD CAST — secondary characters scoped to the active story.
  // `active_npcs` maps id → hydrated entity; `in_scene_npc_ids` is the Stage
  // Spotlight (which NPCs are physically present, driving 1.3x memory salience).
  /** @type {Record<string, any>} */
  let active_npcs_state = $state({});
  /** @type {string[]} */
  let in_scene_npc_ids_state = $state([]);
  // Identity of the entity whose turn is streaming right now (NPC id for
  // speaker-delegated turns; read by app.start_stream for voice routing).
  /** @type {string | null} */
  let streaming_entity_id_state = $state(null);

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
  // 🖼️ Image Trigger Engine: round of the last auto-triggered image beat.
  // Shared cooldown state between the pure-JS dynamics gate and the LLM director.
  // -1 = never triggered sentinel; real round-0 (prologue) triggers must not collide
  // with the sentinel or the cooldown gate stays permanently open.
  let last_auto_image_round = $state(-1);

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
    /** Non-reactive snapshots of the NPC world cast + stage spotlight. */
    get snapshot_npcs() {
      return Object.fromEntries(Object.entries(active_npcs_state).map(([id, e]) => [id, $state.snapshot(e)]));
    },
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
    get last_auto_image_round() {
      return last_auto_image_round;
    },
    set last_auto_image_round(val) {
      last_auto_image_round = val;
    },
    get active_story() {
      if (!simulation_story_id) return null;
      // Normalize the lookup key to match however sync() stored it
      return simulation_story.by_id[simulation_story_id] ?? simulation_story.by_id[coerce_story_key(simulation_story_id)] ?? null;
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
      const line = String(text || "").trim();
      if (!line) return;
      // FUTURE is a consolidated prose field (not a vector pool) — append a line.
      const existing = String(entity.future || "").trim();
      entity.future = existing ? (is_vanguard ? `${line}\n${existing}` : `${existing}\n${line}`) : line;
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
      if (!entity) return;
      // FUTURE is a consolidated prose field — "completing" it drops the most
      // recent agenda line (the forge rewrites the rest on the next cycle).
      const lines = String(entity.future || "")
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      lines.pop();
      entity.future = lines.join("\n");
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
      // A reload checkpoint (written during a graceful Dexie versionchange) is
      // the freshest active-session pointer; fall back to kv_settings otherwise.
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
        // FIX: restore the story's persisted round so recency epochs stay aligned
        // across page loads (previously runtime round reset to 0 on every boot).
        if (story.round != null) api.round = story.round;
        // A versionchange checkpoint may hold a round newer than the story's
        // last persisted write; prefer it when it is ahead.
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
        // Stamp dynamics_baseline from the story snapshot.
        // This gives the physics engine a per-character gravitational center
        // rather than the universal 50 fallback.
        if (story.entity_snapshots?.ai?.dynamics && active_ai_state) {
          active_ai_state.dynamics_baseline = { ...story.entity_snapshots.ai.dynamics };
        }
        if (story.entity_snapshots?.fractal?.dynamics && active_fractal_state) {
          active_fractal_state.dynamics_baseline = { ...story.entity_snapshots.fractal.dynamics };
        }

        // NPC WORLD CAST — hydrate the story's secondary characters so the
        // Director's <WORLD_CAST>/<SCENE_ROSTER> and the NPC speaker engine can
        // reference them. All cast members start ON-STAGE; the Director moves
        // them off via `in_scene_change.exit` each turn.
        const npc_ids = Array.isArray(story.npc_ids) ? story.npc_ids : [];
        if (npc_ids.length) {
          const npc_list = (await Promise.all(npc_ids.map((nid) => entities.get("character", nid)))).filter(Boolean);
          active_npcs_state = Object.fromEntries(npc_list.map((n) => [String(n.id), n]));
          in_scene_npc_ids_state = npc_list.map((n) => String(n.id));
        } else {
          active_npcs_state = {};
          in_scene_npc_ids_state = [];
        }

        // Synchronize app selections for UI consistency in storymode
        app.selected_ai = active_ai_state;
        app.selected_user = active_user_state;
        app.selected_fractal = active_fractal_state;

        // Store the story object in the by_id map so active_story getter works.
        // Key with the coerced numeric key to match how DB stores it.
        simulation_story.by_id[db_key] = story;
        // Also index by the original string form if different, to cover all lookup paths.
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
     * Synchronizes the runtime state with the database.
     * @param {number|null} [round]
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
     * @param {'character' | 'fractal'} type
     * @param {SimulationEntity} entity
     */
    save_entity: async (type, entity) => {
      try {
        await entities.upsert(type, entity);
        // Sync all active runtime states that match this entity ID
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
     * @param {'character' | 'fractal' | 'story'} type
     * @param {string | number} id
     * @param {any} data
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
          // Add updated_at if not present for consistency
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
     * @param {'character' | 'fractal'} type
     * @param {string | number} id
     */
    delete_entity: async (type, id) => {
      try {
        await entities.remove(type, String(id));

        // Clear active runtime state if the deleted entity was active
        if (type === "character") {
          if (active_ai_state?.id === id) active_ai_state = null;
          if (active_user_state?.id === id) {
            active_user_state = null;
            Object.assign(character_state, {
              id: null,
              name: "Unlinked",
              description: "No data stream connected.",
              eternal: { non_physical: "", physical: "" },
              present: { non_physical: "", physical: "" },
              future: [],
              past: [],
              dynamics: { chaos: 50, intensity: 50, openness: 50, affinity: 50 },
            });
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
export const runtime = create_runtime_store();
if (typeof window !== "undefined") {
  window.runtime = runtime;
  runtime.init_effects();
}
