/**
 * src/engine/runs.js
 * ============================================================================
 * 🏃 ENGINE RUNS - SESSION TURN PIPELINE (PHASE 3: DIRECT-STORE FOLD)
 * ============================================================================
 *
 * Turn execution operates DIRECTLY on the owning stores — there is no Kernel
 * session object and no state mirroring:
 * - `runtime` owns user / ai / fractal / round (+ dynamics mirrors + beat fields)
 * - `simulation_log.feed` owns history (context is reconstructed per turn)
 * - `simulation_state` (status) owns phase / intent (plus a module in-flight
 *   guard below for re-entrancy while a turn streams)
 *
 * Turn-scoped working copies (normalized quadrants) are function-local
 * transients: director deltas apply to them, then write-back copies dynamics
 * into runtime. A failed turn discards the copies and restores the round, so
 * live stores are never left half-mutated.
 *
 * Cross-layer contact: `app` streaming/log calls arrive via direct `@state`
 * imports (Rank 4 → Rank 3, downward). No bridge cells remain.
 */

import { IMAGE_POLICY } from "@config";
import { append_ledger_entries, db, normalize_entity } from "@data";
import { apply_tagged_field_deltas as apply_bracket_deltas, parse_tagged_fields as parse_bracket_entries, parse_think_block } from "@simulation";
import { get_image_generation_queue, resolve_image_trigger, spawn_image_beat } from "@media";
import { app, runtime, session_driver, simulation_log, simulation_state } from "@state";
import { get_transport } from "./transport.js";
import { execute_turn_2_continue, execute_turn_3_caretaker, execute_round, reconstruct_history_from_feed, resolve_caretaker_target } from "./turns.js";

/**
 * Applies Turn 1 director dynamics deltas to entity dynamics with [5, 95] clamping.
 * Pure helper: operates on the passed quadrant objects only.
 *
 * @param {object|null} ai_entity - AI quadrant entity (mutated in place)
 * @param {object|null} fractal_entity - Fractal quadrant entity (mutated in place)
 * @param {object|null} deltas - Director dynamics deltas
 */
export function apply_director_deltas_to_dynamics(ai_entity, fractal_entity, deltas) {
  if (!deltas) return;
  if (ai_entity && typeof ai_entity.dynamics === "object") {
    for (const key of ["chaos", "intensity", "openness", "affinity"]) {
      if (deltas[key] !== undefined && ai_entity.dynamics[key] !== undefined) {
        const current = Number(ai_entity.dynamics[key]) || 50;
        ai_entity.dynamics[key] = Math.max(5, Math.min(95, current + deltas[key]));
      }
    }
  }
  if (fractal_entity && typeof fractal_entity.dynamics === "object") {
    for (const key of ["velocity", "entropy"]) {
      if (deltas[key] !== undefined && fractal_entity.dynamics[key] !== undefined) {
        const current = Number(fractal_entity.dynamics[key]) || 50;
        fractal_entity.dynamics[key] = Math.max(5, Math.min(95, current + deltas[key]));
      }
    }
  }
}

// ---------------------------------------------------------------------------
// Turn re-entrancy guard (replaces the old per-session phase field — phase
// itself remains solely owned by simulation_state; this flag only guards
// overlapping execute_turn / execute_continue calls on this module).
// ---------------------------------------------------------------------------

let _turn_in_flight = false;

/**
 * Resets the turn re-entrancy guard. Test-only: call from beforeEach alongside
 * reset_registries_for_testing so a failed turn never wedges the suite.
 */
export function reset_turn_scope_for_testing() {
  _turn_in_flight = false;
}

function _begin_turn_scope() {
  if (_turn_in_flight) throw new Error("Simulation is locked or actively generating.");
  _turn_in_flight = true;
}

function _end_turn_scope() {
  _turn_in_flight = false;
}

/**
 * Builds transient turn context: normalized quadrant copies for the LLM call
 * plus history reconstructed from the owned feed. Nothing here is stored —
 * callers persist rows and write back explicitly on success.
 */
function build_turn_context(app, feed) {
  const user_quadrant = normalize_entity(runtime.active_user || app.selected_user || {});
  const ai_quadrant = normalize_entity(runtime.active_ai || app.selected_ai || {});
  const fractal_quadrant = normalize_entity(runtime.active_fractal || app.selected_fractal || {});
  const history = reconstruct_history_from_feed(feed, { user: user_quadrant, ai: ai_quadrant, fractal: fractal_quadrant });
  return { user_quadrant, ai_quadrant, fractal_quadrant, history };
}

/**
 * Commits a finished turn to persistence and the reactive feed: the director-turn
 * row first, then the character-turn AI row (chronological cause-before-effect).
 * Caretaker consolidation still appends last via dispatch_caretaker_consolidation.
 */
async function persist_turn_rows({ prose, think, outcome, ai_name, story_id, round, dynamics_ai, dynamics_fractal, snapshots }) {
  if (!prose || !story_id) return;

  // A2: snapshot post-clamp axis levels alongside signed deltas so gauges render
  // true 0..100 fullness + (±delta) badges. Legacy rows without `levels` fall back
  // to delta-magnitude bars in ChatBubble.
  const levels = dynamics_ai || dynamics_fractal ? { ...(dynamics_ai || {}), ...(dynamics_fractal || {}) } : undefined;

  // Director turn first (C1: chronology over stability - accepted devmode jump on commit).
  let logged_delta = null;
  if (outcome.director_staging?.dynamics_deltas) {
    logged_delta = await session_driver.log_message("", "system", "Director", {
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

  const logged_entry = await session_driver.log_message(prose, "ai", ai_name, {
    turn_type: "AI_TURN",
    round,
    story_id,
    snapshots,
    meta: { think, director_staging: outcome.director_staging },
  });

  // Force explicit ordering so same-ms Date.now() ties can't flip on reload
  // (load_log sorts by created_at; live feed already appended delta-first).
  if (logged_delta && logged_entry && logged_delta.created_at >= logged_entry.created_at) {
    try {
      const fixed = logged_entry.created_at - 1;
      await db.simulation_log.update(logged_delta.id, { created_at: fixed });
      logged_delta.created_at = fixed;
      simulation_log?.update?.(logged_delta.id, { created_at: fixed });
    } catch {
      // Ordering is best-effort; insertion order already holds live.
    }
  }
}

/**
 * Evaluates the automatic image trigger after a turn and spawns the beat
 * without ever blocking the turn. Honors the configured pending cap.
 */
async function maybe_spawn_turn_image({ prose, outcome, ai_quadrant, fractal_quadrant, turn_round }) {
  // B19: Wire automatic visual synthesis into turn (fire-and-forget, non-blocking)
  if (prose && runtime.story_id) {
    try {
      const last_director_beat_round = runtime.last_director_beat_round ?? -1;
      const last_dynamics_beat_round = runtime.last_dynamics_beat_round ?? -1;
      const resolved_image = resolve_image_trigger({
        snapshot: { ai: ai_quadrant, fractal: fractal_quadrant },
        prev_dynamics: ai_quadrant.dynamics ? { ...ai_quadrant.dynamics } : null,
        director_data: outcome.director_staging || {},
        turn_round,
        last_director_beat_round,
        last_dynamics_beat_round,
      });

      if (resolved_image?.next_director_round != null) {
        runtime.last_director_beat_round = resolved_image.next_director_round;
      }
      if (resolved_image?.next_dynamics_round != null) {
        runtime.last_dynamics_beat_round = resolved_image.next_dynamics_round;
      }

      const is_image_trigger_active = Boolean(resolved_image?.active);
      const image_tier = resolved_image?.tier;

      if (is_image_trigger_active && image_tier) {
        const queue = get_image_generation_queue();
        if (Array.isArray(queue) && queue.length < IMAGE_POLICY.MAX_PENDING_IMAGES) {
          spawn_image_beat(
            image_tier,
            {
              explicit: resolved_image.director_explicit,
              source: resolved_image.source || "dynamics",
              prompt: prose,
              visual_staging: outcome.director_staging?.camera_note || "",
            },
            { app, runtime, session_driver, simulation_log },
          ).catch((image_err) => {
            console.warn("[Bridge] Automatic image beat dispatch error:", image_err);
          });
        }
      }
    } catch (trigger_err) {
      console.warn("[Bridge] Image trigger evaluation non-fatal warning:", trigger_err);
    }
  }
}

/**
 * Executes a simulation turn directly against the owning stores.
 *
 * @param {string} user_input - The submitted user message text.
 * @param {object} options
 * @param {AbortSignal} [options.signal]
 * @returns {Promise<object>} Outcome containing character_turn, director_staging, etc.
 */
export async function execute_turn(user_input, _options = {}) {
  const resubmitting = Boolean(_options.is_retry || _options.is_continue);
  const trimmed_input = typeof user_input === "string" ? user_input.trim() : "";
  if (!resubmitting && !trimmed_input) return null;

  _begin_turn_scope();

  // Transient working copies + reconstructed context (owned stores untouched).
  const { user_quadrant, ai_quadrant, fractal_quadrant, history } = build_turn_context(app, simulation_log?.feed || []);

  // A direct call without a prior session_driver.send (tests, prologue opening
  // turn) still needs the prompt text in context — feed-backed calls dedupe it.
  if (trimmed_input) {
    const last_entry = history[history.length - 1];
    if (!(last_entry && last_entry.role === "user" && last_entry.text === trimmed_input)) {
      history.push({ role: "user", text: trimmed_input, round: Number(runtime.round || 0) + (resubmitting ? 0 : 1) });
    }
  }

  const previous_round = Number(runtime.round || 0);
  if (!resubmitting) runtime.round = previous_round + 1;
  const turn_round = Number(runtime.round || 0);

  // 4. Begin UI streaming indicator
  const message_node_id = `msg-${Date.now()}`;
  app.start_stream(message_node_id, "ai");

  let first_chunk = true;
  const stage_ai_speaker = () => {
    simulation_state.set_delegated_speaker({
      type: "ai",
      name: ai_quadrant.name || "AI",
      avatar: ai_quadrant.profile_picture || null,
      color: ai_quadrant.signature_color || null,
    });
    simulation_state.start_stream_stage();
  };

  try {
    const outcome = await execute_round({
      transport: get_transport(),
      round: turn_round,
      entities: { AI: ai_quadrant, USER: user_quadrant, FRACTAL: fractal_quadrant },
      history,
      director_enabled: Boolean(app?.settings?.director_enabled),
      onChunk: (chunk) => {
        if (first_chunk) {
          first_chunk = false;
          stage_ai_speaker();
        }
        app.update_stream(chunk);
      },
      signal: _options.signal,
    });

    // If onChunk never fired (e.g. non-streaming transport or mock without chunks), ensure stages transition cleanly
    if (first_chunk) {
      first_chunk = false;
      stage_ai_speaker();
    }

    const prose = outcome?.character_turn?.prose || "";
    const think = outcome?.character_turn?.think || "";

    // Apply director deltas to the transient copies first; write-back copies
    // them into runtime only after the rows below commit. A failure anywhere
    // above discards the copies — live dynamics are never half-mutated.
    apply_director_deltas_to_dynamics(ai_quadrant, fractal_quadrant, outcome.director_staging?.dynamics_deltas);

    // 5. Commit generated turn to IndexedDB log and reactive feed
    await persist_turn_rows({
      prose,
      think,
      outcome,
      ai_name: ai_quadrant.name || "AI",
      story_id: runtime.story_id,
      round: turn_round,
      dynamics_ai: ai_quadrant.dynamics,
      dynamics_fractal: fractal_quadrant.dynamics,
      snapshots: { AI: ai_quadrant, USER: user_quadrant, FRACTAL: fractal_quadrant },
    });

    // Resolves Gap 4: Write back updated dynamics, macro round, and caretaker deltas
    await write_back_turn_state({ ai: ai_quadrant, fractal: fractal_quadrant, user: user_quadrant, round: turn_round, outcome, options: _options });

    await maybe_spawn_turn_image({ prose, outcome, ai_quadrant, fractal_quadrant, turn_round });

    return outcome;
  } catch (err) {
    runtime.round = previous_round;
    throw err;
  } finally {
    _end_turn_scope();
    app.end_stream();
  }
}
/**
 * Continues an existing message in place, operating directly on the owned feed.
 * Formulates startWith from the target message's think-block and prose, streams
 * the continuation, and fuses the result directly onto the target message.
 *
 * @param {object} target_entry - Message entry to continue
 * @param {object} [_options={}]
 * @param {AbortSignal} [_options.signal]
 * @returns {Promise<object>} The continuation outcome
 */
export async function execute_continue(target_entry, _options = {}) {
  if (!target_entry || !target_entry.id) {
    throw new Error("Target message entry required for continuation.");
  }

  _begin_turn_scope();

  try {
    // 1-3. Transient quadrants + history scoped to the target message
    const feed = simulation_log?.feed || [];
    const target_index_in_feed = feed.findIndex((e) => String(e.id) === String(target_entry.id));

    // Slice raw feed before target message so telemetry/empty entries don't skew index alignment
    const prior_feed = target_index_in_feed >= 0 ? feed.slice(0, target_index_in_feed) : feed;
    const { user_quadrant, ai_quadrant, fractal_quadrant, history } = build_turn_context(app, prior_feed);

    // Extract existing think and prose from target entry, robustly handling embedded <think>/<THINK> blocks
    let target_prose = target_entry.text || "";
    let target_think = target_entry.meta?.think || "";

    if (target_prose.includes("<think>") || target_prose.includes("<THINK>")) {
      const extracted = parse_think_block(target_prose);
      target_prose = extracted.prose;
      if (!target_think && extracted.think) {
        target_think = extracted.think;
      }
    }

    // 4. Begin UI streaming indicator targeting this message, seeded with existing prose so continuation appends smoothly
    app.start_stream(target_entry.id, "ai");
    const clean_target_prose = target_prose.trim();
    const ends_with_terminal = /[.!?…"”'’*)\]]$/.test(clean_target_prose);
    const stream_seed_separator = ends_with_terminal ? "\n\n" : " ";
    if (clean_target_prose) {
      app.update_stream(`${clean_target_prose}${stream_seed_separator}`);
    }

    let first_chunk = true;
    const stage_ai_speaker = () => {
      simulation_state.set_delegated_speaker({
        type: "ai",
        name: ai_quadrant.name || "AI",
        avatar: ai_quadrant.profile_picture || null,
        color: ai_quadrant.signature_color || null,
      });
      simulation_state.start_stream_stage();
    };

    try {
      const outcome = await execute_turn_2_continue({
        transport: get_transport(),
        round: target_entry.round || runtime.round,
        entities: { AI: ai_quadrant, USER: user_quadrant, FRACTAL: fractal_quadrant },
        history,
        target_prose,
        target_think,
        signal: _options.signal,
        onChunk: (chunk) => {
          if (!chunk) return;
          // Ignore echoed startWith chunk from Perchance ai-text-plugin so pre-seeded target_prose is never duplicated
          if (clean_target_prose && (chunk.includes(clean_target_prose) || (target_think && chunk.includes(target_think)))) {
            return;
          }
          if (first_chunk) {
            first_chunk = false;
            stage_ai_speaker();
          }
          app.update_stream(chunk);
        },
      });

      // If onChunk never fired (e.g. non-streaming or mock without chunks), ensure stages transition cleanly
      if (first_chunk) {
        first_chunk = false;
        stage_ai_speaker();
      }

      const fused_prose = outcome?.prose || target_prose;
      const fused_think = outcome?.think || target_think;

      // 5. Commit fused continuation to persistence and active feed
      if (simulation_log && typeof simulation_log.edit_entry === "function") {
        await simulation_log.edit_entry(target_entry.id, fused_prose);
        // Update entry meta think in-memory if present
        const entry = feed.find((e) => String(e.id) === String(target_entry.id));
        if (entry) {
          entry.meta = entry.meta || {};
          entry.meta.think = fused_think;
        }
      }

      return outcome;
    } finally {
      _end_turn_scope();
    }
  } finally {
    app.end_stream();
  }
}
/**
 * Writes back turn outcomes into active stores and IndexedDB.
 *
 * Resolves Gap 4:
 * 1. Synchronizes updated AI dynamics into runtime.active_ai and ai mirrors.
 * 2. Synchronizes updated Fractal dynamics into runtime.active_fractal and fractal mirrors.
 * 3. Confirms runtime.round (already advanced by the turn).
 * 4. Persists the updated entities & story round into IndexedDB via runtime.save_entity and runtime.save.
 * 5. Runs Turn 3 Caretaker background consolidation and records state diffs.
 *
 * @param {object} turn - Folded turn output ({ ai, fractal, user, round, outcome })
 * @param {object} turn.ai - Post-delta AI quadrant (transient copy)
 * @param {object} turn.fractal - Post-delta fractal quadrant (transient copy)
 * @param {object} turn.user - User quadrant (transient copy)
 * @param {number} turn.round - The round just executed
 * @param {object} turn.outcome - execute_round outcome
 * @param {object} [turn.options={}] - Abort signal carrier ({ signal })
 * @returns {Promise<void>}
 */
export async function write_back_turn_state({ ai, fractal, user, round, outcome, options = {} } = {}) {
  if (!runtime) return;

  // 1-3. Write back quadrant dynamics (AI/Fractal mirror into setter, active, and physics; User writes active only)
  const dynamics = { ai: ai?.dynamics, fractal: fractal?.dynamics };
  for (const role of ["ai", "fractal"]) {
    const role_dynamics = dynamics[role];
    if (!role_dynamics) continue;
    if (role in runtime) {
      runtime[role] = { ...role_dynamics };
    }
    const active = role === "ai" ? runtime.active_ai : runtime.active_fractal;
    if (active) {
      active.dynamics = { ...role_dynamics };
    }
    const physics = role === "ai" ? runtime.ai_physics : runtime.fractal_physics;
    if (physics) {
      Object.assign(physics, role_dynamics);
    }
  }
  if (user?.dynamics && runtime.active_user) {
    runtime.active_user.dynamics = { ...user.dynamics };
  }

  // 4. Confirm macro round counter (advanced pre-generation; re-asserted here so
  // write-back is the single place the round lands).
  if (typeof round === "number") runtime.round = round;

  // 5. Persist updated entities & story round into IndexedDB
  const save_promises = [];
  if (runtime.active_ai) {
    save_promises.push(runtime.save_entity("character", runtime.active_ai));
  }
  if (runtime.active_fractal) {
    save_promises.push(runtime.save_entity("fractal", runtime.active_fractal));
  }
  if (runtime.active_user) {
    save_promises.push(runtime.save_entity("character", runtime.active_user));
  }
  save_promises.push(runtime.save(runtime.round));

  await Promise.allSettled(save_promises);

  // 6. Turn 3: Caretaker background maintenance (dispatched un-awaited to free UI turn latency)
  // Gate execution on non-empty character prose and non-aborted signal (fizzle-path hygiene)
  const prose = outcome?.character_turn?.prose || "";
  if (prose.trim() && !options.signal?.aborted) {
    dispatch_caretaker_consolidation({ ai, user, fractal, round: Number(runtime.round ?? 0) }, get_transport(), options.signal).catch((err) => {
      console.warn("[Bridge] Caretaker background execution error:", err);
    });
  }
}
/**
 * Runs Turn 3 Caretaker maintenance in the background and commits full 4-quadrant bracket updates
 * (present.physical, present.non_physical, future, and past) to active entity state and IndexedDB.
 *
 * Context is explicit: transient quadrants plus an optional history array.
 * When history is omitted it is reconstructed from the owned feed.
 *
 * @param {object} turn - Turn context ({ ai, user, fractal, history?, round? })
 * @param {object} transport
 * @param {AbortSignal} [signal=null]
 * @returns {Promise<void>}
 */
export async function dispatch_caretaker_consolidation({ ai, user, fractal, history, round } = {}, transport, signal = null) {
  if (signal?.aborted) return;
  if (!runtime) return;

  const entities = { AI: ai ?? runtime.active_ai, USER: user ?? runtime.active_user, FRACTAL: fractal ?? runtime.active_fractal };
  const context_history =
    Array.isArray(history) ? history : (
      reconstruct_history_from_feed(simulation_log?.feed || [], { user: entities.USER, ai: entities.AI, fractal: entities.FRACTAL })
    );
  const context_round = typeof round === "number" ? round : Number(runtime.round ?? 0);

  try {
    const target_entity_key = resolve_caretaker_target(runtime.back_shot_cursor ?? 0, entities, true);

    const caretaker_outcome = await execute_turn_3_caretaker({
      transport,
      round: context_round,
      entities,
      history: context_history,
      target_entity_key,
      signal,
    });

    if (!caretaker_outcome?.target) return;

    if (!caretaker_outcome.parse_succeeded) {
      app?.log?.(`[Caretaker] Caretaker response unparseable after retry for ${caretaker_outcome.target} - keeping cursor on target.`, "warn");
      return;
    }

    const target_key = caretaker_outcome.target.toUpperCase();
    const target_entity =
      target_key === "USER" ? runtime.active_user
      : target_key === "FRACTAL" ? runtime.active_fractal
      : runtime.active_ai;

    if (!target_entity) return;

    let has_changes = false;
    const ledger_entries = [];
    const story_id = runtime.story_id ?? null;
    const entry_round = Number(context_round ?? 0);
    const entity_id = String(target_entity.id || target_key.toLowerCase());

    const helper_record_ledger = (field, delta_text) => {
      if (!delta_text) return;
      const parsed_items = parse_bracket_entries(delta_text);
      for (const item of parsed_items) {
        ledger_entries.push({
          story_id,
          round: entry_round,
          seq: 3, // Caretaker continuum phase
          entity_id,
          field,
          key: item.key,
          new_value: item.value,
          visibility:
            item.flags ?
              item.flags.hide ? "hide"
              : item.flags.show ? "show"
              : null
            : item.visibility || null,
          weight: item.flags ? (item.flags.weight ?? null) : (item.weight ?? null),
          writer: "caretaker",
          decider: "caretaker",
        });
      }
    };

    // 1. Present physical
    if (caretaker_outcome.present_physical) {
      target_entity.present = target_entity.present || { physical: "", non_physical: "" };
      const current_phys = typeof target_entity.present.physical === "string" ? target_entity.present.physical : "";
      target_entity.present.physical = apply_bracket_deltas(current_phys, caretaker_outcome.present_physical);
      helper_record_ledger("present.physical", caretaker_outcome.present_physical);
      has_changes = true;
    }

    // 2. Present non-physical
    if (caretaker_outcome.present_non_physical) {
      target_entity.present = target_entity.present || { physical: "", non_physical: "" };
      const current_non = typeof target_entity.present.non_physical === "string" ? target_entity.present.non_physical : "";
      target_entity.present.non_physical = apply_bracket_deltas(current_non, caretaker_outcome.present_non_physical);
      helper_record_ledger("present.non_physical", caretaker_outcome.present_non_physical);
      has_changes = true;
    }

    // 3. Future (standing agenda)
    if (caretaker_outcome.future_text) {
      const current_future = typeof target_entity.future === "string" ? target_entity.future : "";
      target_entity.future = apply_bracket_deltas(current_future, caretaker_outcome.future_text);
      helper_record_ledger("future", caretaker_outcome.future_text);
      has_changes = true;
    }

    // 4. Past (semantic memories)
    if (caretaker_outcome.past_text) {
      const current_past = typeof target_entity.past === "string" ? target_entity.past : "";
      target_entity.past = apply_bracket_deltas(current_past, caretaker_outcome.past_text);
      helper_record_ledger("past", caretaker_outcome.past_text);
      has_changes = true;
    }

    if (has_changes) {
      const entity_type = target_key === "FRACTAL" ? "fractal" : "character";
      await runtime.save_entity(entity_type, target_entity);

      if (ledger_entries.length > 0) {
        try {
          await append_ledger_entries(ledger_entries);
        } catch (ledger_err) {
          console.warn("[Bridge] Failed to append caretaker ledger entries:", ledger_err);
        }
      }

      // Emit CONTINUUM_FORMATION telemetry card so Caretaker consolidation appears in the timeline
      if (runtime.story_id) {
        try {
          const present_combined = [caretaker_outcome.present_physical, caretaker_outcome.present_non_physical].filter(Boolean).join(" ");
          await session_driver.log_message("", "system", "Caretaker", {
            turn_type: "SYSTEM_TURN",
            round: entry_round,
            story_id: runtime.story_id,
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
          console.warn("[Bridge] Failed to emit caretaker telemetry card:", card_err);
        }
      }
      // Advance completion-driven cursor only after state write-back succeeds
      runtime.back_shot_cursor = (Number(runtime.back_shot_cursor) || 0) + 1;
    } else {
      // If no changes were needed, still advance cursor as target was successfully processed
      runtime.back_shot_cursor = (Number(runtime.back_shot_cursor) || 0) + 1;
    }
  } catch (caretaker_err) {
    app?.log?.(`[Caretaker] Caretaker execution warning: ${caretaker_err?.message || caretaker_err}`, "warn");
    console.warn("[Bridge] Caretaker write-back non-fatal warning:", caretaker_err);
  }
}
/**
 * CHANGELOG:
 * - Phase 3: kernel.svelte.js deleted. Turn transactions fold into this module
 *   operating directly on runtime / simulation_log / simulation_state — no
 *   session object, no Kernel class, no state mirroring. Round/dynamics
 *   rollback restores the owning stores; history is reconstructed per turn.
 * - Phase 3 prep: prod path built a plain turn session via create_turn_session
 *   (removed); Kernel compat holder removed with it.
 * - 2026-11-10: Created from bridge.js run atoms: quadrant/history preamble,
 *   row commits, visual beat, write-back triple mirror, caretaker dispatch.
 */
