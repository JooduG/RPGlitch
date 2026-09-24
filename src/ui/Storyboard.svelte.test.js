/**
 * @file src/ui/Storyboard.svelte.test.js
 * Unit test suite verifying the Storyboard state helpers
 * (compute_initials, deck_geometry, claimed_entity_lock).
 */
import { describe, expect, it } from "vitest";

import { claimed_entity_lock, deck_geometry, StoryboardController, storyboard } from "./Storyboard.svelte.js";
import { compute_initials } from "@utils";

// ---------------------------------------------------------------------------------------------
// HELPER LOGIC TESTS
// ---------------------------------------------------------------------------------------------

describe("compute_initials", () => {
  it("skips common name prefixes using the default stop list", () => {
    expect(compute_initials("Lord Benedict Silvers")).toBe("BS");
    expect(compute_initials("The One Ring")).toBe("OR");
    expect(compute_initials("Sir Reginald")).toBe("R");
    expect(compute_initials("Alexander The Great")).toBe("AG");
  });

  it("honors caller-supplied stop words", () => {
    expect(compute_initials("Sir Reginald", new Set(["sir"]))).toBe("R");
    expect(compute_initials("Alexander The Great", new Set([]))).toBe("ATG");
  });

  it("strips punctuation and non-letter characters, keeps unicode letters", () => {
    expect(compute_initials("María José")).toBe("MJ");
    expect(compute_initials("Glitch-7 (hacker)")).toBe("GH");
  });

  it("caps at three initials and falls back to the raw words when all are prefixes", () => {
    expect(compute_initials("Dr. Professor Lord")).toBe("P");
    expect(compute_initials("Dr Lord Prof")).toBe("DLP");
    expect(compute_initials("the", new Set(["the"]))).toBe("T");
  });

  it("returns ? for empty or symbol-only names", () => {
    expect(compute_initials("")).toBe("?");
    expect(compute_initials("   ")).toBe("?");
    expect(compute_initials(null)).toBe("?");
  });
});

describe("deck_geometry", () => {
  it("centers the deck below the slot with default pickup scale and clearance", () => {
    expect(deck_geometry({ width: 1000, height: 800 }, { width: 200, height: 300 })).toEqual({
      left: 438,
      top: 567.5,
      width: 124,
      height: 186,
    });
  });

  it("clamps to the viewport origin when the deck would overflow", () => {
    expect(deck_geometry({ width: 100, height: 100 }, { width: 200, height: 100 })).toEqual({
      left: 0,
      top: 22.5,
      width: 124,
      height: 62,
    });
  });

  it("respects custom pickup scale and deck clearance", () => {
    expect(deck_geometry({ width: 1000, height: 800 }, { width: 200, height: 300 }, { pickup_scale: 0.5, deck_clearance: 1 })).toEqual({
      left: 450,
      top: 650,
      width: 100,
      height: 150,
    });
  });
});

describe("claimed_entity_lock", () => {
  const ai = { id: "a1" };
  const user = { id: "u1" };
  const fractal = { id: "f1" };

  it("returns the first selected entity claimed by an active story", () => {
    expect(claimed_entity_lock([ai, user, fractal], ["u1"])).toBe(user);
    expect(claimed_entity_lock([ai, user, fractal], ["f1", "a1"])).toBe(ai);
  });

  it("returns null when no selected entity is claimed", () => {
    expect(claimed_entity_lock([ai, user, fractal], ["zz"])).toBeNull();
    expect(claimed_entity_lock([], ["a1"])).toBeNull();
  });

  it("ignores null/undefined slots and unmatched ids", () => {
    expect(claimed_entity_lock([ai, null, fractal], ["f1"])).toBe(fractal);
    expect(claimed_entity_lock([{ id: null }, { id: undefined }], [null])).toBeNull();
  });
});

// ---------------------------------------------------------------------------------------------
// STORYBOARD CONTROLLER REACTIVITY TESTS
// ---------------------------------------------------------------------------------------------

describe("StoryboardController", () => {
  it("initializes with default non-shuffling, non-flight state", () => {
    const controller = new StoryboardController();
    expect(controller.is_shuffling).toBe(false);
    expect(controller.begin_flight_started).toBe(false);
  });

  it("allows setting and reading begin_flight_started flag", () => {
    const controller = new StoryboardController();
    controller.begin_flight_started = true;
    expect(controller.begin_flight_started).toBe(true);
    controller.begin_flight_started = false;
    expect(controller.begin_flight_started).toBe(false);
  });

  it("exports a singleton storyboard instance with reactive properties", () => {
    expect(storyboard).toBeDefined();
    expect(typeof storyboard.shuffle).toBe("function");
    expect(typeof storyboard.begin).toBe("function");
    expect(typeof storyboard.is_shuffling).toBe("boolean");
  });
});

/**
 * CHANGELOG:
 * - 2026-09-24: Added unit tests for StoryboardController reactive properties (is_shuffling, begin_flight_started).
 * - 2026-06-15: Initialized unit tests for deck_geometry and claimed_entity_lock.
 */
