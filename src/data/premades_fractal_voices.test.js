/**
 * @file src/data/premades_fractal_voices.test.js
 * Unit tests verifying premade Fractal entities have female Kokoro voice configurations.
 */
import { describe, expect, it } from "vitest";
import { premade } from "./premades.js";

describe("Premade Fractal Voices", () => {
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
