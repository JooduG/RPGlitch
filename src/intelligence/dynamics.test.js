import { DYNAMICS_META, dynamics_engine, evaluate_image_trigger } from "./dynamics.js";
import { describe, expect, it } from "vitest";

describe("dynamics.js", () => {
  describe("DYNAMICS_META", () => {
    it("defines all 6 axes with label and desc", () => {
      const axes = ["chaos", "intensity", "openness", "affinity", "velocity", "entropy"];
      for (const axis of axes) {
        expect(DYNAMICS_META[axis]).toBeDefined();
        expect(DYNAMICS_META[axis].label).toBeTruthy();
        expect(DYNAMICS_META[axis].desc).toBeTruthy();
      }
    });
  });

  describe("dynamics_engine._get_baselines", () => {
    it("returns dynamicsBaseline when set", () => {
      const entity = { dynamicsBaseline: { chaos: 42, intensity: 55 } };
      const baselines = dynamics_engine._get_baselines(entity);
      expect(baselines).toEqual({ chaos: 42, intensity: 55 });
    });

    it("returns empty object when neither is set", () => {
      const entity = {};
      const baselines = dynamics_engine._get_baselines(entity);
      expect(baselines).toEqual({});
    });

    it("returns empty object when entity is null or undefined", () => {
      expect(dynamics_engine._get_baselines(null)).toEqual({});
      expect(dynamics_engine._get_baselines(undefined)).toEqual({});
    });
  });

  describe("dynamics_engine.settle_physics", () => {
    it("pulls dynamics toward baselines", () => {
      const dynamics = { chaos: 80, intensity: 80, openness: 20, affinity: 20 };
      const baselines = { chaos: 30, intensity: 40, openness: 70, affinity: 65 };

      // Run settlement multiple times to observe gravity pull
      for (let i = 0; i < 50; i++) {
        dynamics_engine.settle_physics(dynamics, baselines, 50, 0.15);
      }

      // After many iterations with strong gravity, values should move toward baselines
      expect(dynamics.chaos).toBeLessThan(80);
      expect(dynamics.openness).toBeGreaterThan(20);
    });

    it("clamps values to 0-100 bounds", () => {
      const dynamics = { chaos: 200, intensity: -50 };
      dynamics_engine.settle_physics(dynamics, {}, 50, 0.1);
      expect(dynamics.chaos).toBeLessThanOrEqual(100);
      expect(dynamics.intensity).toBeGreaterThanOrEqual(0);
    });

    it("does nothing when dynamics is null or not an object", () => {
      expect(() => dynamics_engine.settle_physics(null, {}, 50, 0.1)).not.toThrow();
      expect(() => dynamics_engine.settle_physics(undefined, {}, 50, 0.1)).not.toThrow();
    });
  });

  describe("evaluate_image_trigger", () => {
    it("fires when an axis ENTERS the extreme-high band (82 -> 88)", () => {
      const signal = evaluate_image_trigger([{ axis: "chaos", target: "ai", old_value: 82, new_value: 88, diff: 6 }]);
      expect(signal.fired).toBe(true);
      expect(signal.crossed).toBe(true);
      expect(signal.reasons).toContain("crossed:ai.chaos");
    });

    it("fires when an axis ENTERS the extreme-low band (18 -> 12)", () => {
      const signal = evaluate_image_trigger([{ axis: "entropy", target: "fractal", old_value: 18, new_value: 12, diff: -6 }]);
      expect(signal.fired).toBe(true);
      expect(signal.reasons).toContain("crossed:fractal.entropy");
    });

    it("does NOT fire when leaving an extreme band (88 -> 74)", () => {
      const signal = evaluate_image_trigger([{ axis: "chaos", target: "ai", old_value: 88, new_value: 74, diff: -14 }]);
      expect(signal.fired).toBe(false);
    });

    it("does NOT fire on a mid-band move (76 -> 74)", () => {
      const signal = evaluate_image_trigger([{ axis: "chaos", target: "ai", old_value: 76, new_value: 74, diff: -2 }]);
      expect(signal.fired).toBe(false);
    });

    it("does NOT fire when moving within the extreme band (86 -> 91)", () => {
      const signal = evaluate_image_trigger([{ axis: "chaos", target: "ai", old_value: 86, new_value: 91, diff: 5 }]);
      expect(signal.fired).toBe(false);
    });

    it("fires on Signal A when the sum of |deltas| crosses the threshold even with no band entry", () => {
      const deltas = [
        { axis: "intensity", target: "ai", old_value: 50, new_value: 65, diff: 15 },
        { axis: "affinity", target: "ai", old_value: 50, new_value: 30, diff: -20 },
        { axis: "openness", target: "ai", old_value: 50, new_value: 70, diff: 20 },
        { axis: "velocity", target: "fractal", old_value: 50, new_value: 75, diff: 25 },
      ];
      const signal = evaluate_image_trigger(deltas);
      expect(signal.fired).toBe(true);
      expect(signal.crossed).toBe(false);
      expect(signal.sum).toBe(80);
    });

    it("does not fire when the summed movement stays below the threshold", () => {
      const deltas = [{ axis: "intensity", target: "ai", old_value: 50, new_value: 62, diff: 12 }];
      const signal = evaluate_image_trigger(deltas);
      expect(signal.fired).toBe(false);
    });

    it("returns a clean non-firing signal for empty/null input", () => {
      expect(evaluate_image_trigger()).toEqual({ fired: false, crossed: false, sum: 0, reasons: [] });
      expect(evaluate_image_trigger([])).toEqual({ fired: false, crossed: false, sum: 0, reasons: [] });
      expect(evaluate_image_trigger(null)).toEqual({ fired: false, crossed: false, sum: 0, reasons: [] });
    });
  });
});
