/**
 * @file src/media/audio.test.js
 * Unit tests verifying audio engine and premade voice configurations.
 */
import { describe, expect, it } from "vitest";
import { premade } from "@data";

describe("Audio & Voice Configurations", () => {
  it("assigns valid voice configurations to all premade fractals", () => {
    const fractals = premade.entities.filter((e) => e.type === "fractal");
    expect(fractals.length).toBeGreaterThan(0);

    fractals.forEach((fractal) => {
      expect(fractal.voice).toBeDefined();
      expect(typeof (fractal.voice.name || fractal.voice.uri)).toBe("string");
      expect(typeof fractal.voice.cadence).toBe("string");
    });
  });
});
