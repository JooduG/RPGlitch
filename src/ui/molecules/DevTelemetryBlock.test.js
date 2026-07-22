import { describe, expect, test } from "vitest";

/**
 * Mirror of DevTelemetryBlock's dynamic filtering logic for unit testing.
 * @param {any} meta
 */
function processTelemetryMeta(meta = {}) {
  const ai = meta.ai || meta.dynamics || meta.snapshot?.ai || {};
  const fractal = meta.fractal || meta.fractal_dynamics || meta.snapshot?.fractal || {};
  const deltas = meta.deltas || [];

  const get_delta = (target, axis) => {
    return deltas.find((d) => d?.target === target && d?.axis === axis);
  };

  const has_explicit_deltas = Array.isArray(meta.deltas) || meta.type === "DYNAMICS_DELTA";

  const changed_ai = Object.entries(ai).filter(([axis]) => {
    if (!has_explicit_deltas) return true;
    const delta = get_delta("ai", axis);
    return delta && delta.diff !== 0;
  });

  const changed_fractal = Object.entries(fractal).filter(([axis]) => {
    if (!has_explicit_deltas) return true;
    const delta = get_delta("fractal", axis);
    return delta && delta.diff !== 0;
  });

  const has_any_dynamics_changes = changed_ai.length > 0 || changed_fractal.length > 0;

  return {
    changed_ai,
    changed_fractal,
    has_any_dynamics_changes,
  };
}

describe("DevTelemetryBlock Telemetry Logic", () => {
  test("filters out unchanged dynamics when deltas are present", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      ai: { chaos: 58, intensity: 60, openness: 42, affinity: 44 },
      fractal: { velocity: 56, entropy: 54 },
      deltas: [{ target: "ai", axis: "intensity", old_val: 55, new_val: 60, diff: 5 }],
    };

    const res = processTelemetryMeta(meta);
    expect(res.has_any_dynamics_changes).toBe(true);
    expect(res.changed_ai).toEqual([["intensity", 60]]);
    expect(res.changed_fractal).toEqual([]);
  });

  test("flags no dynamics changes when deltas array is empty", () => {
    const meta = {
      type: "DYNAMICS_DELTA",
      ai: { chaos: 58, intensity: 60, openness: 42, affinity: 44 },
      fractal: { velocity: 56, entropy: 54 },
      deltas: [],
    };

    const res = processTelemetryMeta(meta);
    expect(res.has_any_dynamics_changes).toBe(false);
    expect(res.changed_ai).toEqual([]);
    expect(res.changed_fractal).toEqual([]);
  });

  test("falls back to all dynamics when meta has no explicit deltas and not DYNAMICS_DELTA type", () => {
    const meta = {
      type: "CUSTOM_SNAPSHOT",
      ai: { chaos: 50, intensity: 50 },
      fractal: { velocity: 50 },
    };

    const res = processTelemetryMeta(meta);
    expect(res.has_any_dynamics_changes).toBe(true);
    expect(res.changed_ai).toEqual([
      ["chaos", 50],
      ["intensity", 50],
    ]);
    expect(res.changed_fractal).toEqual([["velocity", 50]]);
  });
});
