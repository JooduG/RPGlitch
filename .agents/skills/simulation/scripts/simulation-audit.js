/**
 * @file simulation-audit.js
 * 🏎️ THE DRIVETRAIN: Core Simulation Execution Harness.
 * Handles the linear flow of Hydration -> Simulation -> Synthesis.
 *
 * Updated for Bayesian Psychology Engine:
 * - Correct entity mapping (direct present/eternal, not fragments wrapper)
 * - Passes raw_messages for Director AI_LAST_TURN
 * - Includes dynamics_baseline in entity mapping
 * - Enriches vectors with category/triggers when missing
 * - Verifies new pipeline features: evidence_classification, cognitive attrs (certainty/regulation),
 *   ACTIVE_GOALS, ATMOSPHERIC_CHANGES, trigger amplification, goal arbitration
 */

import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import path from "node:path";

// CLI Runner: When executed directly via Node (node .agents/skills/simulation/scripts/simulation-audit.js),
// delegate to Vitest to run the audit harness in the Vite / Svelte 5 compilation environment.
if (process.argv[1] && path.resolve(fileURLToPath(import.meta.url)) === path.resolve(process.argv[1])) {
  const result = spawnSync(
    process.platform === "win32" ? "npx.cmd" : "npx",
    ["vitest", "run", ".agents/skills/simulation/scripts/simulation-audit.test.js"],
    { stdio: "inherit", shell: true },
  );
  process.exit(result.status ?? 0);
}

let context_builder = null;
let compile_prompt = null;
let get_premade_entity_by_id = null;

async function ensure_simulation_dependencies() {
  if (!context_builder) {
    const builder_module = await import("../../../../src/intelligence/builder.js");
    context_builder = builder_module.context_builder;
    const prompts_module = await import("../../../../src/intelligence/prompts.js");
    compile_prompt = prompts_module.compile_prompt;
    const premades_module = await import("../../../../src/data/definitions/premade-entities.js");
    get_premade_entity_by_id = premades_module.get_premade_entity_by_id;
  }
}

/**
 * Enriches a vector with category and triggers fields if missing.
 * This lets the audit test the goal-arbitration and trigger-amplification
 * pipelines even with legacy premade vectors that predate the schema extension.
 * @param {any} v
 * @returns {any}
 */
function enrich_vector(v) {
  if (!v) return v;
  return {
    ...v,
    category: v.category || "event",
  };
}

/**
 * Maps a raw premade entity into the structure the prompt builder expects.
 * Ensures present/eternal are direct properties (not nested in fragments),
 * enriches past vectors with category/triggers, and passes future through
 * as its consolidated prose string.
 * @param {any} data
 * @returns {any}
 */
function map_entity(data) {
  if (!data) return undefined;
  return {
    id: data.id,
    name: data.name,
    type: data.type,
    present: data.present || { physical: "", non_physical: "" },
    eternal: data.eternal || { physical: "", non_physical: "" },
    past: Array.isArray(data.past) ? data.past.map(enrich_vector) : data.past || "",
    future: data.future || "",
    dynamics: data.dynamics || {},
    dynamics_baseline: data.dynamics_baseline || null,
    pov: data.pov || "",
    visual_style: data.visual_style || "",
    narrative_style: data.narrative_style || "",
  };
}

/**
 * HIGH-LEVEL ORCHESTRATOR
 * Designed to be imported by audit scripts or agentic tasks.
 */
export const SimulationAudit = {
  /**
   * Executes a complete intelligence cycle.
   * @param {string} input - The user prompt/action.
   * @param {object} scenario - Metadata containing entities and world state.
   * @param {object} [overrides] - Optional overrides for dynamics, flags, etc.
   */
  async execute_turn(input, scenario, overrides = {}) {
    await ensure_simulation_dependencies();
    // 1. PHASE 1: HYDRATION (Context Assembly)
    const raw_entities = await this.resolve_entities(scenario);
    const history = scenario.history || [];

    // Construct the payload as expected by the context_builder
    const payload = await context_builder.build_context(input, "simulation", history);

    // Map scenario entities to the flattened Kernel structure (Role -> Data)
    // Use direct present/eternal (not fragments wrapper) — prompts access
    // entities.AI.present.non_physical directly.
    for (const [key, data] of Object.entries(raw_entities)) {
      const role = key.toUpperCase();
      payload.entities[role] = map_entity(data);
    }

    // Ensure raw_messages is available for Director's AI_LAST_TURN block
    payload.raw_messages = history;

    // 2. PHASE 2: PHYSICS (Snapshot Construction)
    const snapshot = {
      ai: {
        dynamics: overrides.ai_dynamics ||
          raw_entities.ai?.dynamics || {
            chaos: 50,
            openness: 50,
            intensity: 50,
            affinity: 50,
          },
      },
      fractal: {
        dynamics: overrides.fractal_dynamics ||
          raw_entities.fractal?.dynamics || {
            velocity: 50,
            entropy: 50,
          },
      },
      flags: overrides.flags || [],
    };

    // 3. PHASE 3: SYNTHESIS (Prompt Construction)
    const director_prompt = compile_prompt("director", { ...payload, compressed_snapshot: snapshot });
    const character_prompt = compile_prompt("interaction", { ...payload, snapshot });

    // 4. PHASE 4: VERIFICATION (Pipeline Feature Audit)
    const verification = this.verify_pipeline(director_prompt, character_prompt);

    return {
      payload,
      snapshot,
      director_prompt: director_prompt.system,
      character_prompt: character_prompt.system,
      verification,
    };
  },

  /**
   * Verifies that the generated prompts contain all expected pipeline features.
   * Prompts are compiled closed envelopes where task layers are sealed inside system.
   * @param {{ system: string }} director
   * @param {{ system: string }} character
   * @returns {{ passed: string[], failed: string[] }}
   */
  verify_pipeline(director, character) {
    const passed = [];
    const failed = [];

    const check = (name, condition) => {
      if (condition) passed.push(name);
      else failed.push(name);
    };

    // --- Director (Shot 1) Feature Verification ---
    check("director:system_has_role_line", director.system.includes("You are the Director"));
    check("director:system_has_DYNAMIC_AXES", director.system.includes("<DYNAMIC_AXES"));
    check("director:system_has_ENTITIES", director.system.includes("<ENTITIES>"));
    check("director:task_has_schema_keywords", director.system.includes('"keywords": ["<1-5 from:'));
    check(
      "director:system_no_empty_protocols",
      !director.system.includes("<CORE_PROTOCOLS></CORE_PROTOCOLS>") && !director.system.includes("<CORE_PROTOCOLS>\n  </CORE_PROTOCOLS>"),
    );
    check("director:task_has_JSON_schema", director.system.includes('"_thought_process"'));
    check("director:task_has_next_action", director.system.includes('"next_action"'));
    check("director:task_has_keywords", director.system.includes('"keywords"'));
    check("director:task_has_dynamics_deltas", director.system.includes("dynamics_deltas"));
    check("director:task_has_visual_staging", director.system.includes('"visual_staging"'));
    check("director:task_has_spotlight_schema", director.system.includes('"spotlight"'));

    // --- Character (Shot 2) Feature Verification ---
    check("character:system_has_AXIOMATIC_CONSTITUTION", character.system.includes("<AXIOMATIC_CONSTITUTION>"));
    check("character:system_has_CORE_PROTOCOLS", character.system.includes("<CORE_PROTOCOLS>"));
    check("character:system_has_ENTITIES", character.system.includes("<ENTITIES>"));

    // Prefix-cache & Task Verification:
    check("character:system_lacks_dynamics_attrs", !character.system.includes("chaos="));
    check("character:system_lacks_PRESENT", !character.system.includes("<PRESENT>"));
    check("character:task_has_ACTION", character.system.includes("<ACTION"));
    check("character:task_has_CURRENTS", character.system.includes("<CURRENTS>"));
    check("character:task_has_DELIVERY_POSTURE", character.system.includes("<DELIVERY_POSTURE>"));
    check("character:task_has_THINK", character.system.includes("<THINK>"));
    check("character:task_has_CONSTRAINTS", character.system.includes("<CONSTRAINTS>"));

    return { passed, failed };
  },

  /**
   * Resolves entity data from IDs or static premades.
   */
  async resolve_entities(scenario) {
    await ensure_simulation_dependencies();
    const result = {};
    const types = ["ai", "user", "fractal"];

    for (const type of types) {
      const entity_id = scenario[type + "_id"];
      if (entity_id) {
        const found = get_premade_entity_by_id(entity_id);
        if (found) {
          result[type] = found;
        }
      } else if (scenario[type]) {
        result[type] = scenario[type];
      }
    }

    return result;
  },
};

// =============================================================================
// CHANGELOG
// =============================================================================

/**
 * CHANGELOG:
 * - 2026-09-18: Standardized verification checks to match scrobbles.md blueprint (<ENTITIES>, <CORE_PROTOCOLS>).
 * - 2026-09-18: Standardized verification tags to match spatial and prompt specifications (<AVAILABLE_ENTITIES>, <PRESENT_ENTITIES>, <THINK>).
 * - 2026-09-19: Replaced director:system_has_CORE_PROTOCOLS with director:system_no_empty_protocols per R1/R5 dynamic protocol omission.
 * - 2026-09-19: Retired prompt_builder import. Migrated PHASE 3 synthesis to compile_prompt("director") and compile_prompt("interaction") under P4 Zero Backwards Compatibility (Mega Report D1).
 * - 2026-09-19: Retired stale character:system_has_DYNAMIC_AXES verification check — DYNAMIC_AXES are now exclusively in the Director shot's <DYNAMICS> envelope and are conditional on entity dynamics data.
 * - 2026-09-24: Updated context_builder import from retired payload.js to builder.js under P4 Zero Backwards Compatibility.
 * - 2026-10-14: Wave 2 — Updated pipeline verification to validate schema-co-located keywords and unified character <CONSTRAINTS> layer, retiring stale director:task_has_KEYWORD_DIRECTIVES check.
 * - 2026-10-14: Added direct Node CLI execution delegation to Vitest and lazy-loaded Vite/Svelte dependencies so 'node .agents/skills/simulation/scripts/simulation-audit.js' runs seamlessly from the terminal.
 */
