/**
 * @file src/media/audio.test.js
 * Unit tests verifying audio engine, voice role gating, and notifications.
 */
import { describe, expect, it } from "vitest";
import { get_cadence_rate, voice_role_key, resolve_voice_name, resolve_voice_uri, Audio, play_sfx } from "./audio.svelte.js";

describe("voice_role_key", () => {
  it("normalizes roles to per-role voice keys", () => {
    expect(voice_role_key("AI_CHARACTER")).toBe("ai");
    expect(voice_role_key("model")).toBe("ai");
    expect(voice_role_key("npc")).toBe("ai");
    expect(voice_role_key("npc-1")).toBe("ai");
    expect(voice_role_key("USER_PERSONA")).toBe("user");
    expect(voice_role_key("user")).toBe("user");
    expect(voice_role_key("fractal")).toBe("fractal");
    expect(voice_role_key("system")).toBe(null);
    expect(voice_role_key(null)).toBe(null);
  });
});

describe("Audio & Voice Configurations", () => {
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

  it("provides functional play_sfx interface including notification cue", () => {
    expect(() => play_sfx("click")).not.toThrow();
    expect(() => play_sfx("pop")).not.toThrow();
    expect(() => play_sfx("glitch")).not.toThrow();
    expect(() => play_sfx("alert")).not.toThrow();
    expect(() => play_sfx("subtle_hum")).not.toThrow();
    expect(() => play_sfx("notification")).not.toThrow();
  });

  it("verifies AudioContext lifecycle, notifications gate, pause state, and Audio facade", async () => {
    expect(typeof Audio.init).toBe("function");
    expect(typeof Audio.destroy).toBe("function");
    expect(typeof Audio.play).toBe("function");
    expect(typeof Audio.toggle_entity_voice).toBe("function");

    expect(Audio.voice).toBeDefined();
    expect(Audio.entity_voice).toBeDefined();
    expect(Audio.voice.is_paused).toBe(false);
    expect(typeof Audio.volume).toBe("number");

    Audio.volume = 0.3;
    expect(Audio.volume).toBe(0.3);
    const initial_mute = Audio.is_muted;
    Audio.is_muted = !initial_mute;
    expect(Audio.is_muted).toBe(!initial_mute);
    Audio.is_muted = initial_mute;

    Audio.notifications_enabled = false;
    expect(() => Audio.play("notification")).not.toThrow();

    Audio.voice.pause();
    expect(Audio.voice.is_paused).toBe(true);
    Audio.voice.resume();
    expect(Audio.voice.is_paused).toBe(false);

    expect(() => Audio.destroy()).not.toThrow();
  });
});
