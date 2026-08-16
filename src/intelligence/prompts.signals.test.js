import { describe, expect, it } from "vitest";
import { evaluate_dynamics_signals } from "./prompts.js";
import { NARRATIVE_STYLES } from "@data";

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
