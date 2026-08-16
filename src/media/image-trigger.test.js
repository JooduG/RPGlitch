import { describe, it, expect } from "vitest";
import { evaluate_image_trigger, resolve_image_trigger } from "./image-trigger.js";

describe("evaluate_image_trigger (Pure-JS Dynamics Gate)", () => {
  it("triggers on Signal B high-band entry (transitioning into >= 85)", () => {
    const prev = { ai: { intensity: 80 } };
    const curr = { ai: { intensity: 88 } };
    const res = evaluate_image_trigger(curr, prev);

    expect(res.triggered).toBe(true);
    expect(res.signals.band_entry).toEqual({ axis: "intensity", from: 80, to: 88, band: "high" });
    expect(res.tier).toBe("story_character");
  });

  it("triggers on Signal B low-band entry (transitioning into <= 15)", () => {
    const prev = { fractal: { entropy: 20 } };
    const curr = { fractal: { entropy: 12 } };
    const res = evaluate_image_trigger(curr, prev);

    expect(res.triggered).toBe(true);
    expect(res.signals.band_entry).toEqual({ axis: "entropy", from: 20, to: 12, band: "low" });
    expect(res.tier).toBe("story_scene");
  });

  it("does not trigger when staying within an extreme band", () => {
    const prev = { ai: { intensity: 86 } };
    const curr = { ai: { intensity: 90 } };
    const res = evaluate_image_trigger(curr, prev);

    expect(res.triggered).toBe(false);
    expect(res.signals.band_entry).toBeNull();
  });

  it("triggers on Signal A displacement sum exceeding threshold (60)", () => {
    const prev = { ai: { intensity: 50, dominance: 50 }, fractal: { entropy: 50 } };
    const curr = { ai: { intensity: 75, dominance: 70 }, fractal: { entropy: 70 } }; // |25| + |20| + |20| = 65 >= 60
    const res = evaluate_image_trigger(curr, prev);

    expect(res.triggered).toBe(true);
    expect(res.signals.displacement).toBe(65);
    expect(res.tier).toBe("story_scene");
  });

  it("handles non-finite values safely without crashing", () => {
    const prev = { ai: { intensity: NaN } };
    const curr = { ai: { intensity: 50 } };
    const res = evaluate_image_trigger(curr, prev);

    expect(res.triggered).toBe(false);
  });
});

describe("resolve_image_trigger (Dual-Source & Cooldown Orchestration)", () => {
  it("resolves dynamics trigger when cooldown has elapsed", () => {
    const snapshot = { ai: { dynamics: { intensity: 90 } } };
    const prev_dynamics = { ai: { intensity: 50 } };
    const res = resolve_image_trigger({
      snapshot,
      prev_dynamics,
      director_data: {},
      turn_round: 4,
      last_auto: 0,
    });

    expect(res.active).toBe(true);
    expect(res.tier).toBe("story_character");
    expect(res.source).toBe("dynamics");
    expect(res.next_auto_round).toBe(4);
  });

  it("suppresses dynamics trigger when cooldown is active", () => {
    const snapshot = { ai: { dynamics: { intensity: 90 } } };
    const prev_dynamics = { ai: { intensity: 50 } };
    const res = resolve_image_trigger({
      snapshot,
      prev_dynamics,
      director_data: {},
      turn_round: 2,
      last_auto: 1, // 2 < 1 + 3
    });

    expect(res.active).toBe(false);
    expect(res.tier).toBeNull();
  });

  it("allows director explicit trigger with custom tier when cooldown elapsed", () => {
    const snapshot = { ai: { dynamics: { intensity: 50 } } };
    const prev_dynamics = { ai: { intensity: 50 } };
    const res = resolve_image_trigger({
      snapshot,
      prev_dynamics,
      director_data: { trigger_image: "story_entities" },
      turn_round: 5,
      last_auto: 2,
    });

    expect(res.active).toBe(true);
    expect(res.tier).toBe("story_entities");
    expect(res.source).toBe("director");
    expect(res.director_explicit).toBe(true);
    expect(res.next_auto_round).toBe(5);
  });
});
