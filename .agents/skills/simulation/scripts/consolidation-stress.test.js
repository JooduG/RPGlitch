/**
 * @file .agents/skills/simulation/scripts/consolidation-stress.test.js
 * 🧪 100-ROUND CONSOLIDATION STRESS TEST: Background Caretaker Invariant Verification
 *
 * Verifies that across a simulated 100-round roleplay lifecycle:
 * 1. origin-pinned memories (usr_ prefix / is_origin) never get evicted.
 * 2. Session past vector pools respect the PAST_VECTOR_CAP (20) FIFO ceiling.
 * 3. | hide tags remain strictly intact across mutations and never leak across boundaries.
 * 4. High-emotional-weight memories (w >= 7) maintain crisp fidelity under degradation.
 * 5. Low-emotional-weight memories (w <= 6) degrade deterministically under high entropy/chaos.
 */

import { describe, it, expect } from "vitest";
import { temporal_engine, format_hybrid_recall, PAST_VECTOR_CAP, MAX_TOTAL_VECTORS } from "../../../../src/intelligence/temporal.js";
import { DEFAULT_PROMPT_CEILING, resolve_prompt_budget_allocation } from "../../../../src/config.js";

describe("🧪 100-Round Consolidation & Caretaker Stress Harness", () => {
  it("maintains budget allocations from the promoted config", () => {
    const budget = resolve_prompt_budget_allocation(DEFAULT_PROMPT_CEILING);
    expect(budget.ceiling).toBe(6000);
    expect(budget.entities_max_tokens).toBe(2000);
    expect(budget.history_max_tokens).toBe(1600);
  });

  it("simulates 100 continuous rounds of memory formation, eviction, and recall", () => {
    // Setup initial entity state with origin-pinned backstory and secret | hide item
    const entity = {
      id: "julien",
      name: "Julien",
      present: {
        physical: "[CHEST: bare] [SCAR: jagged line across collarbone]",
        non_physical: "[MOOD: guarded] [SECRET: plans to assassinate the duke | hide]",
      },
      past: [
        {
          id: "usr_origin_backstory",
          timestamp: Date.now() - 1000000,
          content: "[ORIGIN: Banished prince of the fallen Ashenweald court]",
          type: "past",
          emotional_weight: 10,
          meta: { round: 0, is_origin: true },
        },
        {
          id: "usr_secret_weapon",
          timestamp: Date.now() - 900000,
          content: "[CONCEALED: carries poison phial beneath boot lining | hide]",
          type: "past",
          emotional_weight: 8,
          meta: { round: 0, is_origin: true },
        },
      ],
      dynamics: { chaos: 10, entropy: 10 },
    };

    // Simulate 100 rounds
    for (let round = 1; round <= 100; round++) {
      temporal_engine.set_round(round);

      // Mutate dynamics dynamically
      entity.dynamics.chaos = (round * 3) % 100;
      entity.dynamics.entropy = Math.min(100, Math.floor(round * 0.9));

      // Form a new session memory each round
      const is_critical_beat = round % 10 === 0;
      const weight = is_critical_beat ? 9 : (round % 6) + 1; // 1 to 6, or 9 on critical beats
      const memory_content = is_critical_beat
        ? `[MILESTONE: pivotal encounter at round ${round} sworn under blood oath]`
        : `[OBSERVATION: round ${round} routine scouting in the ash fog]`;

      const new_vector = {
        id: `ai_round_${round}`,
        timestamp: Date.now() - (100 - round) * 10000,
        content: memory_content,
        type: "past",
        emotional_weight: weight,
        meta: { round },
      };

      temporal_engine.append_past_vector(entity, new_vector);

      // Invariant Check 1: usr_ origin memories are NEVER evicted
      expect(entity.past.some((v) => v.id === "usr_origin_backstory")).toBe(true);
      expect(entity.past.some((v) => v.id === "usr_secret_weapon")).toBe(true);

      // Invariant Check 2: Total memory pool never exceeds MAX_TOTAL_VECTORS
      expect(entity.past.length).toBeLessThanOrEqual(MAX_TOTAL_VECTORS);

      // Invariant Check 3: Active session (ai_) pool does not indefinitely balloon
      const ai_vectors = entity.past.filter((v) => v.id.startsWith("ai_"));
      expect(ai_vectors.length).toBeLessThanOrEqual(PAST_VECTOR_CAP + 1);
    }

    // Invariant Check 4: | hide tag survival
    const secret_memory = entity.past.find((v) => v.id === "usr_secret_weapon");
    expect(secret_memory).toBeDefined();
    expect(secret_memory.content).toContain("| hide");

    // Invariant Check 5: Sensory Degradation under High Chaos / High Entropy
    entity.dynamics.chaos = 95;
    entity.dynamics.entropy = 90;

    const query = "ash blood encounter oath scouting";
    const recall_prose = format_hybrid_recall(entity.past, query, {
      current_round: 100,
      dynamics: entity.dynamics,
    });

    // High entropy triggers [fragmented recall]
    expect(recall_prose).toContain("[fragmented recall]");

    // High-weight memories (e.g. weight 9 or 10) must remain crisp even under fragmentation
    expect(recall_prose).toContain("sworn under blood oath");

    // Low-weight memories (w <= 6) must exhibit sensory block degradation
    expect(recall_prose).toContain("■");
  });
});
