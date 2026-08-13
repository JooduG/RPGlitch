import { describe, expect, it } from "vitest";
import { evaluate_dynamics_signals } from "./dynamics.js";
import { NARRATIVE_STYLES } from "@data";

describe("evaluate_dynamics_signals (Unified Signals & Triggers Engine)", () => {
  it("evaluates global baseline triggers when intensity or entropy cross thresholds", () => {
    const ai_dynamics = { intensity: 75 };
    const fractal_dynamics = { entropy: 75 };

    const signals = evaluate_dynamics_signals({ ai_dynamics, fractal_dynamics });
    const ids = signals.map((s) => s.id);

    expect(ids).toContain("ADRENALINE");
    expect(ids).toContain("HIGH_ENTROPY");
  });

  it("combines global triggers and active style triggers", () => {
    const style = NARRATIVE_STYLES.anais_nin;
    const ai_dynamics = { intensity: 65, affinity: 65, openness: 50 };

    const signals = evaluate_dynamics_signals({ ai_dynamics, style });
    const ids = signals.map((s) => s.id);

    expect(ids).toContain("ANAIS_NIN_LYRICAL");
  });

  it("emits zero signals when dynamics remain neutral", () => {
    const ai_dynamics = { intensity: 50, chaos: 50, openness: 50, affinity: 50 };
    const fractal_dynamics = { entropy: 50, velocity: 50 };

    const signals = evaluate_dynamics_signals({ ai_dynamics, fractal_dynamics, style: NARRATIVE_STYLES.default });
    expect(signals).toHaveLength(0);
  });
});
