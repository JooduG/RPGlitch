import { describe, expect, it } from "vitest";
import { NARRATIVE_STYLES } from "@data";
import { physics_engine, evaluate_dynamics_signals, DYNAMICS_AXES } from "./physics.js";

describe("physics.js", () => {
  describe("DYNAMICS_AXES", () => {
    it("defines all 6 axes with label and desc", () => {
      const axes = ["chaos", "intensity", "openness", "affinity", "velocity", "entropy"];
      for (const axis of axes) {
        expect(DYNAMICS_AXES[axis]).toBeDefined();
        expect(DYNAMICS_AXES[axis].label).toBeTruthy();
        expect(DYNAMICS_AXES[axis].desc).toBeTruthy();
      }
    });
  });

  describe("physics_engine.extract_entity_dynamics_baselines", () => {
    it("returns dynamics_baseline when set", () => {
      const entity = { dynamics_baseline: { chaos: 42, intensity: 55 } };
      const baselines = physics_engine.extract_entity_dynamics_baselines(entity);
      expect(baselines).toEqual({ chaos: 42, intensity: 55 });
    });

    it("returns empty object when neither is set", () => {
      const entity = {};
      const baselines = physics_engine.extract_entity_dynamics_baselines(entity);
      expect(baselines).toEqual({});
    });

    it("returns empty object when entity is null or undefined", () => {
      expect(physics_engine.extract_entity_dynamics_baselines(null)).toEqual({});
      expect(physics_engine.extract_entity_dynamics_baselines(undefined)).toEqual({});
    });
  });

  describe("physics_engine.apply_dynamics_gravity", () => {
    it("pulls dynamics toward baselines", () => {
      const dynamics = { chaos: 80, intensity: 80, openness: 20, affinity: 20 };
      const baselines = { chaos: 30, intensity: 40, openness: 70, affinity: 65 };

      // Run settlement multiple times to observe gravity pull
      for (let i = 0; i < 50; i++) {
        physics_engine.apply_dynamics_gravity(dynamics, baselines, 50, 0.15);
      }

      // After many iterations with strong gravity, values should move toward baselines
      expect(dynamics.chaos).toBeLessThan(80);
      expect(dynamics.openness).toBeGreaterThan(20);
    });

    it("clamps values to 0-100 bounds", () => {
      const dynamics = { chaos: 200, intensity: -50 };
      physics_engine.apply_dynamics_gravity(dynamics, {}, 50, 0.1);
      expect(dynamics.chaos).toBeLessThanOrEqual(100);
      expect(dynamics.intensity).toBeGreaterThanOrEqual(0);
    });

    it("does nothing when dynamics is null or not an object", () => {
      expect(() => physics_engine.apply_dynamics_gravity(null, {}, 50, 0.1)).not.toThrow();
      expect(() => physics_engine.apply_dynamics_gravity(undefined, {}, 50, 0.1)).not.toThrow();
    });
  });

  describe("evaluate_dynamics_signals (Unified Signals & Triggers Engine)", () => {
    it("evaluates global baseline triggers when intensity or entropy cross thresholds", () => {
      const ai_dynamics = { intensity: 75 };
      const fractal_dynamics = { entropy: 75 };

      const signals = evaluate_dynamics_signals({ ai_dynamics, fractal_dynamics });
      const ids = signals.map((s) => s.id);

      expect(ids).toContain("ADRENALINE");
      expect(ids).toContain("INSTABILITY");
    });

    it("combines global triggers and active style triggers", () => {
      const style = NARRATIVE_STYLES.anais_nin;
      const ai_dynamics = { intensity: 65, affinity: 65, openness: 50 };

      const signals = evaluate_dynamics_signals({ ai_dynamics, style });
      const ids = signals.map((s) => s.id);

      expect(ids).toContain("ANAIS_NIN_LYRICAL");
    });

    it("evaluates composite triggers for dual-axis conditions", () => {
      // SUSPICION (openness < 30 && affinity < 30)
      let signals = evaluate_dynamics_signals({ ai_dynamics: { openness: 20, affinity: 20 } });
      let ids = signals.map((s) => s.id);
      expect(ids).toContain("SUSPICION");

      // CATACLYSM (velocity > 70 && entropy > 70)
      signals = evaluate_dynamics_signals({ fractal_dynamics: { velocity: 80, entropy: 80 } });
      ids = signals.map((s) => s.id);
      expect(ids).toContain("CATACLYSM");

      // CONFESSION (openness > 70 && velocity < 30)
      signals = evaluate_dynamics_signals({ ai_dynamics: { openness: 75 }, fractal_dynamics: { velocity: 25 } });
      ids = signals.map((s) => s.id);
      expect(ids).toContain("CONFESSION");

      // PASSION (intensity > 70 && affinity > 70)
      signals = evaluate_dynamics_signals({ ai_dynamics: { intensity: 80, affinity: 80 } });
      ids = signals.map((s) => s.id);
      expect(ids).toContain("PASSION");

      // TRANCE (intensity < 30 && chaos > 70)
      signals = evaluate_dynamics_signals({ ai_dynamics: { intensity: 20, chaos: 85 } });
      ids = signals.map((s) => s.id);
      expect(ids).toContain("TRANCE");

      // HARMONY (chaos < 30 && entropy < 30) suppresses single-axis STABILITY & RECOVERY
      signals = evaluate_dynamics_signals({ ai_dynamics: { chaos: 20 }, fractal_dynamics: { entropy: 20 } });
      ids = signals.map((s) => s.id);
      expect(ids).toContain("HARMONY");
      expect(ids).not.toContain("STABILITY");
      expect(ids).not.toContain("RECOVERY");

      // Single-axis STABILITY fires when chaos is neutral
      signals = evaluate_dynamics_signals({ ai_dynamics: { chaos: 50 }, fractal_dynamics: { entropy: 20 } });
      ids = signals.map((s) => s.id);
      expect(ids).toContain("STABILITY");
      expect(ids).not.toContain("HARMONY");
    });

    it("emits zero signals when dynamics remain neutral", () => {
      const ai_dynamics = { intensity: 50, chaos: 50, openness: 50, affinity: 50 };
      const fractal_dynamics = { entropy: 50, velocity: 50 };

      const signals = evaluate_dynamics_signals({ ai_dynamics, fractal_dynamics, style: NARRATIVE_STYLES.default });
      expect(signals).toHaveLength(0);
    });
  });
});
