import { describe, expect, it } from "vitest";
import { evaluate_dynamics_directives, resolve_caretaker_target, step_dynamics } from "./dynamics.js";

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
