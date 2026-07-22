/**
 * @file src/media/audio.test.js
 * Unit tests verifying audio engine and premade voice configurations.
 */
import { describe, expect, it } from "vitest";
import { premade } from "../data/premades.js";

describe("Audio & Voice Configurations", () => {
  it("assigns valid female voice configurations to all premade fractals", () => {
    const fractals = premade.entities.filter((e) => e.type === "fractal");
    expect(fractals.length).toBeGreaterThan(0);

    fractals.forEach((fractal) => {
      expect(fractal.voice).toBeDefined();
      expect(fractal.voice.uri).toMatch(/^(af_|bf_)/);
      expect(typeof fractal.voice.rate).toBe("number");
    });
  });
});
