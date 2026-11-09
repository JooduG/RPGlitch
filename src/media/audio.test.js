/**
 * @file src/media/audio.test.js
 * Unit tests verifying audio engine and premade voice configurations.
 */
import { describe, expect, it } from "vitest";
import { PREMADE_FRACTALS } from "@storage";
import { get_cadence_rate, normalize_role, resolve_voice_name, resolve_voice_uri, Audio, play_sfx, set_master_volume, toggle_mute } from "./audio.js";

describe("normalize_role", () => {
  it("normalizes roles to internal keys", () => {
    expect(normalize_role("AI_CHARACTER")).toBe("ai");
    expect(normalize_role("model")).toBe("ai");
    expect(normalize_role("USER_PERSONA")).toBe("user");
    expect(normalize_role("user")).toBe("user");
    expect(normalize_role("system")).toBe(null);
    expect(normalize_role(null)).toBe(null);
  });

  it("maps fractal and npc to ai by default for unified toggle", () => {
    expect(normalize_role("fractal")).toBe("ai");
    expect(normalize_role("npc")).toBe("ai");
  });

  it("preserves fractal and npc when preserve_npc is true", () => {
    expect(normalize_role("fractal", { preserve_npc: true })).toBe("fractal");
    expect(normalize_role("npc-1", { preserve_npc: true })).toBe("npc");
  });
});

describe("Audio & Voice Configurations", () => {
  it("assigns valid voice configurations to all premade fractals", () => {
    expect(PREMADE_FRACTALS.length).toBeGreaterThan(0);

    PREMADE_FRACTALS.forEach((fractal) => {
      expect(fractal.voice).toBeDefined();
      expect(typeof (fractal.voice.name || fractal.voice.uri)).toBe("string");
      expect(typeof fractal.voice.cadence).toBe("string");
    });
  });

  it("calculates cadence rates with dynamics offsets accurately", () => {
    expect(get_cadence_rate("standard", 50)).toBe(1.0);
    expect(get_cadence_rate("standard", 100)).toBeCloseTo(1.05, 3);
    expect(get_cadence_rate("standard", 0)).toBeCloseTo(0.95, 3);
    expect(get_cadence_rate("drawl", 50)).toBe(0.85);
    expect(get_cadence_rate("rapid", 50)).toBe(1.2);
  });

  it("resolves voice URIs and names cleanly", () => {
    expect(resolve_voice_uri("custom_voice")).toBe("custom_voice");
    expect(resolve_voice_uri(null)).toBe("default");
    expect(resolve_voice_name("Hero")).toBe("Hero");
  });

  it("provides functional play_sfx interface", () => {
    expect(() => play_sfx("click")).not.toThrow();
    expect(() => play_sfx("pop")).not.toThrow();
    expect(() => play_sfx("glitch")).not.toThrow();
    expect(() => play_sfx("alert")).not.toThrow();
    expect(() => play_sfx("subtle_hum")).not.toThrow();
  });

  it("verifies AudioContext lifecycle and Audio facade methods", async () => {
    expect(typeof Audio.init).toBe("function");
    expect(typeof Audio.destroy).toBe("function");
    expect(typeof Audio.play).toBe("function");
    expect(typeof Audio.toggle_entity_voice).toBe("function");

    // Audio properties
    expect(Audio.voice).toBeDefined();
    expect(Audio.entity_voice).toBeDefined();
    expect(typeof Audio.volume).toBe("number");

    // Standalone volume and mute functions
    set_master_volume(0.3);
    expect(Audio.volume).toBe(0.3);
    const initial_mute = Audio.is_muted;
    const toggled = toggle_mute();
    expect(toggled).toBe(!initial_mute);
    expect(Audio.is_muted).toBe(toggled);
    toggle_mute(); // restore

    // Invoking destroy safely executes without unhandled exceptions
    expect(() => Audio.destroy()).not.toThrow();
  });
});
