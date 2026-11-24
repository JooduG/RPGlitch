/**
 * @file src/engine/turns.js
 * Stateful turn orchestration: turn execution, dynamics stepping,
 * row persistence, image beat triggers, and background Caretaker consolidation.
 */

import { IMAGE_POLICY } from "@config";
import { db, normalize_entity } from "@data";
import { Audio, get_image_generation_queue, spawn_image_beat } from "@media";
import {
  apply_tagged_field_deltas,
  parse_think_block,
  reconstruct_history_from_feed,
  resolve_caretaker_target,
  resolve_image_trigger,
  step_dynamics,
} from "@simulation";
import { app, execution, session } from "@state";
import { continue_generation_step, resolve_continuation_separator, run_memory_consolidation_step, run_round } from "./steps.js";
import { get_transport } from "./transport.js";

let _turn_in_flight = false;

/**
 * Resets the turn re-entrancy guard. Used by abort recovery and test beforeEach
 * hooks so a failed turn never wedges subsequent turns.
 */
export function reset_turn_scope() {
  _turn_in_flight = false;
}

function begin_turn_scope() {
  if (_turn_in_flight) throw new Error("Simulation is locked or actively generating.");
  _turn_in_flight = true;
}

function end_turn_scope() {
  _turn_in_flight = false;
}

function clone_entity_for_turn(source) {
  const normalized = normalize_entity(source || {});
  if (source?.dynamics_baseline && typeof source.dynamics_baseline === "object") {
    normalized.dynamics_baseline = { ...source.dynamics_baseline };
  }
  return normalized;
}

function create_first_chunk_stager(ai_quadrant) {
  let staged = false;
  return () => {
    if (staged) return;
    staged = true;
    execution.generating_entity = {
      type: "ai",
      name: ai_quadrant.name || "AI",
      avatar: ai_quadrant.profile_picture || null,
      color: ai_quadrant.signature_color || null,
    };
  };
}

/**
 * Builds transient turn context: normalized quadrant copies (preserving
 * `dynamics_baseline` for gravity settling) plus reconstructed history.
 */
function build_turn_context(app_store, feed) {
  const user_quadrant = clone_entity_for_turn(session.active_user || app_store.selected_user);
  const ai_quadrant = clone_entity_for_turn(session.active_ai || app_store.selected_ai);
  const fractal_quadrant = clone_entity_for_turn(session.active_fractal || app_store.selected_fractal);
  const history = reconstruct_history_from_feed(feed, { user: user_quadrant, ai: ai_quadrant, fractal: fractal_quadrant });
  return { user_quadrant, ai_quadrant, fractal_quadrant, history };
}

/**
 * Commits a finished turn to persistence and the reactive feed: the director
 * telemetry row first, then the character AI row.
 */
async function persist_turn_rows({ prose, think, outcome, ai_name, story_id, round, dynamics_ai, dynamics_fractal, snapshots }) {
  if (!prose || !story_id) return;

  const levels = dynamics_ai || dynamics_fractal ? { ...(dynamics_ai || {}), ...(dynamics_fractal || {}) } : undefined;

  let logged_delta = null;
  if (outcome.director_staging?.dynamics_deltas) {
    logged_delta = await session.log_message("", "system", "Director", {
      turn_type: "SYSTEM_TURN",
      round,
      story_id,
      snapshots,
      meta: {
        type: "DYNAMICS_DELTA",
        deltas: outcome.director_staging.dynamics_deltas,
        ...(levels ? { levels } : {}),
        director_note: outcome.director_staging.directors_note,
        camera_note: outcome.director_staging.camera_note,
        thoughts: outcome.director_staging._thought_process || "",
      },
    });
  }

  const logged_entry = await session.log_message(prose, "ai", ai_name, {
    turn_type: "AI_TURN",
    round,
    story_id,
    snapshots,
    meta: { think, director_staging: outcome.director_staging },
  });

  if (logged_delta && logged_entry && logged_delta.created_at >= logged_entry.created_at) {
    try {
      const fixed = logged_entry.created_at - 1;
      await db.simulation_log.update(logged_delta.id, { created_at: fixed });
      logged_delta.created_at = fixed;
      session?.update?.(logged_delta.id, { created_at: fixed });
    } catch {
      /* Ordering is best-effort; insertion order already holds live. */
    }
  }
}

function apply_dynamics_step(ai_entity, fractal_entity, deltas) {
  if (!deltas) return;
  const entropy = Number(fractal_entity?.dynamics?.entropy ?? 50);

  if (ai_entity && typeof ai_entity.dynamics === "object") {
    const ai_deltas = {};
    for (const key of ["chaos", "intensity", "openness", "affinity"]) {
      if (deltas[key] !== undefined) ai_deltas[key] = deltas[key];
    }
    const { next } = step_dynamics(ai_entity.dynamics, ai_entity.dynamics_baseline || {}, ai_deltas, { entropy, scope: "somatic" });
    ai_entity.dynamics = { ...ai_entity.dynamics, ...next };
  }

  if (fractal_entity && typeof fractal_entity.dynamics === "object") {
    const fractal_deltas = {};
    for (const key of ["velocity", "entropy"]) {
      if (deltas[key] !== undefined) fractal_deltas[key] = deltas[key];
    }
    const { next } = step_dynamics(fractal_entity.dynamics, fractal_entity.dynamics_baseline || {}, fractal_deltas, { entropy, scope: "fractal" });
    fractal_entity.dynamics = { ...fractal_entity.dynamics, ...next };
  }
}

/**
 * Evaluates the automatic image trigger after a turn and spawns a beat
 * without blocking turn completion.
 */
export async function maybe_spawn_turn_image({ prose, outcome, ai_quadrant, fractal_quadrant, prev_dynamics, turn_round }) {
  if (!prose || !session.active_id) return;

  try {
    const last_director_beat_round = session.last_director_beat_round ?? -1;
    const last_dynamics_beat_round = session.last_dynamics_beat_round ?? -1;
    const resolved_image = resolve_image_trigger({
      snapshot: { ai: ai_quadrant, fractal: fractal_quadrant },
      prev_dynamics,
      director_data: outcome.director_staging || {},
      turn_round,
      last_director_beat_round,
      last_dynamics_beat_round,
    });

    if (resolved_image?.next_director_round != null) {
      session.last_director_beat_round = resolved_image.next_director_round;
    }
    if (resolved_image?.next_dynamics_round != null) {
      session.last_dynamics_beat_round = resolved_image.next_dynamics_round;
    }

    if (resolved_image?.active && resolved_image?.tier) {
      const queue = get_image_generation_queue();
      if (Array.isArray(queue) && queue.length < IMAGE_POLICY.MAX_PENDING_IMAGES) {
        spawn_image_beat(
          resolved_image.tier,
          {
            explicit: resolved_image.director_explicit,
            source: resolved_image.source || "dynamics",
            prompt: prose,
            visual_staging: outcome.director_staging?.camera_note || "",
          },
          { app, session },
        ).catch((image_err) => {
          console.warn("[Turns] Automatic image beat dispatch error:", image_err);
        });
      }
    }
  } catch (trigger_err) {
    console.warn("[Turns] Image trigger evaluation non-fatal warning:", trigger_err);
  }
}

/**
 * Executes a simulation turn against the active session and execution stores.
 *
 * @param {string} user_input
 * @param {{ signal?: AbortSignal, is_retry?: boolean, is_continue?: boolean, is_opening_turn?: boolean }} [_options={}]
 * @returns {Promise<object | null>}
 */
export async function run_turn(user_input, _options = {}) {
  const resubmitting = Boolean(_options.is_retry || _options.is_continue);
  const allow_empty = Boolean(resubmitting || _options.is_opening_turn);
  const trimmed_input = typeof user_input === "string" ? user_input.trim() : "";
  if (!allow_empty && !trimmed_input) return null;

  begin_turn_scope();

  const { user_quadrant, ai_quadrant, fractal_quadrant, history } = build_turn_context(app, session.feed || []);

  if (!_options.is_opening_turn && trimmed_input) {
    const last_entry = history[history.length - 1];
    if (!(last_entry && last_entry.role === "user" && last_entry.text === trimmed_input)) {
      history.push({ role: "user", text: trimmed_input, round: Number(session.round || 0) + (resubmitting ? 0 : 1) });
    }
  }

  const previous_round = Number(session.round || 0);
  if (!resubmitting) session.round = previous_round + 1;
  const turn_round = Number(session.round || 0);

  const message_node_id = `msg-${Date.now()}`;
  execution.start_stream(message_node_id, "ai");
  const stage_once = create_first_chunk_stager(ai_quadrant);

  try {
    const outcome = await run_round({
      transport: get_transport(),
      round: turn_round,
      entities: { AI: ai_quadrant, USER: user_quadrant, FRACTAL: fractal_quadrant },
      history,
      onChunk: (chunk) => {
        stage_once();
        execution.update_stream(chunk);
      },
      signal: _options.signal,
    });

    stage_once();

    const prose = outcome?.character_turn?.prose || "";
    const think = outcome?.character_turn?.think || "";

    const prev_ai_dynamics = { ...(ai_quadrant.dynamics || {}) };
    const prev_fractal_dynamics = { ...(fractal_quadrant.dynamics || {}) };

    apply_dynamics_step(ai_quadrant, fractal_quadrant, outcome.director_staging?.dynamics_deltas);

    await persist_turn_rows({
      prose,
      think,
      outcome,
      ai_name: ai_quadrant.name || "AI",
      story_id: session.active_id,
      round: turn_round,
      dynamics_ai: ai_quadrant.dynamics,
      dynamics_fractal: fractal_quadrant.dynamics,
      snapshots: { AI: ai_quadrant, USER: user_quadrant, FRACTAL: fractal_quadrant },
    });

    await write_back_turn_state({ ai: ai_quadrant, fractal: fractal_quadrant, user: user_quadrant, round: turn_round, outcome, options: _options });

    Audio?.play?.("notification");

    await maybe_spawn_turn_image({
      prose,
      outcome,
      ai_quadrant,
      fractal_quadrant,
      prev_dynamics: { ai: prev_ai_dynamics, fractal: prev_fractal_dynamics },
      turn_round,
    });

    return outcome;
  } catch (err) {
    session.round = previous_round;
    throw err;
  } finally {
    end_turn_scope();
    execution.end_stream();
  }
}

/**
 * Continues an existing message entry in place.
 *
 * @param {object} target_entry
 * @param {{ signal?: AbortSignal }} [_options={}]
 * @returns {Promise<object>}
 */
export async function continue_turn(target_entry, _options = {}) {
  if (!target_entry || !target_entry.id) {
    throw new Error("Target message entry required for continuation.");
  }

  begin_turn_scope();

  try {
    const feed = session.feed || [];
    const target_index_in_feed = feed.findIndex((e) => String(e.id) === String(target_entry.id));
    const prior_feed = target_index_in_feed >= 0 ? feed.slice(0, target_index_in_feed) : feed;
    const { user_quadrant, ai_quadrant, fractal_quadrant, history } = build_turn_context(app, prior_feed);

    let target_prose = target_entry.text || "";
    let target_think = target_entry.meta?.think || "";

    if (target_prose.includes("<think>") || target_prose.includes("<THINK>")) {
      const extracted = parse_think_block(target_prose);
      target_prose = extracted.prose;
      if (!target_think && extracted.think) {
        target_think = extracted.think;
      }
    }

    execution.start_stream(target_entry.id, "ai");
    const clean_target_prose = target_prose.trim();
    const { separator } = resolve_continuation_separator(clean_target_prose);
    if (clean_target_prose) {
      execution.update_stream(`${clean_target_prose}${separator}`);
    }

    const stage_once = create_first_chunk_stager(ai_quadrant);

    try {
      const outcome = await continue_generation_step({
        transport: get_transport(),
        round: target_entry.round || session.round,
        entities: { AI: ai_quadrant, USER: user_quadrant, FRACTAL: fractal_quadrant },
        history,
        target_prose,
        target_think,
        signal: _options.signal,
        onChunk: (chunk) => {
          if (!chunk) return;
          if (clean_target_prose && (chunk.includes(clean_target_prose) || (target_think && chunk.includes(target_think)))) {
            return;
          }
          stage_once();
          execution.update_stream(chunk);
        },
      });

      stage_once();

      const fused_prose = outcome?.prose || target_prose;
      const fused_think = outcome?.think || target_think;

      await session.edit_entry(target_entry.id, fused_prose, { think: fused_think });
      const entry = feed.find((e) => String(e.id) === String(target_entry.id));
      if (entry) {
        entry.meta = entry.meta || {};
        entry.meta.think = fused_think;
      }

      Audio?.play?.("notification");
      return outcome;
    } finally {
      end_turn_scope();
    }
  } finally {
    execution.end_stream();
  }
}

/**
 * Writes back turn dynamics, confirms the round counter, persists entities,
 * and dispatches non-blocking Turn 3 Caretaker consolidation.
 */
export async function write_back_turn_state({ ai, fractal, user, round, outcome, options = {} } = {}) {
  if (ai?.dynamics) {
    if (session.active_ai) session.active_ai.dynamics = { ...ai.dynamics };
    session.ai_dynamics = { ...ai.dynamics };
  }
  if (fractal?.dynamics) {
    if (session.active_fractal) session.active_fractal.dynamics = { ...fractal.dynamics };
    session.fractal_dynamics = { ...fractal.dynamics };
  }
  if (user?.dynamics && session.active_user) {
    session.active_user.dynamics = { ...user.dynamics };
  }

  if (typeof round === "number") session.round = round;

  const save_promises = [];
  if (session.active_ai) save_promises.push(session.save_entity("character", session.active_ai));
  if (session.active_fractal) save_promises.push(session.save_entity("fractal", session.active_fractal));
  if (session.active_user) save_promises.push(session.save_entity("character", session.active_user));
  save_promises.push(session.save(session.round));

  await Promise.allSettled(save_promises);

  const prose = outcome?.character_turn?.prose || "";
  if (prose.trim() && !options.signal?.aborted) {
    dispatch_consolidation({ ai, user, fractal, round: Number(session.round ?? 0) }, get_transport(), options.signal).catch((err) => {
      console.warn("[Turns] Caretaker background execution error:", err);
    });
  }
}

/**
 * Runs Turn 3 Caretaker consolidation in the background and commits updated
 * quadrant brackets to active entity state and IndexedDB.
 */
export async function dispatch_consolidation({ ai, user, fractal, history, round } = {}, transport, signal = null) {
  if (signal?.aborted) return;

  const entities = { AI: ai ?? session.active_ai, USER: user ?? session.active_user, FRACTAL: fractal ?? session.active_fractal };
  const context_history =
    Array.isArray(history) ? history : reconstruct_history_from_feed(session.feed || [], { user: entities.USER, ai: entities.AI, fractal: entities.FRACTAL });
  const context_round = typeof round === "number" ? round : Number(session.round ?? 0);

  try {
    const target_entity_key = resolve_caretaker_target(session.back_shot_cursor ?? 0, entities, true);

    const caretaker_outcome = await run_memory_consolidation_step({
      transport,
      round: context_round,
      entities,
      history: context_history,
      target_entity_key,
      signal,
    });

    if (!caretaker_outcome?.target) return;

    if (!caretaker_outcome.parse_succeeded) {
      console.warn(`[Caretaker] Caretaker response unparseable after retry for ${caretaker_outcome.target} - keeping cursor on target.`);
      return;
    }

    const target_key = caretaker_outcome.target.toUpperCase();
    const target_entity =
      target_key === "USER" ? session.active_user
      : target_key === "FRACTAL" ? session.active_fractal
      : session.active_ai;

    if (!target_entity) return;

    let has_changes = false;
    const entry_round = Number(context_round ?? 0);

    if (caretaker_outcome.present_physical) {
      target_entity.present = target_entity.present || { physical: "", non_physical: "" };
      const current_phys = typeof target_entity.present.physical === "string" ? target_entity.present.physical : "";
      target_entity.present.physical = apply_tagged_field_deltas(current_phys, caretaker_outcome.present_physical);
      has_changes = true;
    }

    if (caretaker_outcome.present_non_physical) {
      target_entity.present = target_entity.present || { physical: "", non_physical: "" };
      const current_non = typeof target_entity.present.non_physical === "string" ? target_entity.present.non_physical : "";
      target_entity.present.non_physical = apply_tagged_field_deltas(current_non, caretaker_outcome.present_non_physical);
      has_changes = true;
    }

    if (caretaker_outcome.future_text) {
      const current_future = typeof target_entity.future === "string" ? target_entity.future : "";
      target_entity.future = apply_tagged_field_deltas(current_future, caretaker_outcome.future_text);
      has_changes = true;
    }

    if (caretaker_outcome.past_text) {
      const current_past = typeof target_entity.past === "string" ? target_entity.past : "";
      target_entity.past = apply_tagged_field_deltas(current_past, caretaker_outcome.past_text);
      has_changes = true;
    }

    if (has_changes) {
      const entity_type = target_key === "FRACTAL" ? "fractal" : "character";
      await session.save_entity(entity_type, target_entity);

      if (session.active_id) {
        try {
          const present_combined = [caretaker_outcome.present_physical, caretaker_outcome.present_non_physical].filter(Boolean).join(" ");
          await session.log_message("", "system", "Caretaker", {
            turn_type: "SYSTEM_TURN",
            round: entry_round,
            story_id: session.active_id,
            snapshots: { AI: entities.AI, USER: entities.USER, FRACTAL: entities.FRACTAL },
            meta: {
              type: "CONTINUUM_FORMATION",
              target: target_key,
              present: present_combined,
              future: caretaker_outcome.future_text || "",
              past: caretaker_outcome.past_text || "",
              thought_process: caretaker_outcome._thought_process || "",
            },
          });
        } catch (card_err) {
          console.warn("[Turns] Failed to emit caretaker telemetry card:", card_err);
        }
      }
    }

    session.back_shot_cursor = (Number(session.back_shot_cursor) || 0) + 1;
  } catch (caretaker_err) {
    console.warn(`[Caretaker] Caretaker execution warning: ${caretaker_err?.message || caretaker_err}`);
  }
}
