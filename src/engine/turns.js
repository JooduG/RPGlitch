/**
 * src/engine/turns.js
 * ============================================================================
 * 📜 PURE FUNCTIONAL TURN ORCHESTRATOR (SHOT 1, 2 & 3)
 * ============================================================================
 *
 * Coordinates execution of sequential turns within a macro round:
 * - Turn 1 (Director Turn / Quick Shot): JSON staging, dynamics deltas, beat budgets.
 * - Turn 2 (Character Turn / Narrative Shot): In-character prose streaming + <think> cognition.
 * - Turn 3 (User Turn / Head Shot & Caretaker): Background memory diffs.
 *
 * Operational Posture:
 * - Fast 1-Shot Default: Direct User -> Character prose streaming.
 * - 2-Shot Ready: director_enabled flag triggers Turn 1 staging before Turn 2.
 * - Pure headless design: 100% testable in Vitest with mocked transport.
 * ============================================================================
 */

import { compile_prompt, PURPOSE_CORES } from "./prompts.js";
import { parse_brackets, parse_think_block } from "../data/parser.js";
import { safe_parse_json } from "../utils/text.js";
import { normalize_entity } from "../data/entities.js";
import { state_bridge } from "../utils/index.js";
import { LENGTH_THRESHOLDS } from "../config.js";

/**
 * Normalizes prefilled startWith markers, parses <think>...</think> cognition,
 * and extracts the remainder body.
 *
 * @param {string} raw - Raw model output
 * @param {string} [start_with=""] - The startWith prefix sent to transport
 * @returns {{ think: string, body: string }}
 */
export function extract_think_and_body(raw, start_with = "") {
  if (!raw || typeof raw !== "string") {
    return { think: "", body: "" };
  }

  let text = raw;

  // Reconcile startWith prefix if stripped by transport or echoed by model
  if (start_with && !text.includes("<think>")) {
    // If the mock/model returned raw output without any <think> tags, check if it's pure prose/body
    // Only prepend start_with if the output already looks like it was continuing mid-stream, or close the think tag
    if (text.includes("</think>")) {
      text = `${start_with}${text}`;
    } else {
      text = `${start_with}</think>\n${text}`;
    }
  } else if (start_with && !text.trimStart().startsWith("<think>")) {
    text = `${start_with}${text}`;
  }

  const { think, prose } = parse_think_block(text);
  return {
    think: think || "",
    body: (prose || "").trim(),
  };
}

/**
 * Builds a brief human-readable turn summary from the recent feed tail.
 *
 * @param {any[]} feed - Recent feed array
 * @param {number} round - Current round index
 * @returns {string}
 */
export function build_turn_summary(feed, round) {
  const tail = (feed || []).slice(-16);
  const counts = {};
  for (const m of tail) {
    if (!m || m.role === "system") continue;
    const role = m.role;
    counts[role] = (counts[role] || 0) + 1;
  }
  const parts = Object.entries(counts).map(([r, n]) => `${r}×${n}`);
  return `Turn ${round} complete — ${parts.length ? parts.join(", ") : "no messages recorded"}.`;
}

/** Default round-robin entity rotation for Turn 3 Caretaker consolidation */
export const CARETAKER_ROTATION = Object.freeze(["AI", "USER", "FRACTAL"]);

/**
 * Resolves which entity key is targeted for Caretaker consolidation.
 * Rotates sequentially across AI -> USER -> FRACTAL (+ any active NPC).
 *
 * @param {number} cursor_or_round - Active cursor index or round number
 * @param {object} [entities={}]
 * @param {boolean} [use_cursor=false] - Whether cursor_or_round is an absolute 0-indexed cursor
 * @returns {string} Target entity key (e.g., 'AI', 'USER', 'FRACTAL', 'NPC')
 */
export function resolve_caretaker_target(cursor_or_round, entities = {}, use_cursor = false) {
  const cast = [...CARETAKER_ROTATION];
  if (entities.NPC && entities.NPC.id) {
    cast.push("NPC");
  }
  const index = use_cursor
    ? Math.abs(Math.floor(Number(cursor_or_round) || 0)) % cast.length
    : Math.abs(Math.floor(Number(cursor_or_round) || 1) - 1) % cast.length;
  return cast[index];
}

/**
 * Evaluates recent dialogue density and returns the calibrated Turn Tempo (beat budget).
 * Enforces dynamic conversational rhythm matching the newest round in history:
 * - Tiny (< 25 chars): 1 snappy beat
 * - Small (< 150 chars): 2 beats
 * - Medium (< 500 chars): 3 beats
 * - Expansive (>= 500 chars): 4 beats
 *
 * @param {Array<any>} [history=[]]
 * @returns {number} Allowed sentence / beat count
 */
export function calculate_turn_tempo(history = []) {
  if (!Array.isArray(history) || history.length === 0) return 2;

  const newest = history[history.length - 1];
  const text = typeof newest === "string" ? newest.trim() : (newest?.text || "").trim();
  if (!text) return 2;

  const len = text.length;
  if (len < LENGTH_THRESHOLDS.TINY) return 1;
  if (len < LENGTH_THRESHOLDS.SMALL) return 2;
  if (len < LENGTH_THRESHOLDS.EXPANSIVE) return 3;
  return 4;
}

/**
 * Executes Turn 1: Director Quick Shot (Staging inference).
 *
 * @param {object} params
 * @param {object} params.transport - Transport interface with .stream()
 * @param {number} params.round
 * @param {object} params.entities
 * @param {Array<any>} params.history
 * @param {string} params.input
 * @returns {Promise<object>} Parsed director staging payload
 */
export async function execute_turn_1_director({ transport, round = 1, entities = {}, history = [], signal = null }) {
  const prompt = compile_prompt({
    core: "DIRECTOR",
    round,
    entities,
    history,
  });

  const start_prefix = PURPOSE_CORES.DIRECTOR.start_with();
  let raw_output = await transport.stream(prompt, { startWith: start_prefix, signal });

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
 * Executes Turn 2: Character Narrative Shot.
 *
 * @param {object} params
 * @param {object} params.transport - Transport interface with .stream()
 * @param {number} params.round
 * @param {object} params.entities
 * @param {Array<any>} params.history
 * @param {Array<any>} params.memories
 * @param {string} params.input
 * @param {string} [params.directors_note]
 * @param {(chunk: string) => void} [params.onChunk]
 * @returns {Promise<{ raw: string, think: string, prose: string, turn_tempo: number }>}
 */
export async function execute_turn_2_character({
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

  const prompt = compile_prompt({
    core: "CHARACTER",
    round,
    entities,
    history,
    memories,
    task_options: { directors_note, turn_tempo },
  });

  const start_with = PURPOSE_CORES.CHARACTER.start_with({
    is_character,
    directors_note,
  });
  let raw = await transport.stream(prompt, { onChunk, startWith: start_with, signal });

  const { think, body: prose } = extract_think_and_body(raw, start_with);

  return {
    raw,
    think,
    prose,
    turn_tempo,
  };
}

/**
 * Executes a direct Character continuation (Turn 2 continue-in-place).
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
export async function execute_turn_2_continue({
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

  const prompt = compile_prompt({
    core: "CHARACTER",
    round,
    entities,
    history,
    memories,
    task_options: { turn_tempo, is_continuation: true },
  });

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

  let raw = await transport.stream(prompt, { onChunk, startWith: start_with, signal });

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
    const fallback_raw = await transport.stream(fallback_prompt, {
      onChunk,
      startWith: fallback_start_with,
      signal,
    });
    const fallback_extracted = parse_think_block(
      fallback_raw && !fallback_raw.includes("<think>") ? `${fallback_start_with}${fallback_raw}` : fallback_raw,
    );
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

  return {
    raw,
    think: think || clean_think,
    prose: final_fused_prose,
    continuation_prose,
    turn_tempo,
  };
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
 * @param {boolean} [params.director_enabled=false] - Whether to execute Turn 1 Director staging
 * @param {(chunk: string) => void} [params.onChunk] - Streaming callback for Character prose
 * @returns {Promise<{ director_staging: object | null, character_turn: object }>}
 */
export async function execute_round({
  transport,
  round = 1,
  entities = {},
  history = [],
  memories = [],
  director_enabled = false,
  onChunk = null,
  signal = null,
}) {
  let director_staging = null;

  if (director_enabled) {
    director_staging = await execute_turn_1_director({
      transport,
      round,
      entities,
      history,
      signal,
    });
  }

  const character_turn = await execute_turn_2_character({
    transport,
    round,
    entities,
    history,
    memories,
    directors_note: director_staging?.directors_note || "",
    onChunk,
    signal,
  });

  return {
    director_staging,
    character_turn,
  };
}

/**
 * Executes Turn 3: Caretaker Memory & State Synthesis.
 * Runs in background during user deliberation, rotating round-robin across cast.
 *
 * @param {object} params
 * @param {object} params.transport - Transport interface with .stream()
 * @param {number} params.round - Active macro round
 * @param {object} [params.entities={}] - Cast entities
 * @param {Array<any>} [params.history=[]] - Recent dialogue transcript
 * @param {string} [params.target_entity_key] - Explicit target or resolved via round-robin
 * @returns {Promise<{ raw: string, target: string, _thought_process: string, present: string, future: string, past: string, brackets: Array<any> }>}
 */
export async function execute_turn_3_caretaker({ transport, round = 1, entities = {}, history = [], target_entity_key = null, signal = null }) {
  if (signal?.aborted) {
    throw new Error("Stream aborted by user.");
  }
  const target = target_entity_key || resolve_caretaker_target(round, entities);

  const prompt = compile_prompt({
    core: "CARETAKER",
    round,
    entities,
    history,
    task_options: { target_entity_key: target },
  });

  const start_prefix = PURPOSE_CORES.CARETAKER.start_with();
  let raw = await transport.stream(prompt, { startWith: start_prefix, signal, priority: "background" });

  let { think, body } = extract_think_and_body(raw, start_prefix);
  let parsed = safe_parse_json(body) || safe_parse_json(raw, { prefix: start_prefix });

  // 🛡️ 1x JSON Parse Retry: If initial background stream produced unparseable JSON, retry once
  if (!parsed && !signal?.aborted) {
    try {
      raw = await transport.stream(prompt, { startWith: start_prefix, signal, priority: "background" });
      const retried = extract_think_and_body(raw, start_prefix);
      think = retried.think;
      body = retried.body;
      parsed = safe_parse_json(body) || safe_parse_json(raw, { prefix: start_prefix });
    } catch {
      /* If retry throws or is aborted, fall back to unparsed outcome */
    }
  }

  const parse_succeeded = Boolean(parsed);
  const _thought_process = think || parsed?._thought_process || "";
  const eternal_physical = typeof parsed?.eternal_physical === "string" ? parsed.eternal_physical : "";
  const eternal_non_physical = typeof parsed?.eternal_non_physical === "string" ? parsed.eternal_non_physical : "";
  const present_physical = typeof parsed?.present_physical === "string" ? parsed.present_physical : "";
  const present_non_physical = typeof parsed?.present_non_physical === "string" ? parsed.present_non_physical : "";
  const future = typeof parsed?.future === "string" ? parsed.future : "";
  const past = typeof parsed?.past === "string" ? parsed.past : "";

  // Parse brackets per temporal quadrant
  const eternal = {
    physical: parse_brackets(eternal_physical),
    non_physical: parse_brackets(eternal_non_physical),
  };
  const present = {
    physical: parse_brackets(present_physical),
    non_physical: parse_brackets(present_non_physical),
  };
  const parsed_future = parse_brackets(future);
  const parsed_past = parse_brackets(past);

  // Parse all bracket tokens across the consolidated fields
  const combined_bracket_text = [eternal_physical, eternal_non_physical, present_physical, present_non_physical, future, past]
    .filter(Boolean)
    .join("\n");
  const brackets = parse_brackets(combined_bracket_text);

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
 * Executes an Envision turn to refine and synthesize visual staging prompts for image diffusion.
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
export async function execute_turn_visualizer({ transport, round = 1, entities = {}, camera_note = "", subject_kind = "character", signal = null }) {
  if (signal?.aborted) {
    throw new Error("Stream aborted by user.");
  }

  const prompt = compile_prompt({
    core: "VISUALIZER",
    round,
    entities,
    task_options: {
      camera_note,
      subject_kind,
    },
  });

  const start_prefix = PURPOSE_CORES.VISUALIZER.start_with();
  const raw = await transport.stream(prompt, { startWith: start_prefix, signal, priority: "background" });
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
 * Executes an Ingestion/Structuring turn to map raw text notes into structured 4-quadrant profile brackets.
 *
 * @param {object} params
 * @param {object} params.transport - Shared transport or LLM interface
 * @param {string} params.input_data - Raw prose notes or bio text
 * @param {"character" | "fractal"} [params.type="character"]
 * @param {AbortSignal} [params.signal=null]
 * @returns {Promise<Record<string, any> | null>}
 */
export async function execute_turn_structuring({ transport, input_data = "", type = "character", signal = null }) {
  if (signal?.aborted) {
    throw new Error("Stream aborted by user.");
  }

  const prompt = compile_prompt({
    core: "CARETAKER",
    round: 1,
    entities: {},
    task_options: {
      target_name: type === "fractal" ? "New Fractal" : "New Character",
      target_type: type,
      input_data,
    },
  });

  const start_prefix = PURPOSE_CORES.CARETAKER.start_with();
  const raw = await transport.stream(prompt, { startWith: start_prefix, signal, priority: "background" });
  const { body } = extract_think_and_body(raw, start_prefix);
  const parsed = safe_parse_json(body) || safe_parse_json(raw, { prefix: start_prefix });

  return parsed;
}

/**
 * Reconstructs clean Kernel dialogue history from the UI / simulation log feed.
 *
 * Resolves Gap 5: Preserves user, model, fractal (environmental), and system roles
 * along with origin attribution so scene context is never lost.
 *
 * @param {Array<object>} feed
 * @param {object} cast
 * @returns {Array<object>}
 */
export function reconstruct_history_from_feed(feed = [], cast = {}) {
  if (!Array.isArray(feed)) return [];

  const user_name = cast.user?.name || "USER";
  const ai_name = cast.ai?.name || "AI";
  const fractal_name = cast.fractal?.name || "WORLD";

  return feed
    .filter((entry) => entry && entry.text && typeof entry.text === "string" && entry.text.trim())
    .map((entry) => {
      let role;
      let origin = entry.character_name || entry.origin || "";

      if (entry.role === "user") {
        role = "user";
        origin = origin || user_name;
      } else if (entry.role === "fractal") {
        role = "fractal";
        origin = origin || fractal_name;
      } else if (entry.role === "system") {
        role = "system";
        origin = origin || "SYSTEM";
      } else {
        role = "ai";
        origin = origin || ai_name;
      }

      return {
        role,
        origin,
        text: entry.text.trim(),
        round: Number(entry.round || 1),
      };
    });
}

/**
 * Executes a ghostwriting stream to draft the user's next narrative action or dialogue.
 * Reuses execute_turn_2_character with inverted participants (AI: user, USER: ai).
 * Suppresses thought blocks during live token streaming to the composer callback.
 *
 * transport-injected turn pipeline helper (moved from bridge.js per nuclear plan §3).
 *
 * @param {object} transport - Live streaming transport (e.g. get_transport())
 * @param {string} [input_text=""] - Context/seed text to continue or draft
 * @param {AbortSignal} [signal=null] - Optional abort signal
 * @param {((chunk: string, is_full_replace: boolean) => void) | null} [on_token=null] - Live token callback
 * @returns {Promise<string>} Cleaned narrative prose
 */
export async function execute_ghostwriter(transport, input_text = "", signal = null, on_token = null) {
  const runtime = state_bridge.runtime || {};
  const app = state_bridge.app || {};

  const user_quadrant = normalize_entity(runtime.active_user || app.selected_user || {});
  const ai_quadrant = normalize_entity(runtime.active_ai || app.selected_ai || {});
  const fractal_quadrant = normalize_entity(runtime.active_fractal || app.selected_fractal || {});

  const feed = state_bridge.simulation_log?.feed || [];
  const history = reconstruct_history_from_feed(feed, {
    user: user_quadrant,
    ai: ai_quadrant,
    fractal: fractal_quadrant,
  });

  if (input_text && input_text.trim()) {
    history.push({
      role: "user",
      content: input_text.trim(),
    });
  }

  let full_accumulated = "";
  let is_inside_think = false;

  const outcome = await execute_turn_2_character({
    transport,
    round: Number(runtime.round || 1),
    entities: {
      AI: user_quadrant,
      USER: ai_quadrant,
      FRACTAL: fractal_quadrant,
    },
    history,
    memories: [],
    directors_note: "",
    signal,
    onChunk: (chunk) => {
      full_accumulated += chunk;
      if (typeof on_token === "function") {
        const lower = full_accumulated.toLowerCase();
        if (lower.includes("<think>") || lower.startsWith("<think") || full_accumulated.trimStart() === "<") {
          is_inside_think = !lower.includes("</think>");
          if (!is_inside_think) {
            const extracted = parse_think_block(full_accumulated);
            const cleaned = (extracted.prose || "").trimStart();
            if (cleaned) on_token(cleaned, true);
          }
        } else if (!is_inside_think) {
          on_token(chunk, false);
        }
      }
    },
  });

  return (outcome?.prose || "").trim();
}
