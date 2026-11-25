/**
 * @file src/engine/steps.js
 * Stateless LLM step executors (zero @state imports; transport injected).
 */

import {
  calculate_turn_tempo,
  compile_prompt,
  parse_tagged_fields,
  parse_think_block,
  PURPOSE_CORES,
  resolve_caretaker_target,
  safe_parse_json,
  sanitize_visual_text,
} from "@simulation";

const TERMINAL_PUNCTUATION_REGEX = /[.!?…"”'’*)\]]$/;

/**
 * Determines whether a prose lead ends with terminal punctuation and returns
 * the matching continuation separator (`"\n\n"` vs `" "`).
 *
 * @param {string} prose
 * @returns {{ ends_with_terminal: boolean, separator: string }}
 */
export function resolve_continuation_separator(prose) {
  const clean = typeof prose === "string" ? prose.trim() : "";
  const ends_with_terminal = TERMINAL_PUNCTUATION_REGEX.test(clean);
  return { ends_with_terminal, separator: ends_with_terminal ? "\n\n" : " " };
}

function extract_think_and_body(raw, start_with = "") {
  const { think, prose } = parse_think_block(raw, start_with);
  return { think: think || "", body: (prose || "").trim() };
}

function clamp_delta(value) {
  return Math.max(-20, Math.min(20, Math.round(Number(value) || 0)));
}

/**
 * Shared JSON-step core: streams a compiled prompt, extracts `<think>`, and
 * parses the JSON payload with an optional single retry on parse failure.
 *
 * @param {object} params
 * @param {object} params.transport
 * @param {string} params.prompt
 * @param {string} params.start_prefix
 * @param {AbortSignal | null} [params.signal=null]
 * @param {"foreground" | "background"} [params.priority="foreground"]
 * @param {boolean} [params.retry=false]
 * @returns {Promise<{ raw: string, think: string, body: string, parsed: any }>}
 */
async function run_json_step({ transport, prompt, start_prefix, signal = null, priority = "foreground", retry = false }) {
  const stream_options = { startWith: start_prefix, signal, silent: true, ...(priority === "background" ? { priority: "background" } : {}) };
  let raw = await transport.stream(prompt, stream_options);
  let { think, body } = extract_think_and_body(raw, start_prefix);
  let parsed = safe_parse_json(body) || safe_parse_json(raw, { prefix: start_prefix });

  if (!parsed && retry && !signal?.aborted) {
    try {
      raw = await transport.stream(prompt, stream_options);
      const retried = extract_think_and_body(raw, start_prefix);
      think = retried.think;
      body = retried.body;
      parsed = safe_parse_json(body) || safe_parse_json(raw, { prefix: start_prefix });
    } catch {
      /* Retry failure falls through to unparsed outcome */
    }
  }

  return { raw, think, body, parsed };
}

/**
 * Turn 1: Director staging inference.
 */
export async function run_planner_step({ transport, round = 1, entities = {}, history = [], signal = null }) {
  const prompt = compile_prompt({ core: "DIRECTOR", round, entities, history });
  const start_prefix = PURPOSE_CORES.DIRECTOR.start_with();
  const { think, parsed } = await run_json_step({ transport, prompt, start_prefix, signal });

  if (parsed) {
    const raw_deltas = parsed?.dynamics_deltas || {};
    return {
      _thought_process: think || (typeof parsed?._thought_process === "string" ? parsed._thought_process : ""),
      next_action: typeof parsed?.next_action === "string" ? parsed.next_action : "MAIN_CHARACTER",
      directors_note: typeof parsed?.directors_note === "string" ? parsed.directors_note : "",
      dynamics_deltas: {
        chaos: clamp_delta(raw_deltas.chaos),
        intensity: clamp_delta(raw_deltas.intensity),
        openness: clamp_delta(raw_deltas.openness),
        affinity: clamp_delta(raw_deltas.affinity),
        velocity: clamp_delta(raw_deltas.velocity),
        entropy: clamp_delta(raw_deltas.entropy),
      },
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
 * Turn 2: Character prose streaming.
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

  const raw = await transport.stream(prompt, { onChunk, startWith: start_with, signal, silent: true });
  const { think, body: prose } = extract_think_and_body(raw, start_with);

  return { raw, think, prose, turn_tempo };
}

/**
 * Turn 2 continue-in-place: resumes mid-thought/prose via startWith, stripping
 * echoed prefix and falling back to history-anchored continuation on 0-token EOS.
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
  const turn_tempo = 3;
  const prompt = compile_prompt({ core: "CHARACTER", round, entities, history, memories, task_options: { turn_tempo } });

  const clean_prose = typeof target_prose === "string" ? target_prose.trim() : "";
  const clean_think = typeof target_think === "string" ? target_think.trim() : "";
  const { separator } = resolve_continuation_separator(clean_prose);
  const prose_lead = clean_prose ? `${clean_prose}${separator}` : "";

  let start_with = "<think>";
  if (clean_think) {
    start_with = `<think>${clean_think}</think>\n${prose_lead}`;
  } else if (clean_prose) {
    start_with = prose_lead;
  }

  let raw = await transport.stream(prompt, { onChunk, startWith: start_with, signal, silent: true });

  if (raw && !raw.includes("<think>") && clean_think) {
    raw = `${start_with}\n${raw}`;
  } else if (raw && !raw.trimStart().startsWith("<think>") && clean_think) {
    raw = `<think>${clean_think}</think>\n${raw}`;
  }

  const { think, prose } = parse_think_block(raw);

  let continuation_prose = prose;
  if (clean_prose && continuation_prose.startsWith(clean_prose)) {
    continuation_prose = continuation_prose.slice(clean_prose.length).trimStart();
  }

  if (!continuation_prose.trim() && clean_prose && !signal?.aborted) {
    const fallback_history = [...(Array.isArray(history) ? history : []), { role: "ai", text: clean_prose, round }];
    const fallback_prompt = compile_prompt({ core: "CHARACTER", round, entities, history: fallback_history, memories, task_options: { turn_tempo } });
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

  const final_fused_prose = clean_prose ? `${clean_prose}${continuation_prose ? `${separator}${continuation_prose}` : ""}` : continuation_prose;

  return { raw, think: think || clean_think, prose: final_fused_prose, continuation_prose, turn_tempo };
}

/**
 * Turn 3: Caretaker background memory and quadrant consolidation.
 */
export async function run_memory_consolidation_step({ transport, round = 1, entities = {}, history = [], target_entity_key = null, signal = null }) {
  if (signal?.aborted) {
    throw new Error("Stream aborted by user.");
  }

  const target = target_entity_key || resolve_caretaker_target((Number(round) || 1) - 1);
  const prompt = compile_prompt({ core: "CARETAKER", round, entities, history, task_options: { target_entity_key: target } });
  const start_prefix = PURPOSE_CORES.CARETAKER.start_with();
  const { raw, think, parsed } = await run_json_step({ transport, prompt, start_prefix, signal, priority: "background", retry: true });

  const parse_succeeded = Boolean(parsed);
  const _thought_process = think || parsed?._thought_process || "";
  const eternal_physical = typeof parsed?.eternal_physical === "string" ? parsed.eternal_physical : "";
  const eternal_non_physical = typeof parsed?.eternal_non_physical === "string" ? parsed.eternal_non_physical : "";
  const present_physical = typeof parsed?.present_physical === "string" ? parsed.present_physical : "";
  const present_non_physical = typeof parsed?.present_non_physical === "string" ? parsed.present_non_physical : "";
  const future = typeof parsed?.future === "string" ? parsed.future : "";
  const past = typeof parsed?.past === "string" ? parsed.past : "";

  const eternal = { physical: parse_tagged_fields(eternal_physical), non_physical: parse_tagged_fields(eternal_non_physical) };
  const present = { physical: parse_tagged_fields(present_physical), non_physical: parse_tagged_fields(present_non_physical) };
  const parsed_future = parse_tagged_fields(future);
  const parsed_past = parse_tagged_fields(past);
  const combined_bracket_text = [eternal_physical, eternal_non_physical, present_physical, present_non_physical, future, past].filter(Boolean).join("\n");

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
    brackets: parse_tagged_fields(combined_bracket_text),
  };
}

/**
 * Visualizer step: refines a camera note or draft into sanitized diffusion prompts.
 */
export async function run_image_prompt_step({ transport, round = 1, entities = {}, camera_note = "", subject_kind = "character", signal = null }) {
  if (signal?.aborted) {
    throw new Error("Stream aborted by user.");
  }

  const prompt = compile_prompt({ core: "VISUALIZER", round, entities, task_options: { camera_note, subject_kind } });
  const start_prefix = PURPOSE_CORES.VISUALIZER.start_with();
  const { raw, think, body, parsed } = await run_json_step({ transport, prompt, start_prefix, signal, priority: "background", retry: false });

  let candidate_prompt = typeof parsed?.prompt === "string" ? parsed.prompt.trim() : "";
  let candidate_negative = typeof parsed?.negative_prompt === "string" ? parsed.negative_prompt.trim() : "";
  const thought_process = think || (typeof parsed?._thought_process === "string" ? parsed._thought_process.trim() : "");

  if (!candidate_prompt && (body || raw)) {
    const text_to_search = body || raw;
    candidate_prompt = text_to_search;
    const n_match = /"negative(?:Prompt|_prompt)"\s*:\s*"((?:[^"\\]|\\.)*)"/i.exec(text_to_search);
    if (n_match?.[1]) {
      candidate_negative = n_match[1].replace(/\\"/g, '"').replace(/\\\\/g, "\\").trim();
    }
  }

  return {
    prompt: sanitize_visual_text(candidate_prompt),
    negative_prompt: sanitize_visual_text(candidate_negative),
    _thought_process: thought_process,
    raw: raw || "",
  };
}

/**
 * Profile extraction step: structures raw prose into 4-quadrant profile JSON.
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
  const { parsed } = await run_json_step({ transport, prompt, start_prefix, signal, priority: "background", retry: false });

  return parsed;
}

/**
 * Coordinates Turn 1 (Director) and Turn 2 (Character) for a round.
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
