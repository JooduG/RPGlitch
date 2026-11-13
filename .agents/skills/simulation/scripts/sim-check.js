/**
 * .agents/skills/simulation/scripts/sim-check.js
 * ✅ ENGINE-NATIVE SIMULATION CHECK - turn smoke + prompt contract + memory stress.
 *
 * Replaces simulation-audit.js, prompt-contract.test.js, and
 * consolidation-stress.test.js, which pinned the eradicated src/intelligence/*
 * tree and deleted config keys (DEFAULT_PROMPT_CEILING, PAST_VECTOR_CAP).
 * This module talks ONLY to live post-demolition APIs:
 *
 * - prompt contract: compile_prompt({ core, ... }) over the 4 live purpose
 *   cores in src/engine/prompts.js (DIRECTOR, CHARACTER, CARETAKER, VISUALIZER).
 * - turn smoke: execute_turn_1_director / execute_turn_2_character /
 *   execute_turn_3_caretaker / execute_turn_visualizer / execute_turn_structuring
 *   from src/engine/turns.js against an injected mock transport.
 * - memory stress: two_tier_sieve_rag + score_and_rank_memories + cosine_similarity
 *   from src/engine/sieve.js (the real Two-Tier Sieve).
 *
 * No byte pins: prompt bytes are environment truth (generated tokens.js, DESIGN
 * churn) and re-pin on every intentional prompt change - the contract asserts
 * SHAPE (close tags, single TASK, core markers), not bytes.
 */

import { compile_prompt } from "../../../../src/engine/prompts.js";
import { cosine_similarity, count_text_tokens, score_and_rank_memories, two_tier_sieve_rag } from "../../../../src/engine/sieve.js";
import {
  execute_turn_1_director,
  execute_turn_2_character,
  execute_turn_3_caretaker,
  execute_turn_structuring,
  execute_turn_visualizer,
  resolve_caretaker_target,
} from "../../../../src/engine/turns.js";

export const LIVE_CORES = Object.freeze(["DIRECTOR", "CHARACTER", "CARETAKER", "VISUALIZER"]);

const MINIMAL_ENTITIES = Object.freeze({
  AI: {
    id: "orion",
    name: "Orion",
    type: "character",
    eternal: { physical: "[BUILD: herculean]", non_physical: "[CORE: golden-retriever himbo]" },
    present: { physical: "[POSTURE: heroic stance]", non_physical: "[MOOD: earnest]" },
    future: "[GOAL: protect the plaza]",
    past: "",
    dynamics: { chaos: 57, intensity: 56, openness: 60, affinity: 58 },
  },
  USER: {
    id: "glitch",
    name: "Glitch",
    type: "character",
    eternal: { physical: "[BUILD: wiry]", non_physical: "[CORE: cautious]" },
    present: { physical: "[POSE: low]", non_physical: "[MOOD: wary]" },
    future: "",
    past: "",
    dynamics: { chaos: 40, intensity: 40, openness: 50, affinity: 50 },
  },
  FRACTAL: {
    id: "nova",
    name: "Nova City",
    type: "fractal",
    eternal: { physical: "", non_physical: "[GENRE: neon sprawl]" },
    present: { physical: "[LIGHT: flickering neon]", non_physical: "[HUM: grid surge]" },
    future: "[TRAJECTORY: blackout looms]",
    past: "",
    dynamics: { velocity: 56, entropy: 56 },
  },
});

/**
 * Compiles every live core once and asserts the prompt-envelope shape.
 *
 * @returns {{ systems: Record<string, string>, problems: string[] }}
 */
export function compile_live_cores() {
  const systems = {};
  const problems = [];
  const history = [{ role: "user", origin: "Glitch", text: "The grid is surging.", round: 1 }];
  for (const core of LIVE_CORES) {
    let system;
    try {
      system = String(
        compile_prompt({
          core,
          round: 1,
          entities: MINIMAL_ENTITIES,
          history,
          task_options: core === "CARETAKER" ? { target_entity_key: "AI" } : core === "CHARACTER" ? { directors_note: "Hold the line." } : {},
        }),
      );
    } catch (error) {
      problems.push(`${core} THREW: ${(error && error.message) || error}`);
      continue;
    }
    systems[core] = system;
    if (!system.endsWith("</SYSTEM>")) problems.push(`${core}: missing </SYSTEM> close`);
    if ((system.match(/<TASK\b/g) || []).length !== 1) problems.push(`${core}: TASK count != 1`);
  }
  return { systems, problems };
}

/**
 * Asserts core-specific markers on compiled systems.
 *
 * @param {Record<string, string>} systems
 * @returns {string[]} problems (empty when the contract holds)
 */
export function check_core_markers(systems) {
  const problems = [];
  const expect = (core, marker) => {
    if (!systems[core] || !systems[core].includes(marker)) problems.push(`${core}: missing ${marker}`);
  };
  expect("DIRECTOR", "dynamics_deltas");
  expect("DIRECTOR", '<OUTPUT_FORMAT mode="json">');
  expect("CHARACTER", "Pacing & Posture");
  // NOTE: render_thinking_mode escapes think tags for verifier safety (see
  // prompts.js docblock), so pin the directive prose, not the literal tag.
  expect("CHARACTER", "thinking process");
  expect("CARETAKER", "Bracket Mutation Rules");
  expect("CARETAKER", "eternal_physical");
  expect("VISUALIZER", "Prompt Synthesis");
  expect("VISUALIZER", "negative_prompt");
  return problems;
}

/**
 * Builds a mock transport resolving canned outputs per core.
 *
 * @param {Record<string, string>} canned Map of core -> raw model output.
 * @returns {{ stream: (prompt: string, opts?: any) => Promise<string> }}
 */
export function mock_transport_for(canned) {
  return {
    async stream(prompt, _opts = {}) {
      const text = String(prompt || "");
      if (text.includes("orchestrating simulation mechanics")) return canned.DIRECTOR;
      if (text.includes("Sensory Cortex")) return canned.VISUALIZER;
      if (text.includes("Continuum Caretaker")) return canned.CARETAKER;
      return canned.CHARACTER;
    },
  };
}

export const CANNED = Object.freeze({
  DIRECTOR:
    '<think>{"staging": true}</think>\n{"dynamics_deltas": {"chaos": 999, "intensity": 3, "openness": 0, "affinity": 1, "velocity": -5, "entropy": 2}, "next_action": "MAIN_CHARACTER", "directors_note": "Hold the line.", "camera_note": "Low angle."}',
  CHARACTER: "<think>(He is stalling - keep a hand near the latch.)</think>\nOrion plants his boots and grins.",
  CARETAKER:
    '<think>{"delta": true}</think>\n{"eternal_physical": "", "eternal_non_physical": "", "present_physical": "[POSTURE: braced]", "present_non_physical": "", "future": "[GOAL: hold the plaza]", "past": ""}',
  VISUALIZER: '<think>{"stage": true}</think>\n{"prompt": "Neon plaza at dusk, braced hero", "negative_prompt": "blurry, low quality"}',
  STRUCTURING:
    '<think>{"ingest": true}</think>\n{"eternal_physical": "", "eternal_non_physical": "[CORE: wary scout]", "present_physical": "", "present_non_physical": "", "future": "", "past": ""}',
});

/**
 * Runs the turn smoke: director -> character -> caretaker -> visualizer -> structuring.
 *
 * @returns {Promise<{ director: any, character: any, caretaker: any, visual: any, structuring: any }>}
 */
export async function run_turn_smoke() {
  const transport = mock_transport_for(CANNED);
  const entities = { ...MINIMAL_ENTITIES };
  const history = [{ role: "user", origin: "Glitch", text: "Hold the line.", round: 1 }];
  const director = await execute_turn_1_director({ transport, round: 1, entities, history });
  const character = await execute_turn_2_character({
    transport,
    round: 1,
    entities,
    history,
    directors_note: director.directors_note,
  });
  const caretaker = await execute_turn_3_caretaker({ transport, round: 1, entities, history });
  const visual = await execute_turn_visualizer({ transport, round: 1, entities, camera_note: director.camera_note });
  const structuring_transport = {
    async stream() {
      return CANNED.STRUCTURING;
    },
  };
  const structuring = await execute_turn_structuring({ transport: structuring_transport, input_data: "wary scout", type: "character" });
  return { director, character, caretaker, visual, structuring };
}

/**
 * Runs the memory stress: 100 rounds of formation through the real sieve.
 *
 * @returns {{ selected_count: number, total_characters: number, origin_first: boolean, problems: string[] }}
 */
export function run_memory_stress() {
  const problems = [];
  const candidates = [];
  for (let round = 1; round <= 100; round += 1) {
    const critical = round % 10 === 0;
    candidates.push({
      id: critical ? `usr_milestone_${round}` : `ai_round_${round}`,
      text: critical ? `[MILESTONE: sworn blood oath at round ${round}]` : `[OBSERVATION: routine scouting at round ${round}]`,
      vector: null,
      is_origin: critical,
    });
  }
  candidates.push(
    { id: "usr_origin_backstory", text: "[ORIGIN: banished prince]", vector: null, is_origin: true },
    { id: "usr_secret_weapon", text: "[CONCEALED: poison phial | hide]", vector: null, is_origin: true },
  );
  const query = new Array(384).fill(0.1);
  const ranked = score_and_rank_memories(candidates, query);
  if (ranked.length !== candidates.length) problems.push("sieve dropped candidates during ranking");
  if (!ranked[0] || ranked[0].item.is_origin !== true) problems.push("origin protection did not float an origin memory first");
  const query_text = candidates.map((c) => c.text).join(" ");
  const tokens = count_text_tokens(query_text);
  if (!(tokens > 0)) problems.push("token counter returned non-positive for a 100-round transcript");

  const primary = candidates.filter((c) => c.id.startsWith("usr_")).map((c) => ({ ...c, text: c.text }));
  const lore = candidates.filter((c) => c.id.startsWith("ai_")).map((c) => ({ ...c, text: c.text }));
  const sieved = two_tier_sieve_rag({ primary_memories: primary, lore_memories: lore, query_vector: query });
  if (!(sieved.selected.length > 0)) problems.push("sieve selected nothing under a 100-round load");
  return {
    selected_count: sieved.selected.length,
    total_characters: sieved.total_characters,
    origin_first: Boolean(ranked[0] && ranked[0].item.is_origin),
    problems,
  };
}

/**
 * Full headless check: cores + markers + caretaker rotation sanity.
 *
 * @returns {{ problems: string[] }}
 */
export function run_sim_check() {
  const problems = [];
  const { systems, problems: compile_problems } = compile_live_cores();
  problems.push(...compile_problems);
  problems.push(...check_core_markers(systems));
  const rotation = [1, 2, 3, 4].map((round) => resolve_caretaker_target(round, {}));
  if (rotation.join(",") !== "AI,USER,FRACTAL,AI") problems.push(`caretaker rotation broke: ${rotation.join(",")}`);
  if (cosine_similarity([1, 0], [1, 0]) !== 1) problems.push("cosine sanity failed");
  return { problems };
}

if (process.argv[1] && String(process.argv[1]).endsWith("sim-check.js")) {
  const { problems } = run_sim_check();
  const stress = run_memory_stress();
  const all = [...problems, ...stress.problems];
  if (all.length > 0) {
    console.error(`SIM-CHECK FAILED (${all.length}):`);
    for (const problem of all) console.error(` - ${problem}`);
    process.exit(1);
  }
  console.log(`SIM-CHECK PASSED: ${LIVE_CORES.length} cores, rotation OK, stress selected ${stress.selected_count} memories.`);
}

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Created - replaces simulation-audit.js (eradicated intelligence/* imports), the
 *   prompt-contract byte pins (environment truth, not contract), and consolidation-stress
 *   (deleted config keys). Asserts live shape + behavior only.
 */
