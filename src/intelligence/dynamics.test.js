import { DYNAMICS_META, dynamics_engine } from "./dynamics.js";
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
});
