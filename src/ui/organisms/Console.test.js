/**
 * @file src/ui/organisms/Console.test.js
 * Unit test suite verifying Console selection/shuffle/begin helpers and settings state.
 */
import { describe, expect, it } from "vitest";

import { app } from "../../state/app.svelte.js";
import { claimed_entity_lock, compute_initials, deck_geometry } from "./Console.svelte.js";

describe("Console & Settings State", () => {
  it("merges dev_grid_visible into dev_mode setting", () => {
    app.settings.dev_mode = true;
    app.save_settings();
    expect(app.settings.dev_grid_visible).toBe(true);

    app.settings.dev_mode = false;
    app.save_settings();
    expect(app.settings.dev_grid_visible).toBe(false);
  });
});

describe("compute_initials", () => {
  it("skips common name prefixes using the default stop list", () => {
    expect(compute_initials("Lord Valerius Vance")).toBe("VV");
    expect(compute_initials("The One Ring")).toBe("OR");
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
