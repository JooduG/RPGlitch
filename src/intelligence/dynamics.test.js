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
    const prev = { ai: { chaos: 50, intensity: 50, openness: 50, affinity: 50 }, fractal: { velocity: 50, entropy: 50 } };

    it("returns not triggered when nothing moves", () => {
      const result = evaluate_image_trigger(prev, prev);
      expect(result.triggered).toBe(false);
      expect(result.signals.band_entry).toBeNull();
      expect(result.signals.displacement).toBe(0);
    });

    it("Signal B: triggers when an axis ENTERS the high band (82 -> 88)", () => {
      const current = { ...prev, ai: { ...prev.ai, intensity: 88 } };
      const result = evaluate_image_trigger(current, prev);
      expect(result.triggered).toBe(true);
      expect(result.signals.band_entry).toEqual({ axis: "intensity", from: 50, to: 88, band: "high" });
      expect(result.tier).toBe("story_scene");
    });

    it("Signal B: triggers when an axis ENTERS the low band (18 -> 12)", () => {
      const current = { ...prev, fractal: { ...prev.fractal, entropy: 12 } };
      const result = evaluate_image_trigger(current, prev);
      expect(result.triggered).toBe(true);
      expect(result.signals.band_entry).toEqual({ axis: "entropy", from: 50, to: 12, band: "low" });
    });

    it("Signal B: does NOT trigger when an axis LEAVES the high band (88 -> 74)", () => {
      const from_band = { ...prev, ai: { ...prev.ai, intensity: 88 } };
      const current = { ...prev, ai: { ...prev.ai, intensity: 74 } };
      const result = evaluate_image_trigger(current, from_band);
      expect(result.triggered).toBe(false);
      expect(result.signals.band_entry).toBeNull();
    });

    it("Signal B: does NOT trigger when moving WITHIN the band (76 -> 74)", () => {
      const in_band = { ...prev, ai: { ...prev.ai, intensity: 76 } };
      const current = { ...prev, ai: { ...prev.ai, intensity: 74 } };
      const result = evaluate_image_trigger(current, in_band);
      expect(result.triggered).toBe(false);
      expect(result.signals.band_entry).toBeNull();
    });

    it("Signal B: does NOT trigger when already inside the band (88 -> 90)", () => {
      const in_band = { ...prev, ai: { ...prev.ai, intensity: 88 } };
      const current = { ...prev, ai: { ...prev.ai, intensity: 90 } };
      const result = evaluate_image_trigger(current, in_band);
      expect(result.triggered).toBe(false);
      expect(result.signals.band_entry).toBeNull();
    });

    it("Signal A: triggers when total displacement across all axes is >= 60", () => {
      const current = {
        ai: { chaos: 60, intensity: 60, openness: 60, affinity: 60 },
        fractal: { velocity: 60, entropy: 60 },
      };
      const result = evaluate_image_trigger(current, prev);
      expect(result.triggered).toBe(true);
      expect(result.signals.band_entry).toBeNull();
      expect(result.signals.displacement).toBe(60);
      expect(result.deltas).toHaveLength(6);
    });

    it("Signal A: does not trigger below the displacement threshold", () => {
      const current = { ai: { ...prev.ai, intensity: 55 }, fractal: prev.fractal };
      const result = evaluate_image_trigger(current, prev);
      expect(result.triggered).toBe(false);
      expect(result.signals.displacement).toBe(5);
    });

    it("respects custom band and displacement options", () => {
      const current = { ...prev, ai: { ...prev.ai, intensity: 70 } };
      const result = evaluate_image_trigger(current, prev, { band_high: 70, band_low: 30, displacement_threshold: 100 });
      expect(result.triggered).toBe(true);
      expect(result.signals.band_entry?.band).toBe("high");
    });

    it("returns the configured default tier", () => {
      const current = { ...prev, fractal: { ...prev.fractal, entropy: 90 } };
      const result = evaluate_image_trigger(current, prev, { default_tier: "story_entities" });
      expect(result.tier).toBe("story_entities");
    });

    it("handles missing/partial entity maps gracefully", () => {
      const result = evaluate_image_trigger(null, undefined);
      expect(result.triggered).toBe(false);
      expect(result.deltas).toEqual([]);
    });
  });
});
