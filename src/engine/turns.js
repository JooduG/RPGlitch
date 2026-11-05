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

import { compile_prompt } from "./prompts.js";
import { extract_think_block, parse_brackets } from "./parser.js";
import { LENGTH_THRESHOLDS } from "../config.js";

/** Default round-robin entity rotation for Turn 3 Caretaker consolidation */
export const CARETAKER_ROTATION = Object.freeze(["AI", "USER", "FRACTAL"]);

/**
 * Resolves which entity key is targeted for Caretaker consolidation in the current round.
 * Rotates sequentially across AI -> USER -> FRACTAL (+ any active NPC).
 *
 * @param {number} round
 * @param {object} [entities={}]
 * @returns {string} Target entity key (e.g., 'AI', 'USER', 'FRACTAL', 'npc')
 */
export function resolve_caretaker_target(round, entities = {}) {
  const cast = [...CARETAKER_ROTATION];
  if (entities.npc && entities.npc.id) {
    cast.push("npc");
  }
  const index = Math.abs(round - 1) % cast.length;
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
export async function execute_turn_1_director({ transport, round = 1, entities = {}, history = [] }) {
  const prompt = compile_prompt({
    core: "director",
    round,
    entities,
    history,
  });

  const start_prefix = '{"_thought_process": "';
  let raw_output = await transport.stream(prompt, { startWith: start_prefix });

  // If transport returned only the delta, ensure prefix is restored for JSON parsing
  if (raw_output && !raw_output.trimStart().startsWith("{")) {
    raw_output = start_prefix + raw_output;
  }

  try {
    // Locate JSON block within output
    const json_match = /\{[\s\S]*\}/.exec(raw_output);
    if (json_match) {
      const parsed = JSON.parse(json_match[0]);

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

      return {
        _thought_process: typeof parsed?._thought_process === "string" ? parsed._thought_process : "",
        next_action: typeof parsed?.next_action === "string" ? parsed.next_action : "MAIN_CHARACTER",
        directors_note: typeof parsed?.directors_note === "string" ? parsed.directors_note : "",
        dynamics_deltas,
        camera_note: typeof parsed?.camera_note === "string" ? parsed.camera_note : "",
      };
    }
  } catch (err) {
    // Fallback default staging if JSON malformed
    console.warn("[Turns] Malformed Turn 1 Director JSON, falling back to default staging:", err);
  }

  return {
    _thought_process: "Direct staging fallback.",
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
}) {
  const turn_tempo = calculate_turn_tempo(history);

  const prompt = compile_prompt({
    core: "character",
    round,
    entities,
    history,
    memories,
    task_options: { directors_note, turn_tempo },
  });

  const start_with = directors_note ? `<think>${directors_note}\n` : "<think>";
  let raw = await transport.stream(prompt, { onChunk, startWith: start_with });

  // If the model closed the prefilled <think> block or continued prose directly without closing it
  if (raw && !raw.includes("<think>")) {
    raw = `${start_with}</think>\n${raw}`;
  } else if (raw && !raw.trimStart().startsWith("<think>")) {
    raw = start_with + raw;
  }
  const { think, prose } = extract_think_block(raw);

  return {
    raw,
    think,
    prose,
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
export async function execute_round({ transport, round = 1, entities = {}, history = [], memories = [], director_enabled = false, onChunk = null }) {
  let director_staging = null;

  if (director_enabled) {
    director_staging = await execute_turn_1_director({
      transport,
      round,
      entities,
      history,
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
export async function execute_turn_3_caretaker({ transport, round = 1, entities = {}, history = [], target_entity_key = null }) {
  const target = target_entity_key || resolve_caretaker_target(round, entities);

  const prompt = compile_prompt({
    core: "caretaker",
    round,
    entities,
    history,
    task_options: { target_entity_key: target },
  });

  const start_prefix = '{"_thought_process": "';
  let raw = await transport.stream(prompt, { startWith: start_prefix });

  if (raw && !raw.trimStart().startsWith("{")) {
    raw = start_prefix + raw;
  }

  let parsed = null;
  try {
    const json_match = /\{[\s\S]*\}/.exec(raw);
    if (json_match) {
      parsed = JSON.parse(json_match[0]);
    }
  } catch (_err) {
    // Malformed JSON fallback
  }

  const _thought_process = parsed?._thought_process || "";
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
