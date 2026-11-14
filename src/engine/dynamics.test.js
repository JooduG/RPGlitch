import { describe, expect, it } from "vitest";
import { PHYSICS_PROTOCOLS, AVAILABLE_KEYWORDS, DYNAMICS_RULES } from "../definitions/dynamics-registry.js";
import {
  apply_dynamics_gravity,
  extract_entity_dynamics_baselines,
  compute_dynamics_deltas,
  evaluate_subtext_protocols,
  evaluate_dynamics_rules,
  reduce_dynamics,
} from "./dynamics.js";

describe("engine/dynamics.js & definitions/dynamics.js", () => {
  describe("definitions/dynamics.js contracts", () => {
    it("exports frozen protocol dictionaries, keywords, and rules", () => {
      expect(typeof PHYSICS_PROTOCOLS).toBe("object");
      expect(Array.isArray(AVAILABLE_KEYWORDS)).toBe(true);
      expect(typeof DYNAMICS_RULES).toBe("object");
    });
  });

  describe("extract_entity_dynamics_baselines", () => {
    it("extracts baselines from entity or returns empty object", () => {
      const entity_with_baselines = { dynamics_baseline: { intensity: 60, affinity: 70 } };
      expect(extract_entity_dynamics_baselines(entity_with_baselines)).toEqual({ intensity: 60, affinity: 70 });
      expect(extract_entity_dynamics_baselines(null)).toEqual({});
      expect(extract_entity_dynamics_baselines({})).toEqual({});
    });
  });

  describe("reduce_dynamics", () => {
    it("is pure and deterministic", () => {
      const current = { chaos: 60, intensity: 40 };
      const first = reduce_dynamics(current, { chaos: 30, intensity: 70 }, 50);
      const second = reduce_dynamics(current, { chaos: 30, intensity: 70 }, 50);
      expect(first).toEqual(second);
      expect(first).not.toBe(current);
    });

    it("clamps output to 0-100", () => {
      const next = reduce_dynamics({ chaos: 95 }, {}, 50, { chaos: 50 });
      expect(next.chaos).toBeLessThanOrEqual(100);
      const floored = reduce_dynamics({ chaos: 5 }, {}, 50, { chaos: -50 });
      expect(floored.chaos).toBeGreaterThanOrEqual(0);
    });
  });

  describe("apply_dynamics_gravity", () => {
    it("settles dynamic metrics toward baseline", () => {
      const dynamics = { chaos: 80, intensity: 20 };
      const baselines = { chaos: 50, intensity: 50 };
      apply_dynamics_gravity(dynamics, baselines, 50, 0.2);
      expect(dynamics.chaos).toBeLessThan(80);
      expect(dynamics.intensity).toBeGreaterThan(20);
    });
  });

  describe("compute_dynamics_deltas", () => {
    it("computes accurate diffs and formatted log strings", () => {
      const dynamics = { chaos: 65, intensity: 45, openness: 50, affinity: 50 };
      const runtime_target = { chaos: 50, intensity: 50, openness: 50, affinity: 50 };
      const { deltas, log_strings } = compute_dynamics_deltas("ai", dynamics, runtime_target);

      expect(deltas.length).toBe(2);
      expect(deltas.find((d) => d.axis === "chaos")?.diff).toBe(15);
      expect(deltas.find((d) => d.axis === "intensity")?.diff).toBe(-5);
      expect(log_strings).toContain("Chaos +15");
      expect(log_strings).toContain("Intensity -5");
    });
  });

  describe("evaluate_subtext_protocols", () => {
    it("triggers protocols based on threshold rules", () => {
      const ai_dynamics = { intensity: 80, affinity: 40 };
      const protocols = evaluate_subtext_protocols({ ai_dynamics });
      expect(protocols.some((p) => p.id === "ADRENALINE")).toBe(true);
    });
  });

  describe("evaluate_dynamics_rules", () => {
    it("returns priority-ranked active rules capped at max_directives", () => {
      const dynamics = { intensity: 85, affinity: 30, chaos: 80 };
      const rules = evaluate_dynamics_rules(dynamics, [], 2);
      expect(rules.length).toBeLessThanOrEqual(2);
      expect(rules).toContain("FEAR");
    });
  });
});
