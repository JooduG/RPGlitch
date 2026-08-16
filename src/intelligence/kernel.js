/**
 * @file src/intelligence/kernel.js
 * -----------------------------------------------------------------------------
 * gamemaster — The Intelligence Kernel Coordinator
 * -----------------------------------------------------------------------------
 * Unifies the Intelligence Kernel (Broker, Dynamics, Builder) and the
 * Transport Layer (llm_service) into a single execution pipeline.
 */

import { db, entities, stories, detox_prose } from "@data";
import { generate_uuid as generateUUID, create_job_queue, state_bridge } from "@utils";
import { visual_engine, resolve_image_trigger, fire_image_trigger, sweep_stale_ghosts, IMAGE_RESOLVE_TIMEOUT_MS } from "@media";
import {
  strip_cognition_blocks,
} from "./parser.js";
import { llm_service, looks_truncated, security, raw_to_text, raw_stop_reason } from "@platform";
import { context_builder } from "./context.js";
import { dynamics_engine, compute_deltas } from "./dynamics.js";
import { normalize_director_data, parse_director_json, resolve_speaker_engine, terse_director_task, synthesize_director_fallback, scrub_state_mutations } from "./director.js";
import { prompt_builder } from "./prompts.js";
import { build_update_entry, build_retrieval } from "./telemetry.js";
import { prune, temporal_engine } from "./temporal.js";

/**
 * @typedef {import('@engine/kernel.js').GenerationOptions} GenerationOptions
 */

// 🔀 Director background job queue — parallel auxiliary workers (ghost sweeps
// now; Memory Forge / visual synthesis / Dexie checkpoint sync later) execute
// concurrently and are isolated from the critical narrative path: a failing
// worker rejects only its own promise and can never stall story playback.
const director_background_queue = create_job_queue({ max_concurrency: 2 });


/** Completion directive appended to the character prompt when a reply was truncated. */
const TRUNCATION_COMPLETE_NOTE =
  "\n\nIMPORTANT: Your previous reply was cut off mid-sentence. Finish this response IMMEDIATELY: do not repeat any earlier text, do not rehash events, just bring the current moment to a natural close with a complete sentence, then stop.";

/**
 * Minimum narrative length (beyond think blocks) before a missing sentence-ending
 * punctuation is treated as a genuine mid-sentence cutoff. Short unpunctuated
 * beats ("She nods", "Wait") are legitimate endings; real token-budget
 * truncations are always long, rambling replies cut mid-flow.
 */
const TRUNCATION_MIN_PROSE = 40;

/**
 * Closes out a truncated reply in-character so the narrative never ends mid-sentence.
 * @param {string} text
 * @param {string} character_name
 * @returns {string}
 */
function force_close_response(text, character_name) {
  const t = String(text || "").trimEnd();
  if (!t) return t;
  return `${t}\n\n${character_name} goes quiet, the moment settling around ${character_name === "AI" ? "them" : "it"} like dust.`;
}

/**
 * Drops `</think>` closing tags that appear while no think block is open
 * (e.g. a model that re-closes the block after the narrative has started).
 * @param {string} text
 * @returns {string}
 */
function strip_unmatched_think_closures(text) {
  if (!text) return text;
  const segments = text.split(/(<\/think>|<think>)/i);
  let in_think = false;
  const kept = [];
  for (const segment of segments) {
    if (/^<think>$/i.test(segment)) {
      in_think = true;
      kept.push(segment);
    } else if (/^<\/think>$/i.test(segment)) {
      if (in_think) {
        in_think = false;
        kept.push(segment);
      }
    } else {
      kept.push(segment);
    }
  }
  return kept.join("");
}

/**
 * Synchronous post-turn validation and repair layer.
 * Automatically closes truncated `<think>` blocks and strips Chinese characters from narrative prose
 * without removing spaces or corrupting sentence formatting.
 * @param {string} response
 * @returns {{ text: string; violated: boolean; refused: boolean; structural_repair: boolean }}
 */
function validate_and_repair_response(response) {
  const result = { text: response || "", violated: false, refused: false, structural_repair: false };

  if (security.check_refusal(response)) {
    result.refused = true;
    return result;
  }

  try {
    let text = result.text;

    // 1. Tag Closure Pass
    const think_openers = (text.match(/<think>/gi) || []).length;
    const think_closers = (text.match(/<\/think>/gi) || []).length;
    if (think_openers > think_closers) {
      text += "</think>";
      result.structural_repair = true;
    } else if (think_closers > think_openers) {
      // Stray re-closures after the think block already closed (e.g. "...prose.</think>").
      text = strip_unmatched_think_closures(text);
      result.structural_repair = true;
    }

    // 2. Chinese Bleed Parsing: Isolate narrative prose from think blocks
    const split_regex = /(<\/think>|<think>)/i;
    const segments = text.split(split_regex);

    let in_think_block = false;
    const processed_segments = segments.map((segment) => {
      const lower = segment.toLowerCase();
      if (lower === "<think>") {
        in_think_block = true;
        return segment;
      }
      if (lower === "</think>") {
        in_think_block = false;
        return segment;
      }

      if (in_think_block) {
        return segment;
      }

      const chinese_range = /[\u4e00-\u9fa5]/g;
      if (chinese_range.test(segment)) {
        result.violated = true;
        return segment.replace(chinese_range, "");
      }
      return segment;
    });

    if (result.violated) {
      state_bridge.app.log("SINO_LOGIC bleed intercepted", "warn");
    }

    result.text = processed_segments.join("");
  } catch (err) {
    console.warn("[GameMaster] Validation check failed:", err);
    result.text = response || "";
    result.violated = false;
  }
  return result;
}





export const gamemaster = {
  /**
   * CAPTURE DYNAMICS DELTA
   * Detects changes in entity dynamics and logs a telemetry entry.
   * @param {any} snapshot
   * @param {any} [meta]
   */
  async capture_dynamics_delta(snapshot, meta = null) {
    const deltas = [];
    const log_strings = [];

    if (snapshot.ai?.dynamics) {
      compute_deltas("ai", snapshot.ai.dynamics, state_bridge.runtime.ai, deltas, log_strings);
      if (state_bridge.runtime.active_ai?.id) {
        await state_bridge.runtime.update_entity("character", state_bridge.runtime.active_ai.id, {
          dynamics: { ...snapshot.ai.dynamics },
        });
      }
    }

    if (snapshot.fractal?.dynamics) {
      compute_deltas("fractal", snapshot.fractal.dynamics, state_bridge.runtime.fractal, deltas, log_strings);
      if (state_bridge.runtime.active_fractal?.id) {
        await state_bridge.runtime.update_entity("fractal", state_bridge.runtime.active_fractal.id, {
          dynamics: { ...snapshot.fractal.dynamics },
        });
      }
    }

    if (deltas.length > 0 || meta) {
      const mutations = meta?.mutations || {};
      const retrieval = build_retrieval(meta?.vectors);
      const dynamics_for = (target) =>
        deltas.filter((d) => d.target === target).map(({ axis, old_value, new_value, diff }) => ({ axis, old_value, new_value, diff }));

      const updates = {};

      const ai_entry = build_update_entry(
        snapshot.ai?.name || state_bridge.runtime.active_ai?.name,
        mutations.AI_CHARACTER,
        dynamics_for("ai"),
        retrieval,
      );
      if (ai_entry) updates.AI_CHARACTER = ai_entry;

      const user_entry = build_update_entry(state_bridge.runtime.active_user?.name, mutations.USER_PERSONA, [], []);
      if (user_entry) updates.USER_PERSONA = user_entry;

      const fractal_entry = build_update_entry(
        snapshot.fractal?.name || state_bridge.runtime.active_fractal?.name,
        mutations.FRACTAL,
        dynamics_for("fractal"),
        [],
      );
      if (fractal_entry) updates.FRACTAL = fractal_entry;

      await state_bridge.session_driver.log_system_entry(
        log_strings.length > 0 ? log_strings.join(" | ") : "Simulation Telemetry Snapshot",
        "system",
        {
          type: "DYNAMICS_DELTA",
          trigger_image: meta?.trigger_image === true,
          ...(meta?.image_trigger ? { image_trigger: meta.image_trigger } : {}),
          ...(meta?.image_tier ? { image_tier: meta.image_tier } : {}),
          ...(meta?.image_source ? { image_source: meta.image_source } : {}),
          ...(meta?.image_signals ? { image_signals: meta.image_signals } : {}),
          ...(meta?.thoughts ? { thoughts: meta.thoughts } : {}),
          updates,
        },
      );
    }
  },


  /**
   * 🧹 EPILOGUE PRESENCE CHECK
   * Returns whether the story's log already contains an epilogue entry, so the
   * auto-dispatch hook and manual END STORY both no-op after conclusion.
   * @param {string|number} story_id
   * @returns {Promise<boolean>}
   */
  async _has_epilogue(story_id) {
    try {
      const entries = await state_bridge.session_driver.load_log(story_id);
      return entries.some((e) => e?.meta?.is_epilogue === true);
    } catch (_err) {
      return false;
    }
  },

  /**
   * NPC WORLD-CAST HELPERS (track-npc-expansion)
   * ---------------------------------------------------------------------------
   */

  /**
   * Resolves a delegated NPC by id (bare or `npc:<id>`) or by case-insensitive
   * name against the runtime world cast.
   * @param {any} bridge
   * @param {string} npc_id
   * @returns {any | null}
   */
  _resolve_npc_entity(bridge, npc_id) {
    if (!npc_id) return null;
    const npcs = bridge.runtime?.active_npcs || {};
    if (npcs[npc_id]) return npcs[npc_id];
    const by_name = Object.values(npcs).find((n) => String(n?.name || "").toLowerCase() === npc_id.toLowerCase());
    return by_name || null;
  },

  /**
   * Applies the Director's Stage Spotlight choreography (enter/exit) to
   * runtime.in_scene_npc_ids. Returns true when the stage changed.
   * @param {any} bridge
   * @param {{ enter?: string[], exit?: string[] } | null} change
   * @returns {Promise<boolean>}
   */
  async _apply_in_scene_change(bridge, change) {
    if (!change || typeof change !== "object") return false;
    const current = new Set(bridge.runtime?.in_scene_npc_ids || []);
    let changed = false;
    for (const id of change.enter || []) {
      if (id && !current.has(id)) {
        current.add(id);
        changed = true;
      }
    }
    for (const id of change.exit || []) {
      if (current.delete(id)) changed = true;
    }
    if (changed && bridge.runtime) {
      bridge.runtime.in_scene_npc_ids = [...current];
    }
    return changed;
  },

  /**
   * Persists Director promotions (tier 2/3) for recurring/major NPCs so the
   * entity's role_tier survives reloads.
   * @param {any} bridge
   * @param {Array<{ id: string, tier: number }>} promotions
   */
  async _apply_promotions(bridge, promotions) {
    for (const p of promotions || []) {
      const id = String(p?.id || "");
      if (!id) continue;
      const npcs = bridge.runtime?.active_npcs || {};
      const npc = npcs[id];
      if (!npc) continue;
      const target_tier = Math.max(2, Math.min(3, Number(p?.tier) || 2));
      if (Number(npc.role_tier) >= target_tier) continue;
      try {
        const updated = await entities.upsert("character", { ...npc, role_tier: target_tier });
        bridge.runtime.active_npcs = { ...npcs, [id]: updated };
        bridge.app.log(`[GameMaster] NPC "${npc.name}" promoted to tier ${target_tier}.`, "system");
      } catch (err) {
        bridge.app.log(`[GameMaster] NPC promotion failed: ${err?.message || err}`, "warn");
      }
    }
  },

  /**
   * Genesis — spawns a new world-cast NPC (Tier 1 by default), persists it to
   * Dexie, registers it on the active story, and puts it on-stage.
   * @param {any} bridge
   * @param {{ name: string, description?: string, role_tier?: number, relationships?: string[], voice_register?: string }} [draft]
   * @returns {Promise<any | null>}
   */
  async spawn_npc(bridge, draft = {}) {
    const name = String(draft?.name || "").trim();
    if (!name) return null;
    const entity = await entities.upsert("character", {
      name,
      description: String(draft?.description || "").trim(),
      role_tier: Math.max(1, Math.min(3, Number(draft?.role_tier) || 1)),
      relationships: Array.isArray(draft?.relationships) ? draft.relationships : [],
      voice_register: draft?.voice_register || "",
      is_wanderer: false,
    });
    const story_id = bridge.runtime?.story_id;
    if (story_id && story_id !== "debug") {
      try {
        const story = await stories.get(story_id);
        const npc_ids = [...new Set([...(story?.npc_ids || []), entity.id])];
        if (npc_ids.length !== (story?.npc_ids || []).length) {
          await stories.update_cast(story_id, npc_ids);
        }
      } catch (err) {
        bridge.app.log(`[GameMaster] Failed to register NPC on the story: ${err?.message || err}`, "warn");
      }
    }
    const npcs = { ...(bridge.runtime?.active_npcs || {}) };
    npcs[entity.id] = entity;
    if (bridge.runtime) {
      bridge.runtime.active_npcs = npcs;
      bridge.runtime.in_scene_npc_ids = [...new Set([...(bridge.runtime.in_scene_npc_ids || []), entity.id])];
    }
    bridge.app?.log(`[GameMaster] World cast expanded: ${name}.`, "system");
    return entity;
  },

  /**
   * EXECUTE TURN
   * The primary simulation loop for a narrative turn.
   * @param {string} story_id
   * @param {GenerationOptions} [options]
   * @returns {Promise<{ response: string, meta: any }>}
   */
  async execute_turn(story_id, options = {}) {
    const { input = "", role = "ai", ...llm_options } = options;
    state_bridge.app.busy = true;

    try {
      state_bridge.simulation_state.start_generation(role);
      state_bridge.runtime.story_id = story_id;
      const node_id = generateUUID();

      // 1. CHRONO: Round management
      temporal_engine.ensure_momentum(state_bridge.runtime, state_bridge.app);
      state_bridge.runtime.turn_type = "SYSTEM_TURN";
      temporal_engine.set_round(state_bridge.runtime.round);

      // 2. HYDRATION: Fetch history and hydrate context
      const raw_messages = await state_bridge.session_driver.load_log(story_id);
      const simulation_log = raw_messages
        .filter((m) => !m.meta?.consolidated && m.role !== "system")
        .map((m) => ({
          role: m.role === "user" ? "user" : m.role === "fractal" ? "fractal" : "model",
          content: m.text || m.content || "",
          character_name: m.character_name,
        }));

      if (input && simulation_log.length > 0) {
        const last = simulation_log[simulation_log.length - 1];
        if (last.role === "user" && last.content.trim() === input.trim()) {
          simulation_log.pop();
        }
      }

      const payload = await context_builder.build_context(input || "", "simulation", simulation_log);
      payload.meta = payload.meta || {};
      payload.meta.structural_errors = state_bridge.runtime.structural_errors || 0;

      const scoring_context = prompt_builder.build_scoring_context(input, simulation_log);
      if (scoring_context) {
        // Best-effort precompute with a strict budget: embeddings for scoring are a
        // nice-to-have, and a slow/synchronous embed must never delay the turn.
        await Promise.race([temporal_engine.precompute_context_embedding(scoring_context), new Promise((resolve) => setTimeout(resolve, 1500))]);
      }

      // 3. SIMULATION: Evaluate world physics snapshot prior to generation
      // Pre-turn dynamics snapshot — the baseline for the image trigger engine's
      // displacement & band-entry gate (step 4.6). Captured before settlement mutates the copy.
      const prev_dynamics = {
        ai: { ...(state_bridge.runtime.ai || {}) },
        fractal: { ...(state_bridge.runtime.fractal || {}) },
      };

      const snapshot = {
        ai: { dynamics: { ...(state_bridge.runtime.ai || {}) } },
        fractal: { dynamics: { ...(state_bridge.runtime.fractal || {}) } },
        flags: [],
      };

      // Director-delta axes are collected during 4.1 and exempted from the gravity
      // settle afterwards, so a Director-calibrated axis (including a deliberate 0)
      // is authoritative for that turn instead of being overwritten by baseline drift.
      /** @type {Set<string>} */
      const ai_delta_axes = new Set();
      /** @type {Set<string>} */
      const fractal_delta_axes = new Set();

      snapshot.pruned_vectors = {
        AI: prune(payload.entities.AI?.memories),
        USER: prune(payload.entities.USER?.memories),
        FRACTAL: prune(payload.entities.FRACTAL?.memories),
      };

      // 4. DIRECTOR PASS (Shot 1)
      state_bridge.app.log("[GameMaster] Context hydrated. Physics resolved. Entering DIRECTOR_TURN...", "system");
      const director_prompt = prompt_builder.build_director_prompt(payload, snapshot);

      const director_call = async (terse = false) => {
        return await this.execute_with_retry(
          async () => {
            return await llm_service.generate(
              {
                system: director_prompt.system,
                task: terse ? terse_director_task() : director_prompt.task,
                messages: [],
                role: "system",
                node_id: node_id + "-director",
              },
              {
                ...llm_options,
                json: true,
                silent: true,
                raw: true,
                onToken: null,
              },
            );
          },
          2,
          1000,
        );
      };

      const director_raw = await director_call(false);
      let director_text = raw_to_text(director_raw);
      let director_data = parse_director_json(director_text) || {};

      // TRUNCATION RETRY — a cut-off JSON silently drops every mutation. Retry
      // once with a terse directive so the payload fits the output budget and
      // closes cleanly. (A successful parse is kept even if the server's stop
      // reason was "length" — the object is complete, only optional fields may
      // have been dropped.)
      if (director_data._parse_error) {
        const reason = raw_stop_reason(director_raw);
        state_bridge.app.log(`[GameMaster] Director JSON truncated${reason ? ` (${reason})` : ""} — retrying with terse directive...`, "warn");
        const terse_raw = await director_call(true);
        const terse_text = raw_to_text(terse_raw);
        const retry_data = parse_director_json(terse_text) || {};
        if (!retry_data._parse_error) {
          if (!retry_data._thought_process && director_data?._thought_process) {
            retry_data._thought_process = director_data._thought_process;
          }
          if (!retry_data._thought_process) {
            retry_data._thought_process = "High tension turn evaluation completed.";
          }
          director_data = retry_data;
        }
      }

      // MINIMAL-MUTATION FALLBACK — if the Director STILL failed to produce a
      // valid payload, synthesize enough mutations that memory & dynamics never
      // freeze for this turn (the pre-fix behavior that caused the 6-round stalls).
      if (!director_data || director_data._parse_error) {
        state_bridge.app.log("[GameMaster] Director degraded — applying minimal-mutation fallback.", "warn");
        director_data = synthesize_director_fallback(director_data, input, state_bridge);
      }
      // Defensive re-normalization: guarantees speaker/keywords/story_status are
      // always in canonical form before any routing decisions are made.
      director_data = normalize_director_data(director_data);

      // 3.5. STAGE SPOTLIGHT — apply the Director's scene choreography (enter/
      // exit) and tier promotions BEFORE mutations so NPC salience, the roster,
      // and the speaker engine all reflect this turn's stage.
      await this._apply_in_scene_change(state_bridge, director_data.in_scene_change);
      if (Array.isArray(director_data.promotions) && director_data.promotions.length) {
        await this._apply_promotions(state_bridge, director_data.promotions);
      }

      // 4.1 Apply State Mutations (Director-scrubbed so clichéd somatic idioms
      // never seed prompt history for future turns)
      const entity_mutations = scrub_state_mutations(director_data.mutations || director_data);

      if (entity_mutations.AI_CHARACTER && state_bridge.runtime.active_ai) {
        temporal_engine.apply_state_mutations(state_bridge.runtime.active_ai, entity_mutations.AI_CHARACTER, state_bridge.session_driver);
        if (entity_mutations.AI_CHARACTER.dynamics_deltas) {
          if (!snapshot.ai) snapshot.ai = {};
          if (!snapshot.ai.dynamics) snapshot.ai.dynamics = { ...state_bridge.runtime.ai };
          Object.entries(entity_mutations.AI_CHARACTER.dynamics_deltas).forEach(([k, delta]) => {
            const val = Number(delta);
            if (!isNaN(val)) {
              ai_delta_axes.add(k);
              const current = snapshot.ai.dynamics[k] || 50;
              snapshot.ai.dynamics[k] = Math.max(1, Math.min(100, current + val));
            }
          });
        }
      }

      if (entity_mutations.USER_PERSONA && state_bridge.runtime.active_user) {
        temporal_engine.apply_state_mutations(state_bridge.runtime.active_user, entity_mutations.USER_PERSONA, state_bridge.session_driver);
      }

      if (entity_mutations.FRACTAL && state_bridge.runtime.active_fractal) {
        temporal_engine.apply_state_mutations(state_bridge.runtime.active_fractal, entity_mutations.FRACTAL, state_bridge.session_driver);
        if (entity_mutations.FRACTAL.dynamics_deltas) {
          if (!snapshot.fractal) snapshot.fractal = {};
          if (!snapshot.fractal.dynamics) snapshot.fractal.dynamics = { ...state_bridge.runtime.fractal };
          Object.entries(entity_mutations.FRACTAL.dynamics_deltas).forEach(([k, delta]) => {
            const val = Number(delta);
            if (!isNaN(val)) {
              fractal_delta_axes.add(k);
              const current = snapshot.fractal.dynamics[k] || 50;
              snapshot.fractal.dynamics[k] = Math.max(1, Math.min(100, current + val));
            }
          });
        }
      }

      // 4.2. GRAVITY SETTLEMENT — after the Director's explicit deltas, so axes it
      // calibrated this turn (including deliberate 0s) are authoritative. Untouched
      // axes still drift gently toward their baselines to prevent runaway drift.
      dynamics_engine.settle_physics(
        snapshot.ai.dynamics,
        dynamics_engine._get_baselines(payload.entities.AI),
        snapshot.fractal.dynamics?.entropy || 50,
        0.1,
        ai_delta_axes,
      );
      dynamics_engine.settle_physics(
        snapshot.fractal.dynamics,
        dynamics_engine._get_baselines(payload.entities.FRACTAL),
        snapshot.fractal.dynamics?.entropy || 50,
        0.1,
        fractal_delta_axes,
      );

      // 4.4. ACTIVE SPEAKER RESOLUTION — the Director delegates execution to the
      // AI_CHARACTER (default), the FRACTAL world engine (build_narrator), or a
      // delegated NPC (build_npc_prompt over the in-scene world cast). The
      // delegated identity drives the reactive "thinking" state so the UI
      // badge/avatar mirrors whoever is speaking.
      const speaker = director_data.speaker || "ai";
      const speaker_engine = resolve_speaker_engine(speaker);
      let npc_entity = null;
      if (speaker_engine === "npc") {
        const npc_id = director_data.npc_id || String(speaker).replace(/^npc:/i, "");
        npc_entity = this._resolve_npc_entity(state_bridge, npc_id);
        if (!npc_entity) {
          state_bridge.app.log(
            `[GameMaster] Director delegated the turn to "${speaker}" but that NPC is not in the world cast — falling back to the AI character.`,
            "warn",
          );
        }
      }
      const uses_narrator_engine = speaker_engine === "narrator";
      const generation_role = uses_narrator_engine ? "fractal" : "ai";
      const generation_entity = npc_entity || (uses_narrator_engine ? state_bridge.runtime.active_fractal : state_bridge.runtime.active_ai);
      const generation_name = generation_entity?.name || (npc_entity ? "NPC" : uses_narrator_engine ? "Fractal" : "AI");
      state_bridge.runtime.streaming_entity_id = npc_entity ? npc_entity.id : null;
      state_bridge.simulation_state?.start_generation?.(generation_role);
      state_bridge.simulation_state?.set_generating_entity?.({
        type: npc_entity ? "npc" : uses_narrator_engine ? "fractal" : "ai",
        name: generation_name,
        avatar: generation_entity?.profile_picture || null,
        color: generation_entity?.signature_color || null,
      });

      // 4.5. PHYSICS SYNC & TELEMETRY
      const character_prompt = uses_narrator_engine
        ? prompt_builder.build_scene_narrator_prompt(payload, snapshot, director_data)
        : npc_entity
          ? prompt_builder.build_npc_prompt(payload, npc_entity, snapshot, director_data)
          : prompt_builder.build_character_prompt(payload, snapshot, director_data);
      const meta = character_prompt.meta;

      let final_meta = { ...meta };
      final_meta.ai = snapshot.ai?.dynamics;
      final_meta.fractal = snapshot.fractal?.dynamics;
      final_meta.mutations = entity_mutations;

      const clean_think = (t) =>
        String(t || "")
          .replace(/<\/?think>/gi, "")
          .trim();
      const think_sections = [];
      if (director_data.internal_monologue) think_sections.push(`**Cognition:** ${clean_think(director_data.internal_monologue)}`);
      if (director_data.intent) think_sections.push(`**Intent:** ${clean_think(director_data.intent)}`);
      if (director_data.somatic_tells) think_sections.push(`**Somatic Tells:** ${clean_think(director_data.somatic_tells)}`);
      if (director_data.dialogue_direction) think_sections.push(`**Dialogue Direction:** ${clean_think(director_data.dialogue_direction)}`);
      if (director_data._thought_process) think_sections.push(`**Reasoning:** ${clean_think(director_data._thought_process)}`);
      const think_content = think_sections.join("\n\n");
      if (think_content) final_meta.thoughts = think_content;

      // 4.6 IMAGE TRIGGER ENGINE — Dual-Source & Shared Cooldown
      // Source A: pure-JS dynamics gate (band entry + displacement sum), no LLM call.
      // Source B: LLM Director explicit trigger (trigger_image true or a 4-tier string).
      const turn_round = state_bridge.runtime.round || 0;
      const last_auto = state_bridge.runtime.last_auto_image_round ?? -1;
      const resolved_image = resolve_image_trigger({
        snapshot,
        prev_dynamics,
        director_data,
        turn_round,
        last_auto,
      });

      if (resolved_image.next_auto_round !== null) {
        state_bridge.runtime.last_auto_image_round = resolved_image.next_auto_round;
      }

      final_meta.trigger_image = resolved_image.active;
      final_meta.image_trigger = resolved_image.active;
      final_meta.image_tier = resolved_image.tier;
      if (resolved_image.active) {
        final_meta.image_source = resolved_image.source;
        final_meta.image_signals = resolved_image.signals;
      }

      const image_trigger_active = resolved_image.active;
      const image_tier = resolved_image.tier;

      if (image_trigger_active && image_tier) {
        let trigger_prompt = [input, clean_think(director_data._thought_process), clean_think(director_data.directive)]
          .filter(Boolean)
          .join(" ")
          .trim();
        if (!trigger_prompt) {
          // No in-turn context to draw from (e.g. an opening turn with a silent Director):
          // anchor the visual on the most recent narrative beat so the image LLM is never
          // handed the generic placeholder string.
          const last_beat = [...simulation_log].reverse().find((m) => m.role === "fractal" || m.role === "model");
          if (last_beat?.content) {
            trigger_prompt = strip_cognition_blocks(last_beat.content).slice(0, 700);
          }
        }
        await fire_image_trigger(image_tier, {
          explicit: resolved_image.director_explicit,
          source: final_meta.image_source,
          prompt: trigger_prompt,
        });
      }

      await this.capture_dynamics_delta(snapshot, final_meta);

      state_bridge.runtime.ai = snapshot.ai?.dynamics;
      state_bridge.runtime.fractal = snapshot.fractal?.dynamics;

      // 5. TRANSITION & LOGGING
      state_bridge.app.log("[GameMaster] Routing to LLM (Character Pass)...", "system");
      state_bridge.runtime.turn_type = "AI_TURN";

      const director_monologue = think_content ? `<think>\n${think_content}\n</think>\n\n` : "";

      if (director_monologue) {
        state_bridge.app.streaming.content = director_monologue;
        state_bridge.app.streaming.text = director_monologue;
        if (typeof llm_options.onToken === "function") {
          llm_options.onToken(director_monologue);
        }
      }

      // 6. GENERATION: Call the model with retry logic. If a reply comes back
      // truncated (cut off mid-sentence by the token budget), re-run once with a
      // completion directive so the narrative never ends abruptly.
      const make_character_try = async (completion_note) => {
        const { onToken, json, signal, silent, raw } = llm_options;

        const task = completion_note ? character_prompt.task + completion_note : character_prompt.task;
        const generated_text = await llm_service.generate(
          {
            system: character_prompt.system,
            task,
            messages: simulation_log,
            role: generation_role,
            node_id: node_id,
          },
          {
            onToken,
            json,
            signal,
            silent,
            raw,
          },
        );

        const full_text = (director_monologue || "") + (generated_text || "");

        const v_result = validate_and_repair_response(full_text);
        if (v_result.refused) {
          state_bridge.app.streaming.content = "";
          state_bridge.app.streaming.text = "";
          throw new Error("AI_REFUSAL_DETECTED");
        }
        return v_result;
      };

      let validation_result = await this.execute_with_retry(() => make_character_try(null), 2, 1000);

      if (!validation_result.violated && looks_truncated(validation_result.text)) {
        // Only regenerate when narrative prose actually got cut off mid-sentence:
        // a think-only reply is an empty generation, not truncation, and short
        // unpunctuated beats are legitimate narrative endings.
        const prose_only = String(validation_result.text)
          .replace(/<think>[\s\S]*?<\/think>/gi, "")
          .replace(/<\/?think>/gi, "")
          .trim();
        if (prose_only && prose_only.length >= TRUNCATION_MIN_PROSE) {
          state_bridge.app.log("[GameMaster] Reply truncated — regenerating with completion directive...", "warn");
          state_bridge.app.streaming.content = director_monologue || "";
          state_bridge.app.streaming.text = director_monologue || "";
          validation_result = await this.execute_with_retry(() => make_character_try(TRUNCATION_COMPLETE_NOTE), 1, 500);
          if (looks_truncated(validation_result.text)) {
            validation_result.text = force_close_response(validation_result.text, generation_name);
            validation_result.structural_repair = true;
          }
        }
      }

      // 6.5. POST-GENERATION PIPELINE
      if (validation_result.violated || validation_result.structural_repair) {
        state_bridge.runtime.structural_errors = (state_bridge.runtime.structural_errors || 0) + 1;
      } else {
        state_bridge.runtime.structural_errors = Math.max(0, (state_bridge.runtime.structural_errors || 0) - 1);
      }

      // 7. PERSISTENCE: Save the result
      const character_name = generation_name;
      // NPC turns persist under the "npc" role so the feed renders them with the
      // NPC's own identity/color (and so the LLM context maps them to "model").
      const log_role = npc_entity ? "npc" : generation_role;

      if (validation_result.violated) {
        final_meta.sino_logic_violation = true;
      }
      final_meta.structural_errors = state_bridge.runtime.structural_errors;

      // Write-time detox: scrub banned tropes from the stored payload so the
      // database log and exported .md transcripts match the display layer.
      const persisted_text = detox_prose(validation_result.text, "plain");

      await state_bridge.session_driver.log_message(persisted_text, log_role, character_name, {
        turn_type: "AI_TURN",
        meta: {
          id: node_id,
          round: state_bridge.runtime.round,
          sino_logic_violation: final_meta.sino_logic_violation,
          speaker_type: npc_entity ? "npc" : undefined,
          entity_id: npc_entity ? npc_entity.id : undefined,
        },
      });

      // 8. TRANSITION: Open the window for User
      state_bridge.runtime.turn_type = "USER_TURN";

      state_bridge.app.end_stream();
      state_bridge.simulation_state.complete();
      state_bridge.simulation_state?.clear_generating_entity?.();

      state_bridge.app.busy = false;
      state_bridge.simulation_state.phase = "idle";

      await temporal_engine.consolidate(state_bridge.session_driver, db, entities, state_bridge.runtime, state_bridge.app);

      // 8.5. AUTO-DISPATCH EPILOGUE — the Director declared the quest resolved
      // (victory or irrevocable collapse). Deliver the epilogue and mark the
      // story concluded without needing the manual END STORY button.
      const story_status = director_data?.story_status;
      if (story_status === "CONCLUDED" || story_status === "COLLAPSED") {
        try {
          if (!(await this._has_epilogue(story_id))) {
            state_bridge.app.log(`[GameMaster] Director marked the story ${story_status} — auto-dispatching epilogue.`, "system");
            await this.execute_epilogue(story_id);
            await stories.conclude(story_id);
          }
        } catch (err) {
          state_bridge.app.log(`[GameMaster] Auto-epilogue failed: ${err.message || err}`, "error");
        }
      }
      return { response: persisted_text, meta: final_meta };
    } finally {
      state_bridge.app.busy = false;
      state_bridge.app.end_stream();
      if (state_bridge.simulation_state) {
        state_bridge.simulation_state.phase = "idle";
      }
      // Ghost sweeps are a background maintenance chore: run them through the
      // parallel job queue so they never add latency or failure to the turn.
      director_background_queue.run(() => sweep_stale_ghosts()).catch(() => {});
    }
  },

  /**
   * EXECUTE PROLOGUE
   * Specialized turn for starting a new story.
   * @param {string} story_id
   * @returns {Promise<any>}
   */
  async execute_prologue(story_id) {
    state_bridge.app.busy = true;
    try {
      const prologue_input = state_bridge.app.prologue || "";
      const payload = await context_builder.build_context(prologue_input, "prologue");
      // Semantic RAG: precompute the context embedding from the prologue's own
      // input so the narrator's PAST/FUTURE ranking (sync format → score) is
      // scored against the scene the user requested, not pure weight×recency.
      await Promise.race([temporal_engine.precompute_context_embedding(prologue_input), new Promise((resolve) => setTimeout(resolve, 1500))]);
      const result = prompt_builder.build_prologue(payload, {});
      if (!result.system) return null;

      state_bridge.app.log("[GameMaster] Generating prologue...", "system");
      const node_id = generateUUID();
      const fractal_name = state_bridge.runtime.active_fractal?.name || "Fractal Entity";

      state_bridge.runtime.round = 0;
      state_bridge.runtime.turn_type = "SYSTEM_TURN";
      // The prologue's own image (dispatched below) opens the shared cooldown, so
      // the opening turn's dynamics gate can't immediately fire a second image at round 0.
      state_bridge.runtime.last_auto_image_round = 0;

      // Log placeholder message BEFORE streaming begins so the feed entry exists.
      await state_bridge.session_driver.log_message("", "fractal", fractal_name, {
        turn_type: "SYSTEM_TURN",
        meta: {
          id: node_id,
          round: 0,
          is_prologue: true,
        },
        attachments: [],
      });

      const response = await this.execute_with_retry(async () => {
        const text = await llm_service.generate({
          system: result.system,
          task: result.task,
          role: "fractal",
          node_id: node_id,
        });
        if (!text || !strip_cognition_blocks(text).trim()) {
          throw new Error("EMPTY_PROLOGUE_PROSE");
        }
        return text;
      });

      await state_bridge.session_driver.edit_log_entry(node_id, response);
      state_bridge.app.log("[GameMaster] Prologue established (Round 0).", "system");

      state_bridge.app.end_stream();

      // Attach the image placeholder ONLY after text streaming finishes so the card pops up post-stream
      await state_bridge.session_driver.update_log_attachment(node_id, 0, { src: null, metadata: { mode: "story_entities" } });

      const image_promise = visual_engine
        ? Promise.race([
            visual_engine
              .visualize(story_id, strip_cognition_blocks(response), "story_entities", { silent: true })
              .then((img_result) => {
                if (img_result?.imageUrl) {
                  state_bridge.session_driver.update_log_attachment(node_id, 0, {
                    src: img_result.imageUrl,
                    metadata: {
                      ...(img_result.metadata || {}),
                      prompt: img_result.refinedPrompt || img_result.metadata?.prompt,
                      mode: "story_entities",
                    },
                  });
                }
              })
              .catch((err) => {
                console.warn("[Prologue Image Error]", err);
              }),
            new Promise((resolve) =>
              setTimeout(async () => {
                // Mark the placeholder failed ONLY if it is still unresolved — never
                // clobber an image that resolved in the meantime.
                try {
                  const key = isNaN(Number(node_id)) ? node_id : Number(node_id);
                  const entry = await db.simulation_log.get(key);
                  const att = entry?.attachments?.[0];
                  if (att && att.src == null) {
                    await state_bridge.session_driver.update_log_attachment(node_id, 0, {
                      src: null,
                      metadata: { ...(att.metadata || {}), failed: true, image_ghost_swept: true, error: "Prologue image timed out." },
                    });
                  }
                } catch (_err) {
                  /* guard must never break the prologue */
                }
                resolve();
              }, IMAGE_RESOLVE_TIMEOUT_MS),
            ),
          ])
        : Promise.resolve();

      // Prime the streaming cursor so the busy placeholder renders during the opening
      // turn's director phase (end_stream() above left streaming inactive; a regular
      // turn gets this from advance_turn). node_id stays null → the "temp" placeholder,
      // and the character pass streams into it since stream_bridge.is_active() is true.
      state_bridge.app.streaming.active = true;
      state_bridge.app.streaming.content = "";
      state_bridge.app.streaming.text = "";
      state_bridge.app.streaming.node_id = null;
      state_bridge.app.streaming.role = "ai";

      const turn_promise = this.execute_turn(story_id, { role: "ai", is_opening_turn: true });

      await Promise.all([image_promise, turn_promise]);
      return await turn_promise;
    } finally {
      state_bridge.app.busy = false;
      state_bridge.app.end_stream();
      if (typeof state_bridge.simulation_state !== "undefined") {
        state_bridge.simulation_state.phase = "idle";
      }
    }
  },

  /**
   * EXECUTE EPILOGUE
   * Final summary or conclusion for a story.
   * @param {string} story_id
   * @returns {Promise<string | null>}
   */
  async execute_epilogue(story_id) {
    if (await this._has_epilogue(story_id)) {
      state_bridge.app.log("[GameMaster] Epilogue already present — skipping duplicate dispatch.", "system");
      return null;
    }
    const clean_entities = state_bridge.runtime.snapshot_entities;
    const current_dynamics = {
      ai: state_bridge.runtime.ai || { intensity: 50, openness: 50, chaos: 50, affinity: 50 },
      fractal: state_bridge.runtime.fractal || { velocity: 50, entropy: 50 },
    };
    const raw_messages = await state_bridge.session_driver.load_log(story_id);
    const recent_history = raw_messages.slice(-10);

    const { system, task } = prompt_builder.build_epilogue(clean_entities, current_dynamics, recent_history);
    if (!system) return null;

    state_bridge.app.log("[GameMaster] Generating epilogue...", "system");
    const node_id = generateUUID();
    const fractal_name = state_bridge.runtime.active_fractal?.name || "Fractal Entity";

    const response = await this.execute_with_retry(async () => {
      const text = await llm_service.generate({ system, task, role: "fractal", node_id: node_id });
      if (!text || !strip_cognition_blocks(text).trim()) {
        throw new Error("EMPTY_EPILOGUE_PROSE");
      }
      return text;
    });

    let epilogue_attachments = [];
    if (visual_engine) {
      try {
        const img_result = await visual_engine.visualize(story_id, strip_cognition_blocks(response), "story_entities", { silent: true });
        if (img_result?.imageUrl) {
          epilogue_attachments = [
            {
              src: img_result.imageUrl,
              metadata: {
                ...(img_result.metadata || {}),
                prompt: img_result.refinedPrompt || img_result.metadata?.prompt,
                mode: "characters",
              },
            },
          ];
        }
      } catch (err) {
        console.warn("[Epilogue Image Error]", err);
      }
    }

    await state_bridge.session_driver.log_message(detox_prose(response, "plain"), "fractal", fractal_name, {
      turn_type: "SYSTEM_TURN",
      meta: {
        id: node_id,
        is_epilogue: true,
      },
      attachments: epilogue_attachments,
    });
    state_bridge.app.end_stream();
    return response;
  },

  /**
   * EXECUTE GHOSTWRITER
   * Compiles and executes a Ghostwriter prompt on behalf of the User Persona.
   * @param {string} [input_text=""]
   * @param {AbortSignal} [signal]
   * @returns {Promise<string>}
   */
  async execute_ghostwriter(input_text = "", signal = null) {
    const story_id = state_bridge.runtime.story_id;
    const raw_messages = story_id ? await state_bridge.session_driver.load_log(story_id) : [];
    const simulation_log = raw_messages
      .filter((m) => !m.meta?.consolidated && m.role !== "system")
      .map((m) => ({
        role: m.role === "user" ? "user" : m.role === "fractal" ? "fractal" : "model",
        content: m.text || m.content || "",
        character_name: m.character_name,
      }));
    const payload = await context_builder.build_context(input_text || "", "simulation", simulation_log);
    const ghost_prompt = prompt_builder.build_ghostwriter(payload.entities, input_text);

    const result = await llm_service.generate(
      {
        system: ghost_prompt.system,
        task: ghost_prompt.task,
        messages: [],
        role: "user",
      },
      { silent: true, signal },
    );

    const clean_result = strip_cognition_blocks(typeof result === "string" ? result : result?.text || "").trim();
    return clean_result;
  },

  /**
   * Wraps an async function in exponential backoff retry logic.
   * @param {() => Promise<any>} fn
   * @param {number} [retries=3]
   * @param {number} [delay=1000]
   * @returns {Promise<any>}
   */
  async execute_with_retry(fn, retries = 3, delay = 1000) {
    try {
      return await fn();
    } catch (error) {
      // Never retry user-initiated interrupts — let them bubble up immediately.
      const is_abort =
        error?.name === "AbortError" || error?.message?.includes("aborted") || String(error) === "Error: Generation aborted by caller.";
      if (is_abort) throw error;
      if (retries === 0) throw error;
      state_bridge.app.log(`[GameMaster] Connection issue. Retrying in ${delay}ms... (${retries} attempts left)`, "warn");

      if (state_bridge.app.streaming.active) {
        state_bridge.app.streaming.content = "";
        state_bridge.app.streaming.text = "_Network interrupted... Retrying connection..._";
      }

      await new Promise((resolve) => setTimeout(resolve, delay));
      const base_delay = delay * 2;
      const jittered_sleep_time = base_delay * (0.75 + Math.random() * 0.5);
      return await this.execute_with_retry(fn, retries - 1, jittered_sleep_time);
    }
  },
};
