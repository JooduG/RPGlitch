import { describe, expect, it } from "vitest";
import { evaluate_dynamics_directives, resolve_caretaker_target, resolve_image_trigger, step_dynamics } from "./dynamics.js";

describe("step_dynamics", () => {
  it("settles toward baselines with the live physics (50+10 @entropy50 -> 59)", () => {
    const { next } = step_dynamics({ chaos: 50 }, { chaos: 50 }, { chaos: 10 }, { entropy: 50 });
    expect(next.chaos).toBe(59);
  });
  it("clamps to [min,max]", () => {
    const { next } = step_dynamics({ chaos: 1 }, { chaos: 1 }, { chaos: -100 }, {});
    expect(next.chaos).toBeGreaterThanOrEqual(5);
  });
});

describe("directives + rotation", () => {
  it("returns at most max_directives", () => {
    const { directives } = evaluate_dynamics_directives({ ai_dynamics: { chaos: 90 }, fractal_dynamics: {}, style: null, max_directives: 1 });
    expect(directives.length).toBeLessThanOrEqual(1);
  });
  it("rotates caretaker target", () => {
    expect(typeof resolve_caretaker_target(0, {})).toBe("string");
  });
});

describe("resolve_image_trigger", () => {
  it("triggers on extreme band crossing when cooldown elapsed and returns next_image_beat_round", () => {
    const result = resolve_image_trigger({
      snapshot: { ai: { dynamics: { intensity: 86 } }, fractal: { dynamics: {} } },
      prev_dynamics: { ai: { intensity: 70 }, fractal: {} },
      director_data: { camera_note: "Close-up on her eyes." },
      turn_round: 4,
      last_image_beat_round: 1,
    });
    expect(result.active).toBe(true);
    expect(result.source).toBe("dynamics");
    expect(result.tier).toBe("story_character");
    expect(result.next_image_beat_round).toBe(4);
  });

  it("enforces unified cooldown from last_image_beat_round", () => {
    const result = resolve_image_trigger({
      snapshot: { ai: { dynamics: { intensity: 90 } }, fractal: { dynamics: {} } },
      prev_dynamics: { ai: { intensity: 60 }, fractal: {} },
      director_data: {},
      turn_round: 3,
      last_image_beat_round: 1,
    });
    expect(result.active).toBe(false);
    expect(result.tier).toBeNull();
    expect(result.source).toBeNull();
    expect(result.next_image_beat_round).toBeNull();
  });
});
