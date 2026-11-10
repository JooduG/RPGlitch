/**
 * .agents/skills/simulation/scripts/sim-check.test.js
 * ✅ ENGINE-NATIVE SIMULATION CHECK (vitest).
 *
 * Covers: live-core prompt contract (shape, not bytes), turn smoke through the
 * real turns.js orchestrator on a mock transport, and Two-Tier Sieve memory
 * stress. Replaces simulation-audit.test.js, prompt-contract.test.js, and
 * consolidation-stress.test.js (all pinned eradicated intelligence/* modules
 * and deleted config keys).
 */

import { describe, it, expect } from "vitest";
import {
  LIVE_CORES,
  compile_live_cores,
  check_core_markers,
  run_turn_smoke,
  run_memory_stress,
  run_sim_check,
} from "./sim-check.js";

describe("sim-check: live-core prompt contract", () => {
  it("compiles all 4 live cores with zero envelope problems", () => {
    expect([...LIVE_CORES].sort()).toEqual(["CARETAKER", "CHARACTER", "DIRECTOR", "VISUALIZER"]);
    const { systems, problems } = compile_live_cores();
    expect(Object.keys(systems).sort()).toEqual(["CARETAKER", "CHARACTER", "DIRECTOR", "VISUALIZER"]);
    expect(problems).toEqual([]);
  });

  it("carries every core-specific marker", () => {
    const { systems } = compile_live_cores();
    expect(check_core_markers(systems)).toEqual([]);
  });
});

describe("sim-check: turn smoke on a mock transport", () => {
  it("director clamps rogue deltas and routes character + caretaker + visualizer + structuring", async () => {
    const { director, character, caretaker, visual, structuring } = await run_turn_smoke();
    expect(director.dynamics_deltas.chaos).toBe(20);
    expect(director.next_action).toBe("MAIN_CHARACTER");
    expect(director.directors_note).toContain("Hold the line.");
    expect(character.prose).toContain("Orion plants his boots");
    expect(character.think).toContain("stalling");
    expect(caretaker.target).toBe("AI");
    expect(caretaker.present_physical).toContain("[POSTURE: braced]");
    expect(visual.prompt).toContain("Neon plaza");
    expect(visual.prompt).not.toMatch(/[{}[\]]/);
    expect(structuring.eternal_non_physical).toContain("wary scout");
  }, 15000);
});

describe("sim-check: sieve memory stress (100 rounds)", () => {
  it("ranks origins first, counts tokens, and sieves within budget", () => {
    const stress = run_memory_stress();
    expect(stress.problems).toEqual([]);
    expect(stress.origin_first).toBe(true);
    expect(stress.selected_count).toBeGreaterThan(0);
  });
});

describe("sim-check: full headless gate", () => {
  it("passes end to end", () => {
    expect(run_sim_check().problems).toEqual([]);
  });
});

/**
 * CHANGELOG
 * -------------------------------------------------------------------------------------------------
 * 2026-11-10: Created — engine-native coverage replacing the three eradicated intelligence suites.
 */
