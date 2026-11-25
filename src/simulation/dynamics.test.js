import { describe, expect, it } from "vitest";
import { default_dynamics_for_scope } from "@definitions";
import { evaluate_dynamics_directives, resolve_caretaker_target, resolve_image_trigger, step_dynamics } from "./dynamics.js";

describe("step_dynamics", () => {
  it("settles toward baselines with the live physics (50+10 @entropy50 -> 59)", () => {
    const next = step_dynamics({ chaos: 50 }, { chaos: 50 }, { chaos: 10 }, { entropy: 50 });
    expect(next.chaos).toBe(59);
  });
  it("clamps to [5, 95]", () => {
    const next = step_dynamics({ chaos: 1 }, { chaos: 1 }, { chaos: -100 }, {});
    expect(next.chaos).toBeGreaterThanOrEqual(5);
  });
});

describe("protocols + rotation", () => {
  it("emits matching baseline protocols with directive text and no dead-zone guards", () => {
    const protocols = evaluate_dynamics_directives({ ai_dynamics: { chaos: 90, intensity: 75, affinity: 75 }, fractal_dynamics: {} });
    expect(protocols.every((p) => typeof p.text === "string" && p.text.length > 0)).toBe(true);
    const ids = protocols.map((p) => p.id);
    expect(ids).toContain("UNBOUND");
    expect(ids).toContain("ADRENALINE");
    expect(ids).toContain("ATTUNEMENT");
  });
  it("rotates caretaker target", () => {
    expect([0, 1, 2, 3].map((cursor) => resolve_caretaker_target(cursor))).toEqual(["AI", "USER", "FRACTAL", "AI"]);
  });

  it("builds neutral dynamics defaults per scope", () => {
    expect(default_dynamics_for_scope("character")).toEqual({ chaos: 50, intensity: 50, openness: 50, affinity: 50 });
    expect(default_dynamics_for_scope("fractal")).toEqual({ velocity: 50, entropy: 50 });
  });

  it("enforces mutual exclusion between single-axis protocols and Paradox Compounds", () => {
    const adr = evaluate_dynamics_directives({ ai_dynamics: { intensity: 75 }, fractal_dynamics: { velocity: 50 } }).map((p) => p.id);
    expect(adr).toContain("ADRENALINE");
    expect(adr).not.toContain("TENSION");

    const sus = evaluate_dynamics_directives({ ai_dynamics: { intensity: 50 }, fractal_dynamics: { velocity: 25 } }).map((p) => p.id);
    expect(sus).toContain("SUSPENSION");
    expect(sus).not.toContain("TENSION");

    const ten = evaluate_dynamics_directives({ ai_dynamics: { intensity: 75 }, fractal_dynamics: { velocity: 25 } }).map((p) => p.id);
    expect(ten).toContain("TENSION");
    expect(ten).not.toContain("ADRENALINE");
    expect(ten).not.toContain("SUSPENSION");
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
    expect(result.next_image_beat_round).toBeNull();
  });

  it("applies biased_character_tier on displacement triggers and respects scene-focus veto", () => {
    const biased = resolve_image_trigger({
      snapshot: { ai: { dynamics: { chaos: 65, intensity: 76 } }, fractal: { dynamics: { velocity: 65 } } },
      prev_dynamics: { ai: { chaos: 45, intensity: 60 }, fractal: { velocity: 50 } },
      director_data: { camera_note: "Close-up on her expression." },
      turn_round: 5,
      last_image_beat_round: -1,
    });
    expect(biased.active).toBe(true);
    expect(biased.tier).toBe("story_character");

    const vetoed = resolve_image_trigger({
      snapshot: { ai: { dynamics: { chaos: 65, intensity: 76 } }, fractal: { dynamics: { velocity: 65 } } },
      prev_dynamics: { ai: { chaos: 45, intensity: 60 }, fractal: { velocity: 50 } },
      director_data: { camera_note: "Wide establishing shot of the corridor." },
      turn_round: 5,
      last_image_beat_round: -1,
    });
    expect(vetoed.active).toBe(true);
    expect(vetoed.tier).toBe("story_scene");
  });
});
