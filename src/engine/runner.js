/**
 * src/engine/runner.js
 * ============================================================================
 * 🏃 ENGINE RUNNER - TURN ORCHESTRATION (PHASE 5: turns.js + runs.js MERGE)
 * ============================================================================
 *
 * Single home for LLM turn execution, replacing the old turns.js (pure step
 * executors) + runs.js (stateful session pipeline) split:
 *
 * Section 1 — Stateless LLM Step Executors (no store access; transport in):
 * - run_planner_step (Turn 1 Director JSON staging)
 * - run_generation_step (Turn 2 Character prose streaming + <think>)
 * - continue_generation_step (Turn 2 continue-in-place with echo-strip +
 *   fresh-buffer fallback)
 * - run_memory_consolidation_step (Turn 3 Caretaker diffs) and
 *   run_schema_extraction_step (profile structuring), sharing
 *   run_caretaker_json_step
 * - run_image_prompt_step (visualizer prompt refinement)
 * - generate_user_draft (ghostwriting with incremental <think>-gated streaming)
 *
 * Section 2 — Stateful Turn & Consolidation Orchestration (owns stores):
 * - run_round, run_turn, continue_turn, write_back_turn_state,
 *   dispatch_consolidation, persist_turn_rows, maybe_spawn_turn_image,
 *   reset_turn_scope_for_testing
 *
 * Canonical turn physics/history live in `@simulation` (single source of
 * truth); this module imports them rather than duplicating them. Dynamics
 * stepping routes through step_dynamics so turn gravity/baselines stay live.
 * Turn-scoped working copies are function-local transients: director deltas
 * apply to them, then write-back copies dynamics into runtime. A failed turn
 * discards the copies and restores the round, so live stores are never
 * half-mutated.
 *
 * Cross-layer contact: `app` streaming/log calls arrive through direct
 * `@state` imports (Rank 4 → Rank 3, downward). No bridge cells remain.
 */

import { IMAGE_POLICY } from "@config";
import { db, normalize_entity } from "@data";
import {
  apply_tagged_field_deltas,
  calculate_turn_tempo,
  compile_prompt,
  extract_metric_baselines,
  parse_tagged_fields,
  parse_think_block,
  PURPOSE_CORES,
  reconstruct_history_from_feed,
  resolve_caretaker_target,
  safe_parse_json,
  step_dynamics,
  resolve_image_trigger,
} from "@simulation";
import { Audio, get_image_generation_queue, spawn_image_beat } from "@media";
import { app, execution, session } from "@state";
import { get_transport } from "./transport.js";

// ============================================================================
// Section 1 — Stateless LLM Step Executors
// ============================================================================

/**
 * Normalizes prefilled startWith markers, parses <think>...</think> cognition,
 * and extracts the remainder body via canonical `@simulation` `parse_think_block`.
 *
 * @param {string} raw - Raw model output
 * @param {string} [start_with=""] - The startWith prefix sent to transport
 * @returns {{ think: string, body: string }}
 */
function extract_think_and_body(raw, start_with = "") {
  const { think, prose } = parse_think_block(raw, start_with);
  return { think: think || "", body: (prose || "").trim() };
}

/**
 * Runs Turn 1: Director turn (staging inference).
 *
 * @param {object} params
 * @param {object} params.transport - Transport interface with .stream()
 * @param {number} params.round
 * @param {object} params.entities
 * @param {Array<any>} params.history
 * @param {string} params.input
 * @returns {Promise<object>} Parsed director staging payload
 */
export async function run_planner_step({ transport, round = 1, entities = {}, history = [], signal = null }) {
  const prompt = compile_prompt({ core: "DIRECTOR", round, entities, history });

  const start_prefix = PURPOSE_CORES.DIRECTOR.start_with();
  let raw_output = await transport.stream(prompt, { startWith: start_prefix, signal, silent: true });

  const { think, body } = extract_think_and_body(raw_output, start_prefix);
  // Locate JSON block within body or raw output using safe_parse_json
  const parsed = safe_parse_json(body) || safe_parse_json(raw_output, { prefix: start_prefix });

  if (parsed) {
    // Sanitize and clamp numeric dynamics deltas to safe bounds
    const raw_deltas = parsed?.dynamics_deltas || {};
    const dynamics_deltas = {
      chaos: Math.max(-20, Math.min(20, Math.round(Number(raw_deltas.chaos) || 0))),
      intensity: Math.max(-20, Math.min(20, Math.round(Number(raw_deltas.intensity) || 0))),
      openness: Math.max(-20, Math.min(20, Math.round(Number(raw_deltas.openness) || 0))),
      affinity: Math.max(-20, Math.min(20, Math.round(Number(raw_deltas.affinity) || 0))),
      velocity: Math.max(-20, Math.min(20, Math.round(Number(raw_deltas.velocity) || 0))),
      entropy: Math.max(-20, Math.min(20, Math.round(Number(raw_deltas.entropy) || 0))),
    };

    const resolved_thought = think || (typeof parsed?._thought_process === "string" ? parsed._thought_process : "");

    return {
      _thought_process: resolved_thought,
      next_action: typeof parsed?.next_action === "string" ? parsed.next_action : "MAIN_CHARACTER",
      directors_note: typeof parsed?.directors_note === "string" ? parsed.directors_note : "",
      dynamics_deltas,
      camera_note: typeof parsed?.camera_note === "string" ? parsed.camera_note : "",
    };
  }

  return {
    _thought_process: think || "Direct staging fallback.",
    next_action: "MAIN_CHARACTER",
    directors_note: "Continue the scene naturally.",
    dynamics_deltas: { chaos: 0, intensity: 0, openness: 0, affinity: 0, velocity: 0, entropy: 0 },
    camera_note: "",
  };
}

/**
 * Runs Turn 2: Character turn.
 *
 * @param {object} params
 * @param {object} params.transport - Transport interface with .stream()
 * @param {number} params.round
 * @param {object} params.entities
 * @param {Array<any>} params.history
 * @param {Array<any>} params.memories
 * @param {string} [params.directors_note]
 * @param {(chunk: string) => void} [params.onChunk]
 * @returns {Promise<{ raw: string, think: string, prose: string, turn_tempo: number }>}
 */
export async function run_generation_step({
  transport,
  round = 1,
  entities = {},
  history = [],
  memories = [],
  directors_note = "",
  onChunk = null,
  signal = null,
}) {
  const turn_tempo = calculate_turn_tempo(history);
  const is_character = Boolean(entities.AI && entities.AI.type !== "fractal");

  const prompt = compile_prompt({ core: "CHARACTER", round, entities, history, memories, task_options: { directors_note, turn_tempo } });

  const start_with = PURPOSE_CORES.CHARACTER.start_with({ is_character, directors_note });
  let raw = await transport.stream(prompt, { onChunk, startWith: start_with, signal, silent: true });

  const { think, body: prose } = extract_think_and_body(raw, start_with);

  return { raw, think, prose, turn_tempo };
}

/**
 * Runs a direct Character continuation (Turn 2 continue-in-place).
 * Pre-fills startWith with existing think (if present) and prose so the LLM resumes directly mid-thought/prose.
 *
 * @param {object} params
 * @param {object} params.transport
 * @param {number} params.round
 * @param {object} params.entities
 * @param {Array<any>} params.history
 * @param {Array<any>} params.memories
 * @param {string} [params.target_prose]
 * @param {string} [params.target_think]
 * @param {(chunk: string) => void} [params.onChunk]
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{ raw: string, think: string, prose: string, continuation_prose: string, turn_tempo: number }>}
 */
export async function continue_generation_step({
  transport,
  round = 1,
  entities = {},
  history = [],
  memories = [],
  target_prose = "",
  target_think = "",
  onChunk = null,
  signal = null,
}) {
  // Continuations allow dynamic storytelling; assign a healthy 3-beat budget and flag is_continuation
  const turn_tempo = 3;

  const prompt = compile_prompt({ core: "CHARACTER", round, entities, history, memories, task_options: { turn_tempo, is_continuation: true } });

  const clean_prose = typeof target_prose === "string" ? target_prose.trim() : "";
  const clean_think = typeof target_think === "string" ? target_think.trim() : "";

  // Prepare start_with.
  // Perchance ai-text-plugin strips trailing spaces (" ") from startWith while preserving newlines ("\n").
  // When target_prose ends with terminal punctuation/quotes/asterisks, append "\n\n" so the host plugin
  // preserves the open boundary and the model starts a fresh continuation beat instead of emitting EOS.
  // For mid-sentence fragments (no terminal punctuation), append " " to continue inline.
  const ends_with_terminal = /[.!?…"”'’*)\]]$/.test(clean_prose);
  let prose_lead = clean_prose;
  if (prose_lead) {
    prose_lead = ends_with_terminal ? `${clean_prose}\n\n` : `${clean_prose} `;
  }

  let start_with = "<think>";
  if (clean_think) {
    start_with = `<think>${clean_think}</think>\n${prose_lead}`;
  } else if (clean_prose) {
    start_with = prose_lead;
  }

  let raw = await transport.stream(prompt, { onChunk, startWith: start_with, signal, silent: true });

  // Reconcile startWith prefix if stripped by transport or echoed by model
  if (raw && !raw.includes("<think>") && clean_think) {
    raw = `${start_with}\n${raw}`;
  } else if (raw && !raw.trimStart().startsWith("<think>") && clean_think) {
    raw = `<think>${clean_think}</think>\n${raw}`;
  }

  let { think, prose } = parse_think_block(raw);

  // Compute just the delta continuation (strip original target_prose if echoed at the start of generated prose)
  let continuation_prose = prose;
  if (clean_prose && continuation_prose.startsWith(clean_prose)) {
    continuation_prose = continuation_prose.slice(clean_prose.length).trimStart();
  }

  // Fallback: when repeated continuations grow startWith past the model's single-turn output ceiling
  // and the model emits 0 new tokens (EOS), move existing target_prose into history context and
  // stream from a fresh cognitive anchor so continuation never stalls.
  if (!continuation_prose.trim() && clean_prose && !signal?.aborted) {
    const fallback_history = [...(Array.isArray(history) ? history : []), { role: "ai", text: clean_prose, round }];
    const fallback_prompt = compile_prompt({
      core: "CHARACTER",
      round,
      entities,
      history: fallback_history,
      memories,
      task_options: { turn_tempo, is_continuation: true },
    });
    const fallback_start_with =
      "<think>Continue immediately from the final sentence of my last turn with the next physical action, sensory shift, or spoken beat without repeating prior text.</think>\n";
    const fallback_raw = await transport.stream(fallback_prompt, { onChunk, startWith: fallback_start_with, signal, silent: true });
    const fallback_extracted = parse_think_block(fallback_raw && !fallback_raw.includes("<think>") ? `${fallback_start_with}${fallback_raw}` : fallback_raw);
    let fallback_delta = fallback_extracted.prose.trim();
    if (clean_prose && fallback_delta.startsWith(clean_prose)) {
      fallback_delta = fallback_delta.slice(clean_prose.length).trimStart();
    }
    if (fallback_delta) {
      continuation_prose = fallback_delta;
      raw = fallback_raw;
    }
  }

  // Fused result preserves the full continuation (continuations intentionally allow the scene to develop beyond initial turn tempo limits)
  const separator = ends_with_terminal ? "\n\n" : " ";
  const final_fused_prose = clean_prose ? `${clean_prose}${continuation_prose ? `${separator}${continuation_prose}` : ""}` : continuation_prose;

  return { raw, think: think || clean_think, prose: final_fused_prose, continuation_prose, turn_tempo };
}

/**
 * Shared JSON-step core for the Caretaker purpose core: stream a compiled
 * prompt, reconcile the think block, and parse the JSON body, with an
 * optional single retry on unparseable output.
 *
 * @param {object} params
 * @param {object} params.transport - Transport interface with .stream()
 * @param {string} params.prompt - Compiled prompt text
 * @param {string} params.start_prefix - startWith prefix sent to transport
 * @param {AbortSignal} [params.signal]
 * @param {boolean} [params.retry=true] - Retry once when parsing fails
 * @returns {Promise<{ raw: string, think: string, body: string, parsed: any }>}
 */
async function run_caretaker_json_step({ transport, prompt, start_prefix, signal = null, retry = true }) {
  let raw = await transport.stream(prompt, { startWith: start_prefix, signal, priority: "background", silent: true });
  let { think, body } = extract_think_and_body(raw, start_prefix);
  let parsed = safe_parse_json(body) || safe_parse_json(raw, { prefix: start_prefix });

  // 1x JSON parse retry: if the background stream produced unparseable JSON, retry once
  if (!parsed && retry && !signal?.aborted) {
    try {
      raw = await transport.stream(prompt, { startWith: start_prefix, signal, priority: "background", silent: true });
      const retried = extract_think_and_body(raw, start_prefix);
      think = retried.think;
      body = retried.body;
      parsed = safe_parse_json(body) || safe_parse_json(raw, { prefix: start_prefix });
    } catch {
      /* If retry throws or is aborted, fall back to unparsed outcome */
    }
  }

  return { raw, think, body, parsed };
}

/**
 * Runs Turn 3: Caretaker Memory & State Synthesis.
 * Runs in background during user deliberation, rotating round-robin across cast.
 *
 * @param {object} params
 * @param {object} params.transport - Transport interface with .stream()
 * @param {number} params.round
 * @param {object} [params.entities={}] - Cast entities
 * @param {Array<any>} [params.history=[]] - Recent dialogue transcript
 * @param {string} [params.target_entity_key=null] - Explicit target or resolved via round-robin
 * @param {AbortSignal} [params.signal]
 * @returns {Promise<{ raw: string, target: string, _thought_process: string, present: string, future: string, past: string, brackets: Array<any> }>}
 */
export async function run_memory_consolidation_step({ transport, round = 1, entities = {}, history = [], target_entity_key = null, signal = null }) {
  if (signal?.aborted) {
    throw new Error("Stream aborted by user.");
  }
  const target = target_entity_key || resolve_caretaker_target(round, entities);

  const prompt = compile_prompt({ core: "CARETAKER", round, entities, history, task_options: { target_entity_key: target } });

  const start_prefix = PURPOSE_CORES.CARETAKER.start_with();
  const { raw, think, parsed } = await run_caretaker_json_step({ transport, prompt, start_prefix, signal, retry: true });

  const parse_succeeded = Boolean(parsed);
  const _thought_process = think || parsed?._thought_process || "";
  const eternal_physical = typeof parsed?.eternal_physical === "string" ? parsed.eternal_physical : "";
  const eternal_non_physical = typeof parsed?.eternal_non_physical === "string" ? parsed.eternal_non_physical : "";
  const present_physical = typeof parsed?.present_physical === "string" ? parsed.present_physical : "";
  const present_non_physical = typeof parsed?.present_non_physical === "string" ? parsed.present_non_physical : "";
  const future = typeof parsed?.future === "string" ? parsed.future : "";
  const past = typeof parsed?.past === "string" ? parsed.past : "";

  // Parse brackets per temporal quadrant
  const eternal = { physical: parse_tagged_fields(eternal_physical), non_physical: parse_tagged_fields(eternal_non_physical) };
  const present = { physical: parse_tagged_fields(present_physical), non_physical: parse_tagged_fields(present_non_physical) };
  const parsed_future = parse_tagged_fields(future);
  const parsed_past = parse_tagged_fields(past);

  // Parse all bracket tokens across the consolidated fields
  const combined_bracket_text = [eternal_physical, eternal_non_physical, present_physical, present_non_physical, future, past].filter(Boolean).join("\n");
  const brackets = parse_tagged_fields(combined_bracket_text);

  return {
    raw,
    target,
    parse_succeeded,
    _thought_process,
    eternal,
    present,
    future: parsed_future,
    past: parsed_past,
    eternal_physical,
    eternal_non_physical,
    present_physical,
    present_non_physical,
    future_text: future,
    past_text: past,
    brackets,
  };
}

/**
 * Runs an Envision turn to refine and synthesize visual staging prompts for image diffusion.
 *
 * @param {object} params
 * @param {object} params.transport - Shared transport or LLM interface
 * @param {number} [params.round=1]
 * @param {object} [params.entities={}] - Cast entities ({ AI?, USER?, FRACTAL? })
 * @param {string} [params.camera_note=""] - Draft text, camera angle, or aesthetic notes
 * @param {"character" | "place"} [params.subject_kind="character"]
 * @param {AbortSignal} [params.signal=null]
 * @returns {Promise<{ prompt: string, negative_prompt: string, _thought_process: string, raw: string }>}
 */
export async function run_image_prompt_step({ transport, round = 1, entities = {}, camera_note = "", subject_kind = "character", signal = null }) {
  if (signal?.aborted) {
    throw new Error("Stream aborted by user.");
  }

  const prompt = compile_prompt({ core: "VISUALIZER", round, entities, task_options: { camera_note, subject_kind } });

  const start_prefix = PURPOSE_CORES.VISUALIZER.start_with();
  const raw = await transport.stream(prompt, { startWith: start_prefix, signal, priority: "background", silent: true });
  const { think, body } = extract_think_and_body(raw, start_prefix);
  let parsed = safe_parse_json(body) || safe_parse_json(raw, { prefix: start_prefix });

  let candidate_prompt = typeof parsed?.prompt === "string" ? parsed.prompt.trim() : "";
  let candidate_negative = typeof parsed?.negative_prompt === "string" ? parsed.negative_prompt.trim() : "";
  let thought_process = think || (typeof parsed?._thought_process === "string" ? parsed._thought_process.trim() : "");

  // Robust fallback for raw unescaped newlines in JSON thought string
  if (!candidate_prompt && (body || raw)) {
    const text_to_search = body || raw;
    const p_match = /"prompt"\s*:\s*"((?:[^"\\]|\\.)*)"/i.exec(text_to_search);
    if (p_match && p_match[1]) {
      candidate_prompt = p_match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
    }
    const n_match = /"negative(?:Prompt|_prompt)"\s*:\s*"((?:[^"\\]|\\.)*)"/i.exec(text_to_search);
    if (n_match && n_match[1]) {
      candidate_negative = n_match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
    }
  }

  // Strip @ from [@TARGET] or @TARGET tokens in diffusion prompts while keeping display name
  if (candidate_prompt.includes("@")) {
    candidate_prompt = candidate_prompt.replace(/@([A-Za-z0-9_]+)/g, "$1");
  }

  // Sanitize prompt and negative prompt: strip template-significant characters ({}[])
  // to prevent curly/square bracket syntax errors in host Perchance diffusion plugins.
  const sanitize_diffusion_text = (str) =>
    String(str || "")
      .replace(/@([A-Za-z0-9_-]+)/g, "$1")
      .replace(/[{}[\]]/g, "")
      .replace(/,\s*\./g, ",")
      .replace(/\.\s*,/g, ",")
      .trim();

  return {
    prompt: sanitize_diffusion_text(candidate_prompt),
    negative_prompt: sanitize_diffusion_text(candidate_negative),
    _thought_process: thought_process,
    raw: raw || "",
  };
}

/**
 * Runs an Ingestion/Structuring turn to map raw text notes into structured 4-quadrant profile brackets.
 *
 * @param {object} params
 * @param {object} params.transport - Shared transport or LLM interface
 * @param {string} params.input_data - Raw prose notes or bio text
 * @param {"character" | "fractal"} [params.type="character"]
 * @param {AbortSignal} [params.signal=null]
 * @returns {Promise<Record<string, any> | null>}
 */
export async function run_schema_extraction_step({ transport, input_data = "", type = "character", signal = null }) {
  if (signal?.aborted) {
    throw new Error("Stream aborted by user.");
  }

  const prompt = compile_prompt({
    core: "CARETAKER",
    round: 1,
    entities: {},
    task_options: { target_name: type === "fractal" ? "New Fractal" : "New Character", target_type: type, input_data },
  });

  const start_prefix = PURPOSE_CORES.CARETAKER.start_with();
  const { parsed } = await run_caretaker_json_step({ transport, prompt, start_prefix, signal, retry: false });

  return parsed;
}

/**
 * Complete Round Orchestration Pipeline:
 * Coordinates Turn 1 (Director) conditionally and Turn 2 (Character).
 *
 * @param {object} params
 * @param {object} params.transport - Streaming transport
 * @param {number} params.round - Active macro round
 * @param {object} params.entities - Character and world models
 * @param {Array<any>} params.history - Recent transcript
 * @param {Array<any>} params.memories - Sieve RAG memories
 * @param {string} params.input - User action input
 * @param {(chunk: string) => void} [params.onChunk] - Streaming callback for Character prose
 * @returns {Promise<{ director_staging: object | null, character_turn: object }>}
 */
export async function run_round({ transport, round = 1, entities = {}, history = [], memories = [], onChunk = null, signal = null }) {
  const director_staging = await run_planner_step({ transport, round, entities, history, signal });

  const character_turn = await run_generation_step({
    transport,
    round,
    entities,
    history,
    memories,
    directors_note: director_staging?.directors_note || "",
    onChunk,
    signal,
  });

  return { director_staging, character_turn };
}

/**
 * Drafts the user's next narrative action or dialogue (ghostwriting).
 * Reuses the Character core with inverted participants (AI: user, USER: ai).
 * Streams prose incrementally once the think block closes; cognition itself
 * is never streamed.
 *
 * Transport-injected turn pipeline helper. All context is explicit — no
 * bridge fallback; engine internals stay direct.
 *
 * @param {object} transport - Live streaming transport (e.g. get_transport())
 * @param {string} [input_text=""] - Context/seed text to continue or draft
 * @param {AbortSignal} [signal=null] - Optional abort signal
 * @param {((chunk: string, is_full_replace: boolean) => void) | null} [on_token=null] - Live token callback
 * @param {object} [context={}] - Explicit caller context ({ session, app, feed });
 *   all three are required.
 * @returns {Promise<string>} Cleaned narrative prose
 */
export async function generate_user_draft(transport, input_text = "", signal = null, on_token = null, context = {}) {
  const session_source = context.session || {};
  const app_source = context.app || {};

  const user_quadrant = normalize_entity(session_source.active_user || app_source.selected_user || {});
  const ai_quadrant = normalize_entity(session_source.active_ai || app_source.selected_ai || {});
  const fractal_quadrant = normalize_entity(session_source.active_fractal || app_source.selected_fractal || {});

  const feed = context.feed || [];
  const history = reconstruct_history_from_feed(feed, { user: user_quadrant, ai: ai_quadrant, fractal: fractal_quadrant });

  if (input_text && input_text.trim()) {
    history.push({ role: "user", text: input_text.trim() });
  }

  // Incremental <think>-gated streaming state machine: cognition is held
  // until </think> closes, then the prose tail streams in deltas. The first
  // post-think emission is a full replace (it reseeds the composer from the
  // accumulated tail); later chunks append.
  let full_accumulated = "";
  let emitted_len = 0;

  const outcome = await run_generation_step({
    transport,
    round: Number(session_source.round || 1),
    entities: { AI: user_quadrant, USER: ai_quadrant, FRACTAL: fractal_quadrant },
    history,
    memories: [],
    directors_note: "",
    signal,
    onChunk: (chunk) => {
      full_accumulated += chunk;
      if (typeof on_token !== "function") return;
      const close_match = /<\/think\s*>/i.exec(full_accumulated);
      if (!close_match) {
        // Think still open (or opening) — hold all output. A bare "<" prefix
        // may be a split tag, so hold that too; anything else streams.
        const opened =
          /<think[\s>]/i.test(full_accumulated) || full_accumulated.trimStart() === "<" || /<t(?:h(?:i(?:n(?:k)?)?)?)?$/i.test(full_accumulated.trimEnd());
        if (opened) return;
        const cleaned = full_accumulated.trimStart();
        const delta = cleaned.slice(emitted_len);
        if (delta) {
          on_token(delta, emitted_len === 0);
          emitted_len = cleaned.length;
        }
        return;
      }
      const cleaned = full_accumulated.slice(close_match.index + close_match[0].length).trimStart();
      const delta = cleaned.slice(emitted_len);
      if (delta) {
        on_token(delta, emitted_len === 0);
        emitted_len = cleaned.length;
      }
    },
  });

  return (outcome?.prose || "").trim();
}

// ============================================================================
// Section 2 — Stateful Turn & Consolidation Orchestration
// ============================================================================

// ---------------------------------------------------------------------------
// Turn re-entrancy guard (replaces the old per-session phase field — phase
// itself remains solely owned by simulation_state; this flag only guards
// overlapping run_turn / continue_turn calls on this module).
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
 * Shared first-chunk staging: announces the AI speaker and opens the stream
 * stage exactly once. Used by run_turn and continue_turn alike.
 *
 * @param {object} ai_quadrant - Transient normalized AI quadrant
 */
function stage_ai_speaker(ai_quadrant) {
  execution.set_delegated_speaker({
    type: "ai",
    name: ai_quadrant.name || "AI",
    avatar: ai_quadrant.profile_picture || null,
    color: ai_quadrant.signature_color || null,
  });
  execution.start_stream_stage();
}

/**
 * Builds transient turn context: normalized quadrant copies for the LLM call
 * plus history reconstructed from the owned feed. Nothing here is stored —
 * callers persist rows and write back explicitly on success.
 */
function build_turn_context(app_store, feed) {
  const user_quadrant = normalize_entity(session.active_user || app_store.selected_user || {});
  const ai_quadrant = normalize_entity(session.active_ai || app_store.selected_ai || {});
  const fractal_quadrant = normalize_entity(session.active_fractal || app_store.selected_fractal || {});
  const history = reconstruct_history_from_feed(feed, { user: user_quadrant, ai: ai_quadrant, fractal: fractal_quadrant });
  return { user_quadrant, ai_quadrant, fractal_quadrant, history };
}

/**
 * Commits a finished turn to persistence and the reactive feed: the director-turn
 * row first, then the character-turn AI row (chronological cause-before-effect).
 * Consolidation still appends last via dispatch_consolidation.
 */
export async function persist_turn_rows({ prose, think, outcome, ai_name, story_id, round, dynamics_ai, dynamics_fractal, snapshots }) {
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
      // Ordering is best-effort; insertion order already holds live.
    }
  }
}

/**
 * Applies director deltas to the transient quadrant copies via the canonical
 * step_dynamics reducer (gravity settles each axis toward its entity
 * baseline, clamped to the turn pipeline band). Inputs are never mutated —
 * the reducer returns frozen snapshots that are merged back here.
 *
 * AI steps somatic axes, fractal steps fractal axes; each call's deltas are
 * the director's full payload filtered to that side's axes.
 *
 * @param {object|null} ai_entity - AI quadrant entity
 * @param {object|null} fractal_entity - Fractal quadrant entity
 * @param {object|null} deltas - Director dynamics deltas
 */
function apply_dynamics_step(ai_entity, fractal_entity, deltas) {
  if (!deltas) return;
  const entropy = Number(fractal_entity?.dynamics?.entropy ?? 50);
  if (ai_entity && typeof ai_entity.dynamics === "object") {
    const ai_deltas = {};
    for (const key of ["chaos", "intensity", "openness", "affinity"]) {
      if (deltas[key] !== undefined) ai_deltas[key] = deltas[key];
    }
    const { next } = step_dynamics(ai_entity.dynamics, extract_metric_baselines(ai_entity) || {}, ai_deltas, { entropy, scope: "somatic" });
    ai_entity.dynamics = { ...ai_entity.dynamics, ...next };
  }
  if (fractal_entity && typeof fractal_entity.dynamics === "object") {
    const fractal_deltas = {};
    for (const key of ["velocity", "entropy"]) {
      if (deltas[key] !== undefined) fractal_deltas[key] = deltas[key];
    }
    const { next } = step_dynamics(fractal_entity.dynamics, extract_metric_baselines(fractal_entity) || {}, fractal_deltas, { entropy, scope: "fractal" });
    fractal_entity.dynamics = { ...fractal_entity.dynamics, ...next };
  }
}

/**
 * Evaluates the automatic image trigger after a turn and spawns the beat
 * without ever blocking the turn. Honors the configured pending cap.
 */
export async function maybe_spawn_turn_image({ prose, outcome, ai_quadrant, fractal_quadrant, prev_dynamics, turn_round }) {
  // B19: Wire automatic visual synthesis into turn (fire-and-forget, non-blocking)
  if (prose && session.story_id) {
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
            { app, session },
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
export async function run_turn(user_input, _options = {}) {
  const resubmitting = Boolean(_options.is_retry || _options.is_continue);
  const trimmed_input = typeof user_input === "string" ? user_input.trim() : "";
  if (!resubmitting && !trimmed_input) return null;

  _begin_turn_scope();

  // Transient working copies + reconstructed context (owned stores untouched).
  const { user_quadrant, ai_quadrant, fractal_quadrant, history } = build_turn_context(app, session.feed || []);

  // A direct call without a prior session.send (tests, prologue opening
  // turn) still needs the prompt text in context — feed-backed calls dedupe it.
  if (trimmed_input) {
    const last_entry = history[history.length - 1];
    if (!(last_entry && last_entry.role === "user" && last_entry.text === trimmed_input)) {
      history.push({ role: "user", text: trimmed_input, round: Number(session.round || 0) + (resubmitting ? 0 : 1) });
    }
  }

  const previous_round = Number(session.round || 0);
  if (!resubmitting) session.round = previous_round + 1;
  const turn_round = Number(session.round || 0);

  // 4. Begin UI streaming indicator
  const message_node_id = `msg-${Date.now()}`;
  execution.start_stream(message_node_id, "ai");

  let first_chunk = true;
  const stage_once = () => {
    if (!first_chunk) return;
    first_chunk = false;
    stage_ai_speaker(ai_quadrant);
  };

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

    // If onChunk never fired (e.g. non-streaming transport or mock without chunks), ensure stages transition cleanly
    stage_once();

    const prose = outcome?.character_turn?.prose || "";
    const think = outcome?.character_turn?.think || "";

    // Capture pre-turn dynamics BEFORE stepping so the image trigger compares
    // true pre-turn vs post-turn states (the old code snapshotted post-delta).
    const prev_ai_dynamics = { ...(ai_quadrant.dynamics || {}) };
    const prev_fractal_dynamics = { ...(fractal_quadrant.dynamics || {}) };

    // Step the transient copies through canonical dynamics; a failure above
    // discards the copies — live dynamics are never half-mutated.
    apply_dynamics_step(ai_quadrant, fractal_quadrant, outcome.director_staging?.dynamics_deltas);

    // 5. Commit generated turn to IndexedDB log and reactive feed
    await persist_turn_rows({
      prose,
      think,
      outcome,
      ai_name: ai_quadrant.name || "AI",
      story_id: session.story_id,
      round: turn_round,
      dynamics_ai: ai_quadrant.dynamics,
      dynamics_fractal: fractal_quadrant.dynamics,
      snapshots: { AI: ai_quadrant, USER: user_quadrant, FRACTAL: fractal_quadrant },
    });

    // Write back updated dynamics, macro round, and caretaker deltas
    await write_back_turn_state({ ai: ai_quadrant, fractal: fractal_quadrant, user: user_quadrant, round: turn_round, outcome, options: _options });

    // Turn is committed and visible: chime once. Audio.play gates on the
    // NOTIFICATIONS toggle + mute/volume internally. Placed before the image
    // beat (which can take 30s+) so the sound lands with the text, and only
    // on the success path (abort throws before reaching here).
    Audio?.play?.("notification");

    // Entity-keyed pre-turn snapshot: evaluate_image_trigger compares each
    // entity's current dynamics against its own previous values.
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
    _end_turn_scope();
    execution.end_stream();
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
export async function continue_turn(target_entry, _options = {}) {
  if (!target_entry || !target_entry.id) {
    throw new Error("Target message entry required for continuation.");
  }

  _begin_turn_scope();

  try {
    // 1-3. Transient quadrants + history scoped to the target message
    const feed = session.feed || [];
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
    execution.start_stream(target_entry.id, "ai");
    const clean_target_prose = target_prose.trim();
    const ends_with_terminal = /[.!?…"”'’*)\]]$/.test(clean_target_prose);
    const stream_seed_separator = ends_with_terminal ? "\n\n" : " ";
    if (clean_target_prose) {
      execution.update_stream(`${clean_target_prose}${stream_seed_separator}`);
    }

    let first_chunk = true;
    const stage_once = () => {
      if (!first_chunk) return;
      first_chunk = false;
      stage_ai_speaker(ai_quadrant);
    };

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
          // Ignore echoed startWith chunk from Perchance ai-text-plugin so pre-seeded target_prose is never duplicated
          if (clean_target_prose && (chunk.includes(clean_target_prose) || (target_think && chunk.includes(target_think)))) {
            return;
          }
          stage_once();
          execution.update_stream(chunk);
        },
      });

      // If onChunk never fired (e.g. non-streaming or mock without chunks), ensure stages transition cleanly
      stage_once();

      const fused_prose = outcome?.prose || target_prose;
      const fused_think = outcome?.think || target_think;

      // 5. Commit fused continuation to persistence and active feed, including
      // the fused think so meta.think survives reloads (not just in-memory).
      if (session && typeof session.edit_entry === "function") {
        await session.edit_entry(target_entry.id, fused_prose, { think: fused_think });
        // Update entry meta think in-memory if present
        const entry = feed.find((e) => String(e.id) === String(target_entry.id));
        if (entry) {
          entry.meta = entry.meta || {};
          entry.meta.think = fused_think;
        }
      }

      // Continuation fused and visible: chime once (same gates/placement
      // rationale as execute_turn; abort throws before reaching here).
      Audio?.play?.("notification");

      return outcome;
    } finally {
      _end_turn_scope();
    }
  } finally {
    execution.end_stream();
  }
}

/**
 * Writes back turn outcomes into active stores and IndexedDB.
 *
 * 1. Synchronizes updated AI dynamics into session.active_ai and ai_dynamics.
 * 2. Synchronizes updated Fractal dynamics into session.active_fractal and fractal_dynamics.
 * 3. Confirms session.round (already advanced by the turn).
 * 4. Persists the updated entities & story round into IndexedDB via session.save_entity and session.save.
 * 5. Runs Turn 3 Caretaker background consolidation and records state diffs.
 *
 * @param {object} turn - Folded turn output ({ ai, fractal, user, round, outcome })
 * @param {object} turn.ai - Post-delta AI quadrant (transient copy)
 * @param {object} turn.fractal - Post-delta fractal quadrant (transient copy)
 * @param {object} turn.user - User quadrant (transient copy)
 * @param {number} turn.round - The round just executed
 * @param {object} turn.outcome - run_round outcome
 * @param {object} [turn.options={}] - Abort signal carrier ({ signal })
 * @returns {Promise<void>}
 */
export async function write_back_turn_state({ ai, fractal, user, round, outcome, options = {} } = {}) {
  if (!session) return;

  // 1-3. Write back quadrant dynamics (AI/Fractal mirror into active entity and dynamics; User writes active only)
  if (ai?.dynamics) {
    if (session.active_ai) {
      session.active_ai.dynamics = { ...ai.dynamics };
    }
    session.ai_dynamics = { ...ai.dynamics };
  }
  if (fractal?.dynamics) {
    if (session.active_fractal) {
      session.active_fractal.dynamics = { ...fractal.dynamics };
    }
    session.fractal_dynamics = { ...fractal.dynamics };
  }
  if (user?.dynamics && session.active_user) {
    session.active_user.dynamics = { ...user.dynamics };
  }

  // 4. Confirm macro round counter (advanced pre-generation; re-asserted here so
  // write-back is the single place the round lands).
  if (typeof round === "number") session.round = round;

  // 5. Persist updated entities & story round into IndexedDB
  const save_promises = [];
  if (session.active_ai) {
    save_promises.push(session.save_entity("character", session.active_ai));
  }
  if (session.active_fractal) {
    save_promises.push(session.save_entity("fractal", session.active_fractal));
  }
  if (session.active_user) {
    save_promises.push(session.save_entity("character", session.active_user));
  }
  save_promises.push(session.save(session.round));

  await Promise.allSettled(save_promises);

  // 6. Turn 3: Caretaker background maintenance (dispatched un-awaited to free UI turn latency)
  // Gate execution on non-empty character prose and non-aborted signal (fizzle-path hygiene)
  const prose = outcome?.character_turn?.prose || "";
  if (prose.trim() && !options.signal?.aborted) {
    dispatch_consolidation({ ai, user, fractal, round: Number(session.round ?? 0) }, get_transport(), options.signal).catch((err) => {
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
export async function dispatch_consolidation({ ai, user, fractal, history, round } = {}, transport, signal = null) {
  if (signal?.aborted) return;
  if (!session) return;

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

    // 1. Present physical
    if (caretaker_outcome.present_physical) {
      target_entity.present = target_entity.present || { physical: "", non_physical: "" };
      const current_phys = typeof target_entity.present.physical === "string" ? target_entity.present.physical : "";
      target_entity.present.physical = apply_tagged_field_deltas(current_phys, caretaker_outcome.present_physical);
      has_changes = true;
    }

    // 2. Present non-physical
    if (caretaker_outcome.present_non_physical) {
      target_entity.present = target_entity.present || { physical: "", non_physical: "" };
      const current_non = typeof target_entity.present.non_physical === "string" ? target_entity.present.non_physical : "";
      target_entity.present.non_physical = apply_tagged_field_deltas(current_non, caretaker_outcome.present_non_physical);
      has_changes = true;
    }

    // 3. Future (standing agenda)
    if (caretaker_outcome.future_text) {
      const current_future = typeof target_entity.future === "string" ? target_entity.future : "";
      target_entity.future = apply_tagged_field_deltas(current_future, caretaker_outcome.future_text);
      has_changes = true;
    }

    // 4. Past (semantic memories)
    if (caretaker_outcome.past_text) {
      const current_past = typeof target_entity.past === "string" ? target_entity.past : "";
      target_entity.past = apply_tagged_field_deltas(current_past, caretaker_outcome.past_text);
      has_changes = true;
    }

    if (has_changes) {
      const entity_type = target_key === "FRACTAL" ? "fractal" : "character";
      await session.save_entity(entity_type, target_entity);

      // Emit CONTINUUM_FORMATION telemetry card so Caretaker consolidation appears in the timeline
      if (session.story_id) {
        try {
          const present_combined = [caretaker_outcome.present_physical, caretaker_outcome.present_non_physical].filter(Boolean).join(" ");
          await session.log_message("", "system", "Caretaker", {
            turn_type: "SYSTEM_TURN",
            round: entry_round,
            story_id: session.story_id,
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
    }

    // Advance completion-driven cursor once the target was successfully processed
    // (single site — previously duplicated across the changed/unchanged branches).
    session.back_shot_cursor = (Number(session.back_shot_cursor) || 0) + 1;
  } catch (caretaker_err) {
    console.warn(`[Caretaker] Caretaker execution warning: ${caretaker_err?.message || caretaker_err}`);
  }
}
