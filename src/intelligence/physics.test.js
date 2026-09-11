import { describe, expect, it } from "vitest";
import { NARRATIVE_STYLES } from "@data";
import {
  apply_dynamics_gravity,
  extract_entity_dynamics_baselines,
  compute_dynamics_deltas,
  evaluate_subtext_protocols,
  evaluate_dynamics_rules,
  DYNAMICS_AXES,
  DYNAMICS_RULES,
  render_dynamics_axes_xml,
  PHYSICS_PROTOCOLS,
} from "./physics.js";

describe("physics.js", () => {
  describe("DYNAMICS_AXES", () => {
    it("defines all 6 axes with label, low, and high spectrum bounds (without desc)", () => {
      const axes = ["chaos", "intensity", "openness", "affinity", "velocity", "entropy"];
      for (const axis of axes) {
        expect(DYNAMICS_AXES[axis]).toBeDefined();
        expect(DYNAMICS_AXES[axis].label).toBeTruthy();
        expect(DYNAMICS_AXES[axis].low).toBeTruthy();
        expect(DYNAMICS_AXES[axis].high).toBeTruthy();
        expect(DYNAMICS_AXES[axis].desc).toBeUndefined();
      }
    });
  });

  describe("extract_entity_dynamics_baselines", () => {
    it("returns dynamics_baseline when set", () => {
      const entity = { dynamics_baseline: { chaos: 42, intensity: 55 } };
      const baselines = extract_entity_dynamics_baselines(entity);
      expect(baselines).toEqual({ chaos: 42, intensity: 55 });
    });

    it("returns empty object when neither is set", () => {
      const entity = {};
      const baselines = extract_entity_dynamics_baselines(entity);
      expect(baselines).toEqual({});
    });

    it("returns empty object when entity is null or undefined", () => {
      expect(extract_entity_dynamics_baselines(null)).toEqual({});
      expect(extract_entity_dynamics_baselines(undefined)).toEqual({});
    });
  });

  describe("apply_dynamics_gravity", () => {
    it("pulls dynamics toward baselines", () => {
      const dynamics = { chaos: 80, intensity: 80, openness: 20, affinity: 20 };
      const baselines = { chaos: 30, intensity: 40, openness: 70, affinity: 65 };

      // Run settlement multiple times to observe gravity pull
      for (let i = 0; i < 50; i++) {
        apply_dynamics_gravity(dynamics, baselines, 50, 0.15);
      }

      // After many iterations with strong gravity, values should move toward baselines
      expect(dynamics.chaos).toBeLessThan(80);
      expect(dynamics.openness).toBeGreaterThan(20);
    });

    it("clamps values to 0-100 bounds", () => {
      const dynamics = { chaos: 200, intensity: -50 };
      apply_dynamics_gravity(dynamics, {}, 50, 0.1);
      expect(dynamics.chaos).toBeLessThanOrEqual(100);
      expect(dynamics.intensity).toBeGreaterThanOrEqual(0);
    });

    it("does nothing when dynamics is null or not an object", () => {
      expect(() => apply_dynamics_gravity(null, {}, 50, 0.1)).not.toThrow();
      expect(() => apply_dynamics_gravity(undefined, {}, 50, 0.1)).not.toThrow();
    });
  });

  describe("compute_dynamics_deltas", () => {
    it("purely computes deltas and formatted log strings using axis labels", () => {
      const dynamics = { chaos: 70, intensity: 40 };
      const runtime_target = { chaos: 50, intensity: 50 };

      const { deltas, log_strings } = compute_dynamics_deltas("ai", dynamics, runtime_target);

      expect(deltas).toEqual([
        { axis: "chaos", target: "ai", old_value: 50, new_value: 70, diff: 20 },
        { axis: "intensity", target: "ai", old_value: 50, new_value: 40, diff: -10 },
      ]);
      expect(log_strings).toEqual(["Chaos +20", "Intensity -10"]);
    });

    it("returns empty arrays when values are identical", () => {
      const dynamics = { chaos: 50 };
      const runtime_target = { chaos: 50 };

      const { deltas, log_strings } = compute_dynamics_deltas("fractal", dynamics, runtime_target);
      expect(deltas).toHaveLength(0);
      expect(log_strings).toHaveLength(0);
    });
  });

  describe("evaluate_subtext_protocols (Subtext Rules & Triggers Engine)", () => {
    it("evaluates global baseline triggers when intensity or entropy cross thresholds", () => {
      const ai_dynamics = { intensity: 75 };
      const fractal_dynamics = { entropy: 75 };

      const protocols = evaluate_subtext_protocols({ ai_dynamics, fractal_dynamics });
      const ids = protocols.map((s) => s.id);

      expect(ids).toContain("ADRENALINE");
      expect(ids).toContain("INSTABILITY");
    });

    it("evaluates EXPOSED trigger on high openness and moderate velocity", () => {
      const ai_dynamics = { openness: 75 };
      const fractal_dynamics = { velocity: 40 };

      const protocols = evaluate_subtext_protocols({ ai_dynamics, fractal_dynamics });
      const ids = protocols.map((s) => s.id);

      expect(ids).toContain("EXPOSED");
    });

    it("combines global triggers and active style triggers", () => {
      const style = NARRATIVE_STYLES.anais_nin;
      const ai_dynamics = { intensity: 65, affinity: 65, openness: 50 };

      const protocols = evaluate_subtext_protocols({ ai_dynamics, style });
      const ids = protocols.map((s) => s.id);

      expect(ids).toContain("LYRICAL");
    });

    it("evaluates composite triggers for dual-axis conditions", () => {
      // SUSPICION (openness < 30 && affinity < 30)
      let protocols = evaluate_subtext_protocols({ ai_dynamics: { openness: 20, affinity: 20 } });
      let ids = protocols.map((s) => s.id);
      expect(ids).toContain("SUSPICION");

      // CATACLYSM (velocity > 70 && entropy > 70)
      protocols = evaluate_subtext_protocols({ fractal_dynamics: { velocity: 80, entropy: 80 } });
      ids = protocols.map((s) => s.id);
      expect(ids).toContain("CATACLYSM");

      // CONFESSION (openness > 70 && velocity < 30)
      protocols = evaluate_subtext_protocols({ ai_dynamics: { openness: 75 }, fractal_dynamics: { velocity: 25 } });
      ids = protocols.map((s) => s.id);
      expect(ids).toContain("CONFESSION");

      // PASSION (intensity > 70 && affinity > 70)
      protocols = evaluate_subtext_protocols({ ai_dynamics: { intensity: 80, affinity: 80 } });
      ids = protocols.map((s) => s.id);
      expect(ids).toContain("PASSION");

      // TRANCE (intensity < 30 && chaos > 70)
      protocols = evaluate_subtext_protocols({ ai_dynamics: { intensity: 20, chaos: 85 } });
      ids = protocols.map((s) => s.id);
      expect(ids).toContain("TRANCE");

      // HARMONY (chaos < 30 && entropy < 30) suppresses single-axis STABILITY & RECOVERY
      protocols = evaluate_subtext_protocols({ ai_dynamics: { chaos: 20 }, fractal_dynamics: { entropy: 20 } });
      ids = protocols.map((s) => s.id);
      expect(ids).toContain("HARMONY");
      expect(ids).not.toContain("STABILITY");
      expect(ids).not.toContain("RECOVERY");

      // Single-axis STABILITY fires when chaos is neutral
      protocols = evaluate_subtext_protocols({ ai_dynamics: { chaos: 50 }, fractal_dynamics: { entropy: 20 } });
      ids = protocols.map((s) => s.id);
      expect(ids).toContain("STABILITY");
      expect(ids).not.toContain("HARMONY");
    });

    it("emits zero protocols when dynamics remain neutral", () => {
      const ai_dynamics = { intensity: 50, chaos: 50, openness: 50, affinity: 50 };
      const fractal_dynamics = { entropy: 50, velocity: 50 };

      const protocols = evaluate_subtext_protocols({ ai_dynamics, fractal_dynamics, style: NARRATIVE_STYLES.default });
      expect(protocols).toHaveLength(0);
    });
  });

  describe("render_dynamics_axes_xml scoping", () => {
    const dynamics = { chaos: 40, intensity: 60, openness: 30, affinity: 20, velocity: 40, entropy: 60 };

    it("filters to the somatic axes", () => {
      const xml = render_dynamics_axes_xml(dynamics, "somatic");
      expect(xml).toContain("<CHAOS");
      expect(xml).toContain("<INTENSITY");
      expect(xml).not.toContain("<VELOCITY");
      expect(xml).not.toContain("<ENTROPY");
    });

    it("filters to the fractal axes", () => {
      const xml = render_dynamics_axes_xml(dynamics, "fractal");
      expect(xml).toContain("<VELOCITY");
      expect(xml).toContain("<ENTROPY");
      expect(xml).not.toContain("<CHAOS");
    });

    it("renders every axis when no scope is given", () => {
      const xml = render_dynamics_axes_xml(dynamics, null);
      expect(xml).toContain("<CHAOS");
      expect(xml).toContain("<VELOCITY");
    });

    it("returns an empty string for empty dynamics", () => {
      expect(render_dynamics_axes_xml({}, "somatic")).toBe("");
      expect(render_dynamics_axes_xml(null, "somatic")).toBe("");
    });
  });

  describe("DYNAMICS_RULES (Unified Triggers & Non-Verbal Thresholds)", () => {
    it("contains both priority-ranked non-verbal rules and signal triggers", () => {
      const non_verbal_rules = DYNAMICS_RULES.filter((r) => r.priority !== undefined);
      const signal_triggers = DYNAMICS_RULES.filter((r) => r.priority === undefined);

      expect(non_verbal_rules.length).toBe(9);
      expect(signal_triggers.length).toBe(18);

      // Verify all non-verbal archetypes and triggers have protocols defined in PHYSICS_PROTOCOLS
      for (const rule of DYNAMICS_RULES) {
        expect(PHYSICS_PROTOCOLS[rule.id]).toBeDefined();
      }
    });

    it("evaluates somatic dynamics rules deterministically by priority", () => {
      // FEAR (intensity >= 75 && affinity <= 60, priority 85)
      // DYSREGULATION (chaos >= 75, priority 80)
      const dynamics = { intensity: 80, affinity: 40, chaos: 80 };
      const reactions = evaluate_dynamics_rules(dynamics, [], 2);

      expect(reactions).toEqual(["FEAR", "DYSREGULATION"]);
    });

    it("respects manual keyword overrides ahead of evaluated dynamics", () => {
      const dynamics = { intensity: 80, affinity: 40, chaos: 80 };
      const reactions = evaluate_dynamics_rules(dynamics, ["shame"], 2);

      expect(reactions).toEqual(["SHAME", "FEAR"]);
    });
  });
});
