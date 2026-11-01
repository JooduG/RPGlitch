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
 * Evaluates the user input length and returns the calibrated Turn Tempo (beat budget).
 * Enforces dynamic conversational rhythm matching input density:
 * - Tiny (< 25 chars): 1 snappy beat
 * - Small (< 150 chars): 2 beats
 * - Medium (< 300 chars): 3 beats
 * - Expansive (>= 500 chars): 4 beats
 *
 * @param {string} input
 * @returns {number} Allowed sentence / beat count
 */
export function calculate_turn_tempo(input) {
  if (!input || typeof input !== "string") return 2;
  const len = input.trim().length;

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
export async function execute_turn_1_director({ transport, round = 1, entities = {}, history = [], input = "" }) {
  const prompt = compile_prompt({
    core: "director",
    round,
    entities,
    history,
  });

  const raw_output = await transport.stream(prompt);

  try {
    // Locate JSON block within potential thought output
    const json_match = /\{[\s\S]*\}/.exec(raw_output);
    if (json_match) {
      return JSON.parse(json_match[0]);
    }
  } catch (_err) {
    // Fallback default staging if JSON malformed
  }

  return {
    _thought_process: "Direct staging fallback.",
    next_action: "AI_CHARACTER",
    story_status: "ACTIVE",
    keywords: [],
    directors_note: "Continue the scene naturally.",
    dynamics_deltas: { chaos: 0, intensity: 0, openness: 0, affinity: 0 },
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
  input = "",
  directors_note = "",
  onChunk = null,
}) {
  const turn_tempo = calculate_turn_tempo(input);

  const prompt = compile_prompt({
    core: "character",
    round,
    entities,
    history,
    memories,
    task_options: { directors_note, turn_tempo },
  });

  const raw = await transport.stream(prompt, { onChunk });
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
export async function execute_round({
  transport,
  round = 1,
  entities = {},
  history = [],
  memories = [],
  input = "",
  director_enabled = false,
  onChunk = null,
}) {
  let director_staging = null;

  if (director_enabled) {
    director_staging = await execute_turn_1_director({
      transport,
      round,
      entities,
      history,
      input,
    });
  }

  const character_turn = await execute_turn_2_character({
    transport,
    round,
    entities,
    history,
    memories,
    input,
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
 * @returns {Promise<{ raw: string, target: string, brackets: Array<any> }>}
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

  const raw = await transport.stream(prompt);
  const brackets = parse_brackets(raw);

  return {
    raw,
    target,
    brackets,
  };
}
